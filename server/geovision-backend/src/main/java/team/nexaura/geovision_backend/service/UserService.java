package team.nexaura.geovision_backend.service;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import team.nexaura.geovision_backend.dto.response.UserProfileResponseDto;
import team.nexaura.geovision_backend.entity.User;
import team.nexaura.geovision_backend.exception.ResourceNotFoundException;
import team.nexaura.geovision_backend.mapper.UserMapper;
import team.nexaura.geovision_backend.repository.UserRepository;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;

    public UserService(UserRepository userRepository,
                       UserMapper userMapper) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;
    }

    public UserProfileResponseDto getCurrentUserProfile() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResourceNotFoundException("No authenticated user found in security context");
        }

        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        return userMapper.entityToProfileResponseDtoMapper(user);
    }

    public java.util.List<UserProfileResponseDto> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(userMapper::entityToProfileResponseDtoMapper)
                .toList();
    }
}
