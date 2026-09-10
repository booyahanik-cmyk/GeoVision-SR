package team.nexaura.geovision_backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import team.nexaura.geovision_backend.dto.response.UserProfileResponseDto;
import team.nexaura.geovision_backend.service.UserService;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('USER', 'ANALYST', 'MODERATOR', 'ADMIN')")
    public ResponseEntity<UserProfileResponseDto> getCurrentUserProfile() {
        UserProfileResponseDto userProfile = userService.getCurrentUserProfile();

        return ResponseEntity
                .status(HttpStatus.OK)
                .body(userProfile);
    }

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Map<String, String>> getUserDashboard() {
        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Welcome to the GeoVision User Dashboard"
        ));
    }
}
