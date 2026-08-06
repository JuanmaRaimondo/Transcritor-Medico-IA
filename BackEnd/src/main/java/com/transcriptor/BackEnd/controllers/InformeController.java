package com.transcriptor.BackEnd.controllers;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
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
import com.transcriptor.BackEnd.DTOs.CrearInformeDesdePlantillaDTO;
import com.transcriptor.BackEnd.DTOs.FeedbackRequestDTO;
import com.transcriptor.BackEnd.Entities.InformeMedico;
import com.transcriptor.BackEnd.services.ExportService;
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
           @RequestParam("nombrePaciente") String nombrePaciente,
            @RequestParam("apellidoPaciente") String apellidoPaciente,
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
            InformeMedico informeGenerado = transcriptorService.crearTranscripcion(nombrePaciente, apellidoPaciente, archivo, tipoEstudio, authentication.getName());
            
            // Devolvemos el JSON del informe al Frontend (código 200 OK) para que llene la Tarjeta 3
            return ResponseEntity.ok(informeGenerado);
            
        } catch (Exception e) {
            System.err.println("Error procesando audio: " + e.getMessage());
            return ResponseEntity.internalServerError().body("Error al procesar el audio: " + e.getMessage());
        }
    }

    @GetMapping("/buscar")
    public List<InformeMedico> buscarInformes(
        @RequestParam(required = false) String nombrePaciente,
        @RequestParam(required = false) String apellidoPaciente,
        @RequestParam(required = false) String tipoEstudio,
        Authentication authentication) {
    return informeService.buscarInformes(authentication.getName(), nombrePaciente, apellidoPaciente, tipoEstudio);
}

    @GetMapping("/traerTodos")
    public List<InformeMedico> traerTodosLosInformes(Authentication authentication) {
    return informeService.traerInformesPorMedico(authentication.getName());
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

    @PostMapping("/crear-desde-plantilla")
    public ResponseEntity<?> crearInformeDesdePlantilla(@RequestBody CrearInformeDesdePlantillaDTO datos, Authentication authentication) {
        try {
            InformeMedico informe = informeService.crearInformeDesdePlantilla(datos, authentication.getName());
            return ResponseEntity.ok(informe);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error al crear el informe: " + e.getMessage());
        }
    }

    @PostMapping("/transcribir-fragmento")
    public ResponseEntity<?> transcribirFragmento(@RequestParam("audio") MultipartFile archivo) {
        if (archivo.isEmpty()) {
            return ResponseEntity.badRequest().body("Error: el archivo está vacío.");
        }
        try {
            String texto = transcriptorService.transcribirFragmento(archivo);
            return ResponseEntity.ok(java.util.Map.of("texto", texto));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error al transcribir: " + e.getMessage());
        }
    }
    @Autowired
private ExportService exportService;

@GetMapping("/{id}/docx")
public ResponseEntity<byte[]> descargarDocx(@PathVariable String id) {
    InformeMedico informe = informeService.buscarInformeId(id);
    if (!"REVISADO".equals(informe.getEstado())) {
        return ResponseEntity.badRequest().body(null);
    }
    try {
        byte[] docx = exportService.generarDocx(informe);
        return ResponseEntity.ok()
            .header("Content-Disposition", "attachment; filename=informe-" + id + ".docx")
            .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.wordprocessingml.document"))
            .body(docx);
    } catch (Exception e) {
        return ResponseEntity.internalServerError().build();
    }
}

@GetMapping("/{id}/pdf")
public ResponseEntity<byte[]> descargarPdf(@PathVariable String id) {
    InformeMedico informe = informeService.buscarInformeId(id);
    if (!"REVISADO".equals(informe.getEstado())) {
        return ResponseEntity.badRequest().body(null);
    }
    try {
        byte[] pdf = exportService.generarPdf(informe);
        return ResponseEntity.ok()
            .header("Content-Disposition", "attachment; filename=informe-" + id + ".pdf")
            .contentType(MediaType.APPLICATION_PDF)
            .body(pdf);
    } catch (Exception e) {
        return ResponseEntity.internalServerError().build();
    }
}
}