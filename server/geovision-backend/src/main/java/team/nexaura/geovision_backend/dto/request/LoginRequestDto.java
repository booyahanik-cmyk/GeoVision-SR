package team.nexaura.geovision_backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequestDto {

    @NotBlank(message = "Please enter email")
    @Email(message = "Enter a valid email")
    private String email;

    @NotBlank(message = "Please enter password")
    private String password;
}
