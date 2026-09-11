package team.nexaura.geovision_backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProcessingProgressDto {
    private Long imageryId;
    private int percentage; // 0, 25, 50, 75, 100
    private String stage;   // INGEST_VALIDATION, NORMALIZATION, CONTRAST_ENHANCEMENT, NOISE_SHARPENING, COMPLETED, FAILED
    private String message;
    private String timestamp;
    private Map<String, Object> telemetry;
}
