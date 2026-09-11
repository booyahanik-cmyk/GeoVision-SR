package team.nexaura.geovision_backend.dto.response;

import lombok.*;
import team.nexaura.geovision_backend.entity.ImageryStatus;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ImageryResponseDto {

    private Long id;
    private String filename;
    private String originalFilePath;
    private String fileType;
    private Long fileSize;
    private String uploadedBy;
    private LocalDateTime uploadTime;
    private ImageryStatus status;
    private Integer width;
    private Integer height;
    private Integer bands;
    private String crs;
    private String epsg;
    private String bbox;
    private String enhancedFilePath;
    private String enhancementMetadata;
}
