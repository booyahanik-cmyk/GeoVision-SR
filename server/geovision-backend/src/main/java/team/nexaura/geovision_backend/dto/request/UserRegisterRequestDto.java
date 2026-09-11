package team.nexaura.geovision_backend.dto.request;


import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class UserRegisterRequestDto {

    @NotBlank(message = "Please enter name")
    @Size(min = 3, message = "Name should be between 3 - 50 characters")
    private String name;
    @Email(message = "Enter a valid email")
    private String email;

    @Size(min = 8, message = "Password should be 8 character")
    private String password;
}
