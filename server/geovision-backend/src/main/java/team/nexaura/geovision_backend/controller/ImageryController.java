package team.nexaura.geovision_backend.controller;

import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import team.nexaura.geovision_backend.dto.response.ImageryResponseDto;
import team.nexaura.geovision_backend.service.ImageryService;

import java.util.List;

@RestController
@RequestMapping("/api/v1/imagery")
public class ImageryController {

    private final ImageryService imageryService;

    public ImageryController(ImageryService imageryService) {
        this.imageryService = imageryService;
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ImageryResponseDto> uploadImagery(
            @RequestParam("file") MultipartFile file
    ) {
        ImageryResponseDto responseDto = imageryService.uploadImagery(file);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(responseDto);
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ImageryResponseDto>> getAllImagery() {
        List<ImageryResponseDto> imageryList = imageryService.getAllImagery();
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(imageryList);
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ImageryResponseDto> getImageryById(@PathVariable("id") Long id) {
        ImageryResponseDto imagery = imageryService.getImageryById(id);
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(imagery);
    }

    @PostMapping("/{id}/enhance")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ImageryResponseDto> enhanceImagery(@PathVariable("id") Long id) {
        ImageryResponseDto responseDto = imageryService.enhanceImagery(id);
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(responseDto);
    }

    @GetMapping(value = "/{id}/preview/raw", produces = {MediaType.IMAGE_JPEG_VALUE, MediaType.IMAGE_PNG_VALUE, MediaType.APPLICATION_OCTET_STREAM_VALUE})
    public ResponseEntity<Resource> getRawPreview(@PathVariable("id") Long id) {
        Resource resource = imageryService.loadPreviewResource(id, false);
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_JPEG)
                .body(resource);
    }

    @GetMapping(value = "/{id}/preview/enhanced", produces = {MediaType.IMAGE_JPEG_VALUE, MediaType.IMAGE_PNG_VALUE, MediaType.APPLICATION_OCTET_STREAM_VALUE})
    public ResponseEntity<Resource> getEnhancedPreview(@PathVariable("id") Long id) {
        Resource resource = imageryService.loadPreviewResource(id, true);
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_JPEG)
                .body(resource);
    }
}
