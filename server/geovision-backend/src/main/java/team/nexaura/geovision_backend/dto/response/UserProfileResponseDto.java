package team.nexaura.geovision_backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponseDto {

    private Long id;
    private String name;
    private String email;
    private team.nexaura.geovision_backend.entity.Role role;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
