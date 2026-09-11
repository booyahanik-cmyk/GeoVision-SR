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

    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public ResponseEntity<ExceptionResponseDto> accessDeniedExceptionHandler(
            org.springframework.security.access.AccessDeniedException e, HttpServletRequest request
    ) {
        ExceptionResponseDto exceptionResponse =
                new ExceptionResponseDto(
                        LocalDateTime.now(),
                        HttpStatus.FORBIDDEN.value(),
                        HttpStatus.FORBIDDEN.getReasonPhrase(),
                        "Access denied: You do not have permission to access this resource",
                        request.getRequestURI()
                );

        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(exceptionResponse);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ExceptionResponseDto> illegalArgumentExceptionHandler(
            IllegalArgumentException e, HttpServletRequest request
    ) {
        ExceptionResponseDto exceptionResponse =
                new ExceptionResponseDto(
                        LocalDateTime.now(),
                        HttpStatus.BAD_REQUEST.value(),
                        HttpStatus.BAD_REQUEST.getReasonPhrase(),
                        e.getMessage(),
                        request.getRequestURI()
                );

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(exceptionResponse);
    }

    @ExceptionHandler(FileValidationException.class)
    public ResponseEntity<ExceptionResponseDto> fileValidationExceptionHandler(
            FileValidationException e, HttpServletRequest request
    ) {
        ExceptionResponseDto exceptionResponse =
                new ExceptionResponseDto(
                        LocalDateTime.now(),
                        HttpStatus.BAD_REQUEST.value(),
                        HttpStatus.BAD_REQUEST.getReasonPhrase(),
                        e.getMessage(),
                        request.getRequestURI()
                );

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(exceptionResponse);
    }

    @ExceptionHandler(org.springframework.web.multipart.MaxUploadSizeExceededException.class)
    public ResponseEntity<ExceptionResponseDto> maxUploadSizeExceededExceptionHandler(
            org.springframework.web.multipart.MaxUploadSizeExceededException e, HttpServletRequest request
    ) {
        ExceptionResponseDto exceptionResponse =
                new ExceptionResponseDto(
                        LocalDateTime.now(),
                        HttpStatus.PAYLOAD_TOO_LARGE.value(),
                        HttpStatus.PAYLOAD_TOO_LARGE.getReasonPhrase(),
                        "File size exceeds maximum allowed upload limit (100MB)",
                        request.getRequestURI()
                );

        return ResponseEntity
                .status(HttpStatus.PAYLOAD_TOO_LARGE)
                .body(exceptionResponse);
    }
}
