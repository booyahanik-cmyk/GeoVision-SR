package team.nexaura.geovision_backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import team.nexaura.geovision_backend.entity.Imagery;
import team.nexaura.geovision_backend.entity.ImageryStatus;
import team.nexaura.geovision_backend.repository.ImageryRepository;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.concurrent.TimeUnit;

@Service
public class ImageEnhancementService {

    private static final Logger log = LoggerFactory.getLogger(ImageEnhancementService.class);

    private final String pythonPath;
    private final String scriptPath;
    private final FileStorageService fileStorageService;
    private final ImageryRepository imageryRepository;
    private final ObjectMapper objectMapper;
    private final ProcessingProgressPublisher progressPublisher;

    public ImageEnhancementService(
            @Value("${geovision.python.path:python}") String pythonPath,
            @Value("${geovision.enhancement.script-path:scripts/enhance_raster.py}") String scriptPath,
            FileStorageService fileStorageService,
            ImageryRepository imageryRepository,
            ObjectMapper objectMapper,
            ProcessingProgressPublisher progressPublisher
    ) {
        this.pythonPath = pythonPath;
        this.scriptPath = scriptPath;
        this.fileStorageService = fileStorageService;
        this.imageryRepository = imageryRepository;
        this.objectMapper = objectMapper;
        this.progressPublisher = progressPublisher;
    }

    /**
     * Executes the 4-stage Python OpenCV enhancement pipeline:
     * Raw TIFF -> Normalization -> Contrast (CLAHE) -> Noise Reduction (Bilateral) -> Sharpening -> Enhanced TIFF
     *
     * State lifecycle:
     * UPLOADED -> PROCESSING -> PROCESSED (or FAILED)
     */
    public Imagery enhanceImagery(Imagery imagery) {
        if (imagery == null) {
            throw new IllegalArgumentException("Imagery entity cannot be null.");
        }

        // 1. Transition to PROCESSING state and publish 0% milestone
        imagery.setStatus(ImageryStatus.PROCESSING);
        imagery = imageryRepository.save(imagery);
        log.info("Transitioned imagery #{} ({}) to PROCESSING state", imagery.getId(), imagery.getFilename());
        progressPublisher.publishProgress(imagery.getId(), 0, "INITIALIZING", "Initializing 4-stage OpenCV enhancement pipeline for " + imagery.getFilename());

        Path rawInputPath = Paths.get(imagery.getOriginalFilePath()).toAbsolutePath().normalize();
        if (!rawInputPath.toFile().exists()) {
            imagery.setStatus(ImageryStatus.FAILED);
            imageryRepository.save(imagery);
            progressPublisher.publishProgress(imagery.getId(), 0, "FAILED", "Raw input file does not exist: " + rawInputPath);
            throw new IllegalStateException("Raw input file does not exist: " + rawInputPath);
        }

        // 2. Prepare destination path in uploads/processed/enhanced_*.tif
        String baseName = Paths.get(imagery.getFilename()).getFileName().toString();
        // Ensure destination has a .tif extension for enhanced raster
        String outputName = "enhanced_" + (baseName.endsWith(".zip") ? baseName.replace(".zip", ".tif") : baseName);
        if (!outputName.toLowerCase().endsWith(".tif") && !outputName.toLowerCase().endsWith(".tiff")) {
            outputName = outputName + ".tif";
        }

        Path processedDestination = fileStorageService.getProcessedPath().resolve(outputName).toAbsolutePath().normalize();

        // 3. Resolve Python Script Location & Publish 25% milestone
        File scriptFile = resolveScriptFile();
        log.info("Invoking enhancement pipeline: {} {} --input {} --output {}",
                pythonPath, scriptFile.getAbsolutePath(), rawInputPath, processedDestination);

        progressPublisher.publishProgress(imagery.getId(), 25, "NORMALIZATION", "Stage 1: Dynamic Range Normalization (Percentile Min-Max 2%-98%)");

        try {
            ProcessBuilder processBuilder = new ProcessBuilder(
                    pythonPath,
                    scriptFile.getAbsolutePath(),
                    "--input",
                    rawInputPath.toString(),
                    "--output",
                    processedDestination.toString()
            );
            processBuilder.redirectErrorStream(false);

            Process process = processBuilder.start();

            // Publish mid-pipeline stages 50% and 75%
            progressPublisher.publishProgress(imagery.getId(), 50, "CONTRAST_ENHANCEMENT", "Stage 2: Contrast Limited Adaptive Histogram Equalization (CLAHE)");
            progressPublisher.publishProgress(imagery.getId(), 75, "NOISE_REDUCTION_SHARPENING", "Stage 3 & 4: Bilateral Edge-Preserving Filter & Unsharp Mask Sharpening");

            StringBuilder stdoutBuffer = new StringBuilder();
            StringBuilder stderrBuffer = new StringBuilder();

            try (BufferedReader stdoutReader = new BufferedReader(new InputStreamReader(process.getInputStream()));
                 BufferedReader stderrReader = new BufferedReader(new InputStreamReader(process.getErrorStream()))) {

                String line;
                while ((line = stdoutReader.readLine()) != null) {
                    stdoutBuffer.append(line).append("\n");
                }
                while ((line = stderrReader.readLine()) != null) {
                    stderrBuffer.append(line).append("\n");
                }
            }

            boolean finished = process.waitFor(60, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                imagery.setStatus(ImageryStatus.FAILED);
                imageryRepository.save(imagery);
                progressPublisher.publishProgress(imagery.getId(), 0, "FAILED", "Image enhancement timed out after 60 seconds.");
                throw new RuntimeException("Image enhancement timed out after 60 seconds.");
            }

            int exitCode = process.exitValue();
            if (exitCode != 0) {
                String errorMsg = stderrBuffer.toString().trim();
                log.error("Enhancement script failed (exit code {}): {}", exitCode, errorMsg);
                imagery.setStatus(ImageryStatus.FAILED);
                imageryRepository.save(imagery);
                progressPublisher.publishProgress(imagery.getId(), 0, "FAILED", "Enhancement script execution failed: " + errorMsg);
                throw new RuntimeException("Enhancement script execution failed: " + errorMsg);
            }

            // 4. Parse Telemetry JSON Output
            String jsonOutput = stdoutBuffer.toString().trim();
            log.info("Enhancement pipeline completed successfully: {}", jsonOutput);

            // Relative path for database portability (uploads/processed/enhanced_*.tif)
            String relativeStoredPath = "uploads/processed/" + outputName;

            // 5. Transition to PROCESSED state and persist metadata
            imagery.setEnhancedFilePath(relativeStoredPath);
            imagery.setEnhancementMetadata(jsonOutput);
            imagery.setStatus(ImageryStatus.PROCESSED);

            // If dimensions/bands were extracted from the enhanced raster, update if missing
            try {
                JsonNode root = objectMapper.readTree(jsonOutput);
                if (imagery.getWidth() == null && root.has("width")) {
                    imagery.setWidth(root.get("width").asInt());
                }
                if (imagery.getHeight() == null && root.has("height")) {
                    imagery.setHeight(root.get("height").asInt());
                }
                if (imagery.getBands() == null && root.has("channels")) {
                    imagery.setBands(root.get("channels").asInt());
                }
            } catch (Exception e) {
                log.warn("Could not parse dimensions from enhancement output: {}", e.getMessage());
            }

            Imagery saved = imageryRepository.save(imagery);

            // Publish 100% completion milestone
            progressPublisher.publishProgress(saved.getId(), 100, "COMPLETED", "Enhancement pipeline completed successfully. Master GeoTIFF and web previews ready.");

            return saved;

        } catch (Exception e) {
            log.error("Error during image enhancement for imagery #{}: {}", imagery.getId(), e.getMessage(), e);
            imagery.setStatus(ImageryStatus.FAILED);
            imageryRepository.save(imagery);
            throw new RuntimeException("Image enhancement failed: " + e.getMessage(), e);
        }
    }

    /**
     * Resolves the enhance_raster.py script from filesystem or classpath resources
     */
    private File resolveScriptFile() {
        File file = new File(scriptPath);
        if (file.exists()) {
            return file;
        }

        // Try relative to server directory
        File serverFile = new File("scripts/enhance_raster.py");
        if (serverFile.exists()) {
            return serverFile;
        }

        File srcFile = new File("src/main/resources/scripts/enhance_raster.py");
        if (srcFile.exists()) {
            return srcFile;
        }

        File rootFile = new File("server/geovision-backend/scripts/enhance_raster.py");
        if (rootFile.exists()) {
            return rootFile;
        }

        throw new IllegalStateException("Could not find enhance_raster.py script. Looked at: " + scriptPath);
    }
}
