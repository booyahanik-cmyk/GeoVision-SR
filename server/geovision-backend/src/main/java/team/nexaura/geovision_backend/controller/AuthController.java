package team.nexaura.geovision_backend.controller;


import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import team.nexaura.geovision_backend.dto.request.LoginRequestDto;
import team.nexaura.geovision_backend.dto.request.UserRegisterRequestDto;
import team.nexaura.geovision_backend.dto.response.LoginResponseDto;
import team.nexaura.geovision_backend.dto.response.UserRegisterResponseDto;
import team.nexaura.geovision_backend.service.AuthService;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<UserRegisterResponseDto> registerUser(
            @Valid @RequestBody UserRegisterRequestDto requestUser
    ) {
        UserRegisterResponseDto createdUser = authService.registerUser(requestUser);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(createdUser);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDto> loginUser(
            @Valid @RequestBody LoginRequestDto loginRequest
    ) {
        LoginResponseDto loginResponse = authService.loginUser(loginRequest);

        return ResponseEntity
                .status(HttpStatus.OK)
                .body(loginResponse);
    }
}
