package com.transcriptor.BackEnd.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.transcriptor.BackEnd.DTOs.AudioResponseDTO;
import com.transcriptor.BackEnd.services.TranscriptorService;

@RestController
@RequestMapping("/api/audio")
public class AudioController {

    @Autowired
    private TranscriptorService transcriptorService;
    
    @PostMapping("/upload")
    public  ResponseEntity<AudioResponseDTO> crearTranscriptor(@RequestParam("audio") MultipartFile archivo, @RequestParam("idPaciente") String idPaciente ){
        if(archivo.isEmpty()){
            return ResponseEntity.badRequest().body(new AudioResponseDTO("¡Error! Falto el archivo del paciente" + idPaciente, null));
        }else{
            
            String resultado = transcriptorService.crearTranscripcion(idPaciente, archivo);
        return ResponseEntity.ok(new AudioResponseDTO(resultado, archivo.getOriginalFilename())); 
        }
          
    }

}
