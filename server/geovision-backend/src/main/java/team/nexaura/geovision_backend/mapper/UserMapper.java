package team.nexaura.geovision_backend.mapper;

import org.springframework.stereotype.Component;
import team.nexaura.geovision_backend.dto.request.UserRegisterRequestDto;
import team.nexaura.geovision_backend.dto.response.UserRegisterResponseDto;
import team.nexaura.geovision_backend.entity.User;

@Component
public class UserMapper {

    public User requestDtoToEntityMapper(UserRegisterRequestDto requestUser){

        User user = new User();
        user.setName(requestUser.getName());
        user.setEmail(requestUser.getEmail());
        user.setPassword(requestUser.getPassword());

        return user;
    }

    public UserRegisterResponseDto entityToResponseDtoMapper(User user){
        UserRegisterResponseDto response = new UserRegisterResponseDto();

        response.setId(user.getId());
        response.setName(user.getName());
        response.setEmail(user.getEmail());
        response.setCreatedAt(user.getCreatedAt());
        response.setUpdatedAt(user.getUpdatedAt());

        return response;
    }
}
