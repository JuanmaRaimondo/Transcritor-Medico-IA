package com.transcriptor.BackEnd.controllers;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
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

import com.transcriptor.BackEnd.DTOs.AprobarInformeDTO;
import com.transcriptor.BackEnd.DTOs.FeedbackRequestDTO;
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
    public ResponseEntity<?> subirAudio(
            @RequestParam("idpaciente") String idpaciente, 
            @RequestParam("audio") MultipartFile archivo, 
            @RequestParam("tipoEstudio") String tipoEstudio, 
            Authentication authentication) {
        
        if (archivo.isEmpty()) {
            return ResponseEntity.badRequest().body("Error: El archivo está vacío.");
        }

        // 1. Extraemos los datos que manda el Frontend
        String contentType = archivo.getContentType();
        String nombreOriginal = archivo.getOriginalFilename();

        // 2. Imprimimos por consola para debuggear
        System.out.println("---- DEBUG SUBIDA DE AUDIO ----");
        System.out.println("ContentType que llegó: " + contentType);
        System.out.println("Nombre del archivo: " + nombreOriginal);
        System.out.println("-------------------------------");

        // 3. Validación flexible: Aceptamos "audio/", ".wav" o ".webm"
        boolean esAudio = contentType != null && contentType.startsWith("audio/");
        boolean esExtensionValida = nombreOriginal != null && 
            (nombreOriginal.toLowerCase().endsWith(".wav") || nombreOriginal.toLowerCase().endsWith(".webm"));

        if (!esAudio && !esExtensionValida) {
            return ResponseEntity.badRequest().body("Error: Por favor, suba un archivo de audio en formato WAV o WEBM válido.");
        }

        try {
            // Mandamos al servicio y guardamos el informe generado
            InformeMedico informeGenerado = transcriptorService.crearTranscripcion(idpaciente, archivo, tipoEstudio, authentication.getName());
            
            // Devolvemos el JSON del informe al Frontend (código 200 OK) para que llene la Tarjeta 3
            return ResponseEntity.ok(informeGenerado);
            
        } catch (Exception e) {
            System.err.println("Error procesando audio: " + e.getMessage());
            return ResponseEntity.internalServerError().body("Error al procesar el audio: " + e.getMessage());
        }
    }

    @GetMapping("/traerlistaInformes/{idPaciente}")
    public List<InformeMedico> traerInformesxPaciente(@PathVariable String idPaciente){
        return informeService.traerInformesPorPaciente(idPaciente);
    }

    @GetMapping("/traerTodos")
    public List<InformeMedico> traerTodosLosInformes() {
        return informeService.traerTodosLosInformes();
    }

    @PutMapping("/editar/{idInforme}")
    public InformeMedico editarInforme(@PathVariable String idInforme, @RequestBody InformeMedico informe){
       InformeMedico informeAEditar = informeService.editarInforme(idInforme, informe);
       return informeAEditar;
    }

    @DeleteMapping("/borrar/{idInforme}")
    public String borrarInforme(@PathVariable String idInforme){
       String mensaje = informeService.borrarInforme(idInforme);
        return mensaje;
    }

   @PutMapping("/reescribir/{idInforme}")
    public ResponseEntity<?> reescribirInforme(@PathVariable("idInforme") String idInforme, @RequestBody FeedbackRequestDTO feedback) {
        try {
            // 1. Llamamos a tu motor de IA pasándole el ID y el texto del feedback
            InformeMedico informeActualizado = transcriptorService.reescribirInformeConFeedback(idInforme, feedback.feedback());
            
            // 2. Devolvemos el objeto real en formato JSON
            return ResponseEntity.ok(informeActualizado);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error al reescribir con IA: " + e.getMessage());
        }
    }

    @PutMapping("/finalizar/{idInforme}")
    public ResponseEntity<?> finalizarInforme(@PathVariable("idInforme") String idInforme, @RequestBody AprobarInformeDTO informeAprobado) {
        
        // 1. Imprimimos para debug (siempre es buena práctica)
        System.out.println("Finalizando informe ID: " + idInforme);
        System.out.println("Texto definitivo recibido: " + informeAprobado.textoFinal());
        
        // 2. Llamamos al motor pasándole el ID y sacando el texto del DTO
        InformeMedico informeFinalizado = informeService.aprobarYFinalizarInforme(idInforme, informeAprobado.textoFinal());
        
        // 3. Devolvemos el informe actualizado con un código 200 OK
        return ResponseEntity.ok(informeFinalizado);
    }
    @GetMapping("/detalle/{id}")
    public ResponseEntity<InformeMedico> traerDetalleInforme(@PathVariable("id") String id) {
        try {
            // Buscamos el informe por su ID en la base de datos
            InformeMedico informe = informeService.buscarInformeId(id);
            return ResponseEntity.ok(informe);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}