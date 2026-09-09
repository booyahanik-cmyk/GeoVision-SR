package team.nexaura.geovision_backend.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import team.nexaura.geovision_backend.dto.request.LoginRequestDto;
import team.nexaura.geovision_backend.dto.request.UserRegisterRequestDto;
import team.nexaura.geovision_backend.dto.response.LoginResponseDto;
import team.nexaura.geovision_backend.dto.response.UserRegisterResponseDto;
import team.nexaura.geovision_backend.entity.User;
import team.nexaura.geovision_backend.exception.DuplicateResourceException;
import team.nexaura.geovision_backend.exception.InvalidCredentialsException;
import team.nexaura.geovision_backend.exception.ResourceNotFoundException;
import team.nexaura.geovision_backend.mapper.UserMapper;
import team.nexaura.geovision_backend.repository.UserRepository;

import team.nexaura.geovision_backend.security.jwt.JwtService;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository,
                       UserMapper userMapper,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public UserRegisterResponseDto registerUser(UserRegisterRequestDto requestUser) {

        boolean isExistsEmail = userRepository.existsByEmail(requestUser.getEmail());

        if (isExistsEmail) {
            throw new DuplicateResourceException("Email already registered");
        }

        User userToBeSaved = userMapper.requestDtoToEntityMapper(requestUser);
        userToBeSaved.setPassword(passwordEncoder.encode(requestUser.getPassword()));
        User savedUser = userRepository.save(userToBeSaved);

        return userMapper.entityToResponseDtoMapper(savedUser);
    }

    public LoginResponseDto loginUser(LoginRequestDto loginRequest) {
        User user = userRepository.findByEmail(loginRequest.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + loginRequest.getEmail()));

        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
            throw new InvalidCredentialsException("Invalid email or password");
        }

        String token = jwtService.generateToken(user);
        Date expiration = jwtService.extractExpiration(token);
        LocalDateTime expiresAt = expiration.toInstant()
                .atZone(ZoneId.systemDefault())
                .toLocalDateTime();

        return new LoginResponseDto(token, "Bearer", expiresAt);
    }
}
