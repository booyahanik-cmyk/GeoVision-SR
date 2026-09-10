package team.nexaura.geovision_backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/analyst")
public class AnalystController {

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('ANALYST')")
    public ResponseEntity<Map<String, Object>> getAnalystDashboard() {
        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Welcome to GeoVision Geospatial Intelligence & Telemetry Analytics",
                "role", "ANALYST"
        ));
    }

    @GetMapping("/spatial-reports")
    @PreAuthorize("hasAnyRole('ANALYST', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getSpatialReports() {
        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Geospatial incident overview and density heatmap data",
                "access", "ANALYST or ADMIN"
        ));
    }
}
