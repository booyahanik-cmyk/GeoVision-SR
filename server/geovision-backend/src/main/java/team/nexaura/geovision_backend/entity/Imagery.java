package team.nexaura.geovision_backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "imagery")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Imagery {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String filename;

    @Column(nullable = false)
    private String originalFilePath;

    private String fileType;

    private Long fileSize;

    private String uploadedBy;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime uploadTime = LocalDateTime.now();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ImageryStatus status;

    private Integer width;

    private Integer height;

    private Integer bands;

    private String crs;

    private String epsg;

    @Column(columnDefinition = "TEXT")
    private String bbox;

    private String enhancedFilePath;

    @Column(columnDefinition = "TEXT")
    private String enhancementMetadata;
}
