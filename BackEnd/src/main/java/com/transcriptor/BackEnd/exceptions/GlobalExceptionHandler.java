package com.transcriptor.BackEnd.exceptions;

import java.time.LocalDateTime;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.transcriptor.BackEnd.DTOs.ErrorResponseDTO;

@RestControllerAdvice
public class GlobalExceptionHandler {
    

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ErrorResponseDTO> respuestaError(RuntimeException ex){

        String mensaje = ex.getMessage();
        String fechaYhora = LocalDateTime.now().toString();
        ErrorResponseDTO miError = new ErrorResponseDTO(mensaje, fechaYhora);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(miError);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponseDTO> respuestaValidacion(MethodArgumentNotValidException ex){
        String mensaje = ex.getBindingResult().getFieldErrors().stream()
        .map(error -> error.getDefaultMessage())
        .reduce((m1, m2) -> m1 + ", " + m2)
        .orElse("Error de validación");
        
        String fechaYhora = LocalDateTime.now().toString();

        ErrorResponseDTO miError = new ErrorResponseDTO(mensaje, fechaYhora);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(miError);
    }
}
