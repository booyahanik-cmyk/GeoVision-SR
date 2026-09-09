package team.nexaura.geovision_backend.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import team.nexaura.geovision_backend.dto.response.ExceptionResponseDto;
import team.nexaura.geovision_backend.dto.response.ValidationExceptionResponseDto;

import java.time.LocalDateTime;
import java.util.HashMap;

@RestControllerAdvice
public class GlobalException {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ValidationExceptionResponseDto> validationExceptionHandler(
            MethodArgumentNotValidException e, HttpServletRequest request
    ){
        HashMap<String, String> fieldErrors = new HashMap<>();

        e.getBindingResult()
                .getFieldErrors()
                .forEach((error) ->
                        fieldErrors.put(error.getField(), error.getDefaultMessage()));

        ValidationExceptionResponseDto response = new ValidationExceptionResponseDto(
                LocalDateTime.now(),
                HttpStatus.BAD_REQUEST.value(),
                HttpStatus.BAD_REQUEST.getReasonPhrase(),
                e.getMessage(),
                request.getRequestURI(),
                fieldErrors
        );

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(response);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ExceptionResponseDto> responseNotFoundExceptionHandler(
            ResourceNotFoundException e, HttpServletRequest request
    ){
        ExceptionResponseDto exceptionResponse =
                new ExceptionResponseDto(
                        LocalDateTime.now(),
                        HttpStatus.NOT_FOUND.value(),
                        HttpStatus.NOT_FOUND.getReasonPhrase(),
                        e.getMessage(),
                        request.getRequestURI()
                );

        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(exceptionResponse);
    }

    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ExceptionResponseDto> duplicateResourceExceptionHandler(
            DuplicateResourceException e, HttpServletRequest request
    ){
        ExceptionResponseDto exceptionResponse =
                new ExceptionResponseDto(
                        LocalDateTime.now(),
                        HttpStatus.NOT_FOUND.value(),
                        HttpStatus.NOT_FOUND.getReasonPhrase(),
                        e.getMessage(),
                        request.getRequestURI()
                );

        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(exceptionResponse);
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<ExceptionResponseDto> invalidCredentialsExceptionHandler(
            InvalidCredentialsException e, HttpServletRequest request
    ) {
        ExceptionResponseDto exceptionResponse =
                new ExceptionResponseDto(
                        LocalDateTime.now(),
                        HttpStatus.UNAUTHORIZED.value(),
                        HttpStatus.UNAUTHORIZED.getReasonPhrase(),
                        e.getMessage(),
                        request.getRequestURI()
                );

        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(exceptionResponse);
    }
}
