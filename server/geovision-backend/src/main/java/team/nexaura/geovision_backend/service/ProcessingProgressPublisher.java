package team.nexaura.geovision_backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import team.nexaura.geovision_backend.dto.response.ProcessingProgressDto;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

@Slf4j
@Service
public class ProcessingProgressPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    public ProcessingProgressPublisher(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Publishes a real-time progress update to STOMP topic
     *
     * @param imageryId  Target imagery ID
     * @param percentage 0, 25, 50, 75, or 100
     * @param stage      Current milestone stage identifier
     * @param message    User-facing descriptive message
     * @param telemetry  Optional telemetry metrics dictionary
     */
    public void publishProgress(Long imageryId, int percentage, String stage, String message, Map<String, Object> telemetry) {
        ProcessingProgressDto payload = ProcessingProgressDto.builder()
                .imageryId(imageryId)
                .percentage(percentage)
                .stage(stage)
                .message(message)
                .timestamp(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
                .telemetry(telemetry)
                .build();

        String destination = "/topic/imagery/" + imageryId + "/progress";
        log.info("Publishing STOMP progress [{}% - {}] for Imagery #{}: {}", percentage, stage, imageryId, message);

        try {
            // Specific topic for this imagery ID
            messagingTemplate.convertAndSend(destination, payload);
            // General monitoring topic
            messagingTemplate.convertAndSend("/topic/imagery/progress", payload);
        } catch (Exception e) {
            log.warn("Failed to broadcast STOMP progress for imagery #{}: {}", imageryId, e.getMessage());
        }
    }

    public void publishProgress(Long imageryId, int percentage, String stage, String message) {
        publishProgress(imageryId, percentage, stage, message, null);
    }
}
