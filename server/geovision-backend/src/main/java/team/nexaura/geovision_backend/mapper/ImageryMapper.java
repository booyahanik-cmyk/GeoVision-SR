package team.nexaura.geovision_backend.mapper;

import org.springframework.stereotype.Component;
import team.nexaura.geovision_backend.dto.response.ImageryResponseDto;
import team.nexaura.geovision_backend.entity.Imagery;

@Component
public class ImageryMapper {

    public ImageryResponseDto entityToResponseDto(Imagery imagery) {
        if (imagery == null) {
            return null;
        }

        return ImageryResponseDto.builder()
                .id(imagery.getId())
                .filename(imagery.getFilename())
                .originalFilePath(imagery.getOriginalFilePath())
                .fileType(imagery.getFileType())
                .fileSize(imagery.getFileSize())
                .uploadedBy(imagery.getUploadedBy())
                .uploadTime(imagery.getUploadTime())
                .status(imagery.getStatus())
                .width(imagery.getWidth())
                .height(imagery.getHeight())
                .bands(imagery.getBands())
                .crs(imagery.getCrs())
                .epsg(imagery.getEpsg())
                .bbox(imagery.getBbox())
                .enhancedFilePath(imagery.getEnhancedFilePath())
                .enhancementMetadata(imagery.getEnhancementMetadata())
                .build();
    }
}
