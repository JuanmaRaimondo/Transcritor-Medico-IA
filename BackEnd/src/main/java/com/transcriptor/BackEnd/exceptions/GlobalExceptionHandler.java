package com.transcriptor.BackEnd.exceptions;

import java.time.LocalDateTime;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
}
