package com.transcriptor.BackEnd.controllers;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.transcriptor.BackEnd.Entities.InformeMedico;
import com.transcriptor.BackEnd.services.InformeService;
import com.transcriptor.BackEnd.services.TranscriptorService;

@RestController
@RequestMapping("/api/informe")
public class InformeController {
    @Autowired
    private InformeService informeService;
    @Autowired
    private TranscriptorService transcriptorService;
    
    @PostMapping("/crear")
    public InformeMedico crearInforme(@RequestBody InformeMedico informe){
       InformeMedico informeNuevo = informeService.crearInforme(informe);
       return informeNuevo;
    }

    @PostMapping("/subir-audio")
    public String subirAudio(@RequestParam("idpaciente") String idpaciente, @RequestParam("audio") MultipartFile archivo) {
        
        if (archivo.isEmpty()) {
            return "Error: El archivo está vacío.";
        }

        // 1. Extraemos los datos que manda Postman
        String contentType = archivo.getContentType();
        String nombreOriginal = archivo.getOriginalFilename();

        // 2. Imprimimos por consola para que vos puedas ver qué mandó Postman (te va a servir para debuggear siempre)
        System.out.println("---- DEBUG SUBIDA DE AUDIO ----");
        System.out.println("ContentType que llegó: " + contentType);
        System.out.println("Nombre del archivo: " + nombreOriginal);
        System.out.println("-------------------------------");

        // 3. Validación flexible: Aceptamos cualquier etiqueta que empiece con "audio" O que el archivo termine en ".wav"
        boolean esAudio = contentType != null && contentType.startsWith("audio/");
        boolean esExtensionWav = nombreOriginal != null && nombreOriginal.toLowerCase().endsWith(".wav");

        if (!esAudio && !esExtensionWav) {
            return "Error: Por favor, suba un archivo de audio en formato WAV válido.";
        }

        // Si pasó el detector de mentiras, lo mandamos al servicio
        transcriptorService.crearTranscripcion(idpaciente, archivo);
        return "¡Se subió exitosamente el audio y comenzó el procesamiento!";
    }

    @GetMapping("/traerlistaInformes/{idPaciente}")
    public List<InformeMedico> traerInformesxPaciente(@PathVariable String idPaciente){
        return informeService.traerInformesPorPaciente(idPaciente);
    }

    @PutMapping("/editar/{idInforme}")
    public InformeMedico editarInforme(@PathVariable String idInforme, @RequestBody InformeMedico informe){
       InformeMedico informeAEditar = informeService.editarInforme(idInforme, informe);
       return informeAEditar;
    }

    @PutMapping("/finalizar/{id}")
    public InformeMedico feedbackInforme(@PathVariable("id") String id, @RequestBody Map<String, String> payload){
        InformeMedico informeEncontrado = informeService.buscarInformeId(id);
        informeEncontrado.setFeedback(payload.get("textoFinal"));
        informeEncontrado.setEstado("REVISADO");
        informeService.editarInforme(id, informeEncontrado);
        return informeEncontrado;
    }

    @DeleteMapping("/borrar/{idInforme}")
    public String borrarInforme(@PathVariable String idInforme){
       String mensaje = informeService.borrarInforme(idInforme);
        return mensaje;
        
    }
}
