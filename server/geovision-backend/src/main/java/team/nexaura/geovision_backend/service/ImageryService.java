package team.nexaura.geovision_backend.service;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import team.nexaura.geovision_backend.dto.response.ImageryResponseDto;
import team.nexaura.geovision_backend.entity.Imagery;
import team.nexaura.geovision_backend.entity.ImageryStatus;
import team.nexaura.geovision_backend.exception.ResourceNotFoundException;
import team.nexaura.geovision_backend.mapper.ImageryMapper;
import team.nexaura.geovision_backend.repository.ImageryRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ImageryService {

    private final ImageryRepository imageryRepository;
    private final ImageryMapper imageryMapper;
    private final FileValidationService fileValidationService;
    private final FileStorageService fileStorageService;
    private final GdalProcessingService gdalProcessingService;
    private final ImageEnhancementService imageEnhancementService;

    public ImageryService(
            ImageryRepository imageryRepository,
            ImageryMapper imageryMapper,
            FileValidationService fileValidationService,
            FileStorageService fileStorageService,
            GdalProcessingService gdalProcessingService,
            ImageEnhancementService imageEnhancementService
    ) {
        this.imageryRepository = imageryRepository;
        this.imageryMapper = imageryMapper;
        this.fileValidationService = fileValidationService;
        this.fileStorageService = fileStorageService;
        this.gdalProcessingService = gdalProcessingService;
        this.imageEnhancementService = imageEnhancementService;
    }

    /**
     * Complete geospatial file upload pipeline.
     * Validates format, extension, mime, magic bytes, and ZIP security.
     * Saves raw file to uploads/raw/, executes GDAL metadata extraction, and sets initial status to UPLOADED.
     */
    public ImageryResponseDto uploadImagery(MultipartFile file) {
        // 1. Rigorous Geospatial Validation
        fileValidationService.validate(file);

        // 2. Secure File Storage to uploads/raw/
        FileStorageService.StoredFileResult storedResult = fileStorageService.storeRawFile(file);

        // 3. GDAL Geospatial Metadata Analysis
        team.nexaura.geovision_backend.dto.internal.GdalMetadataDto gdalMetadata =
                gdalProcessingService.extractMetadata(java.nio.file.Path.of(storedResult.absolutePath()));

        // 4. Resolve Content Type
        String contentType = file.getContentType();
        if (contentType == null || contentType.isBlank()) {
            contentType = getFileTypeFromExtension(storedResult.originalFilename());
        }

        // 5. Resolve Authenticated User
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String uploadedBy = (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equals(authentication.getName()))
                ? authentication.getName()
                : "ANONYMOUS";

        // 6. Build and Persist Metadata (Initial Status: UPLOADED)
        Imagery imagery = Imagery.builder()
                .filename(storedResult.originalFilename())
                .originalFilePath(storedResult.absolutePath())
                .fileType(contentType)
                .fileSize(file.getSize())
                .uploadedBy(uploadedBy)
                .uploadTime(LocalDateTime.now())
                .status(ImageryStatus.UPLOADED)
                .width(gdalMetadata.width())
                .height(gdalMetadata.height())
                .bands(gdalMetadata.bands())
                .crs(gdalMetadata.crs())
                .epsg(gdalMetadata.epsg())
                .bbox(gdalMetadata.bbox())
                .build();

        Imagery savedImagery = imageryRepository.save(imagery);
        return imageryMapper.entityToResponseDto(savedImagery);
    }

    /**
     * Executes the Phase 4 Image Enhancement Pipeline:
     * Transitions status from UPLOADED -> PROCESSING -> PROCESSED
     */
    public ImageryResponseDto enhanceImagery(Long id) {
        Imagery imagery = imageryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Imagery not found with id: " + id));

        Imagery enhanced = imageEnhancementService.enhanceImagery(imagery);
        return imageryMapper.entityToResponseDto(enhanced);
    }

    public List<ImageryResponseDto> getAllImagery() {
        return imageryRepository.findAllByOrderByUploadTimeDesc()
                .stream()
                .map(imageryMapper::entityToResponseDto)
                .toList();
    }

    public ImageryResponseDto getImageryById(Long id) {
        Imagery imagery = imageryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Imagery not found with id: " + id));

        return imageryMapper.entityToResponseDto(imagery);
    }

    public org.springframework.core.io.Resource loadPreviewResource(Long id, boolean enhanced) {
        Imagery imagery = imageryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Imagery not found with id: " + id));

        if (imagery.getEnhancementMetadata() != null) {
            try {
                com.fasterxml.jackson.databind.JsonNode root = new com.fasterxml.jackson.databind.ObjectMapper().readTree(imagery.getEnhancementMetadata());
                String pathKey = enhanced ? "enhancedPreviewPath" : "rawPreviewPath";
                if (root.hasNonNull(pathKey)) {
                    java.nio.file.Path previewPath = java.nio.file.Path.of(root.get(pathKey).asText());
                    if (java.nio.file.Files.exists(previewPath)) {
                        return new org.springframework.core.io.UrlResource(previewPath.toUri());
                    }
                }
            } catch (Exception ignored) {}
        }

        String targetPath = enhanced ? imagery.getEnhancedFilePath() : imagery.getOriginalFilePath();
        if (targetPath != null) {
            try {
                java.nio.file.Path p = java.nio.file.Path.of(targetPath);
                if (java.nio.file.Files.exists(p)) {
                    return new org.springframework.core.io.UrlResource(p.toUri());
                }
            } catch (Exception ignored) {}
        }

        throw new ResourceNotFoundException("Preview resource not available for imagery id: " + id);
    }

    private String getFileTypeFromExtension(String filename) {
        int dotIndex = filename.lastIndexOf('.');
        if (dotIndex > 0 && dotIndex < filename.length() - 1) {
            String ext = filename.substring(dotIndex + 1).toLowerCase();
            return switch (ext) {
                case "tif", "tiff" -> "image/tiff";
                case "jp2" -> "image/jp2";
                case "zip" -> "application/zip";
                default -> "application/octet-stream";
            };
        }
        return "application/octet-stream";
    }
}
