package team.nexaura.geovision_backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/moderator")
public class ModeratorController {

    @GetMapping("/queue")
    @PreAuthorize("hasRole('MODERATOR')")
    public ResponseEntity<Map<String, Object>> getModerationQueue() {
        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "GeoVision Incident Review & Content Moderation Queue",
                "pendingReviewsCount", 0,
                "role", "MODERATOR"
        ));
    }

    @PostMapping("/incidents/{incidentId}/verify")
    @PreAuthorize("hasAnyRole('MODERATOR', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> verifyIncident(
            @PathVariable Long incidentId,
            @RequestParam(defaultValue = "VERIFIED") String decision
    ) {
        return ResponseEntity.ok(Map.of(
                "status", "success",
                "incidentId", incidentId,
                "decision", decision,
                "message", "Incident report verified successfully"
        ));
    }
}
