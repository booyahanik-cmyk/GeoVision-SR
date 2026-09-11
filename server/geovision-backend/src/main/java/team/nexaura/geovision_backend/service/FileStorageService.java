package team.nexaura.geovision_backend.service;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import team.nexaura.geovision_backend.exception.FileValidationException;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {

    private final Path baseStoragePath;
    private final Path rawPath;
    private final Path processedPath;
    private final Path previewsPath;

    public FileStorageService(
            @Value("${geovision.upload.base-dir:uploads}") String baseDir
    ) {
        this.baseStoragePath = Paths.get(baseDir).toAbsolutePath().normalize();
        this.rawPath = this.baseStoragePath.resolve("raw").normalize();
        this.processedPath = this.baseStoragePath.resolve("processed").normalize();
        this.previewsPath = this.baseStoragePath.resolve("previews").normalize();
    }

    /**
     * Initializes the directory tree:
     * uploads/
     *  ├── raw/
     *  ├── processed/
     *  └── previews/
     */
    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(this.baseStoragePath);
            Files.createDirectories(this.rawPath);
            Files.createDirectories(this.processedPath);
            Files.createDirectories(this.previewsPath);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize storage directory structure: " + e.getMessage(), e);
        }
    }

    /**
     * Stores an uploaded multipart file into uploads/raw/
     *
     * @param file Incoming multipart file
     * @return Stored file metadata result (unique filename and absolute/relative path)
     */
    public StoredFileResult storeRawFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new FileValidationException("Cannot store an empty or null file.");
        }

        String originalFilename = sanitizeFilename(file.getOriginalFilename());
        String uniqueStoredFilename = System.currentTimeMillis() + "_"
                + UUID.randomUUID().toString().substring(0, 8) + "_"
                + originalFilename;

        Path targetLocation = this.rawPath.resolve(uniqueStoredFilename).normalize();

        // Security check: Ensure target location stays inside raw directory
        if (!targetLocation.startsWith(this.rawPath)) {
            throw new FileValidationException("Cannot store file outside current storage directory.");
        }

        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, targetLocation, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file '" + originalFilename + "': " + e.getMessage(), e);
        }

        // Relative path for database portability (e.g., uploads/raw/178913..._sample.tif)
        Path relativePath = Paths.get("uploads", "raw", uniqueStoredFilename);

        return new StoredFileResult(
                originalFilename,
                uniqueStoredFilename,
                targetLocation.toString(),
                relativePath.toString().replace('\\', '/')
        );
    }

    /**
     * Strips directory traversal sequences and illegal characters from filenames
     */
    public String sanitizeFilename(String filename) {
        if (filename == null || filename.isBlank()) {
            return "geospatial_" + System.currentTimeMillis();
        }

        // Strip path traversal sequences
        String cleanName = Paths.get(filename).getFileName().toString();
        // Remove null bytes and illegal characters
        cleanName = cleanName.replaceAll("[\\x00\\r\\n]", "").trim();
        if (cleanName.isBlank()) {
            return "geospatial_" + System.currentTimeMillis();
        }
        return cleanName;
    }

    public Path getRawPath() {
        return rawPath;
    }

    public Path getProcessedPath() {
        return processedPath;
    }

    public Path getPreviewsPath() {
        return previewsPath;
    }

    public record StoredFileResult(
            String originalFilename,
            String uniqueStoredFilename,
            String absolutePath,
            String relativePath
    ) {}
}
