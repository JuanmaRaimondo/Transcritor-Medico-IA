package com.transcriptor.BackEnd.services;

import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.ai.chat.model.ChatModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import com.google.api.gax.core.FixedCredentialsProvider;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.speech.v1.RecognitionAudio;
import com.google.cloud.speech.v1.RecognitionConfig;
import com.google.cloud.speech.v1.RecognizeResponse;
import com.google.cloud.speech.v1.SpeechClient;
import com.google.cloud.speech.v1.SpeechSettings;
import com.google.protobuf.ByteString;
import com.transcriptor.BackEnd.Entities.InformeMedico;
import com.transcriptor.BackEnd.Entities.Paciente;
import com.transcriptor.BackEnd.repositories.IPacienteRepository;

@Service
public class TranscriptorService {
    
    @Autowired
    private IPacienteRepository pacienterepo;

    @Autowired
    private InformeService informeService;

    private final ChatModel chatmodel;

    @Autowired
    public TranscriptorService(ChatModel chatmodel) {
        this.chatmodel = chatmodel;
    }

    public InformeMedico crearTranscripcion(String id_paciente, MultipartFile archivo, String tipoEstudio, String emailMedico){
        // 1. Verificamos que el paciente exista
        Optional<Paciente> pacienteExiste = pacienterepo.findById(id_paciente);

        if(pacienteExiste.isEmpty()){
            throw new RuntimeException("Paciente no encontrado");
        }

        // 2. Hacemos el trabajo pesado con las APIs primero
        // Extraemos el texto del audio
        String textoCrudo = escucharAudioGoogle(archivo);
        
        // Lo mandamos a estructurar con Gemini 2.x
        String textoInteligente = correccionAudioGoogle(textoCrudo);

        // 3. Creamos el informe con TODOS los datos ya resueltos
        InformeMedico informeNuevo = new InformeMedico(
            id_paciente,            // 1. idPaciente
            emailMedico,                   // 2. idMedico (lo agregaremos más adelante)
            tipoEstudio,              // 3. tipoEstudio
            textoCrudo,             // 4. textoCrudo (¡ahora sí se va a guardar!)
            textoInteligente,       // 5. textoCorregido (la magia de la IA)
            null,                   // 6. feedbackMedico
            "PENDIENTE_REVISION",   // 7. estado inicial
            LocalDateTime.now()     // 8. fechaCreacion (marca la hora actual exacta)
        );

        // 4. Guardamos en la base de datos una sola vez con el objeto completo
        informeService.crearInforme(informeNuevo);
        
        return informeNuevo;
    }

    private String escucharAudioGoogle(MultipartFile archivo){
        try {
            InputStream credentialsStream = getClass().getResourceAsStream("/google-credentials.json");
            GoogleCredentials credenciales = GoogleCredentials.fromStream(credentialsStream);
            
            SpeechSettings configuracionCliente = SpeechSettings.newBuilder()
                    .setCredentialsProvider(FixedCredentialsProvider.create(credenciales))
                    .build();

            try (SpeechClient speechClient = SpeechClient.create(configuracionCliente)) {
                
                ByteString audioBytes = ByteString.copyFrom(archivo.getBytes());
                RecognitionAudio paqueteAudio = RecognitionAudio.newBuilder().setContent(audioBytes).build();
                RecognitionConfig configuracion = RecognitionConfig.newBuilder().setLanguageCode("es-AR").build();
                
                RecognizeResponse respuesta = speechClient.recognize(configuracion, paqueteAudio);
                
                return respuesta.getResultsList()
                                .get(0)
                                .getAlternativesList()
                                .get(0)
                                .getTranscript();
            }

        } catch (Exception e) {
            throw new RuntimeException("Error al comunicarse con Google Cloud: " + e.getMessage());
        }
    }

    private String correccionAudioGoogle(String textoCrudo) {
        String contextoIA = """
                Sos un asistente médico profesional experto en transcripción clínica.
                Tu tarea es tomar el siguiente texto dictado (que puede estar desordenado o no tener puntuación)
                y convertirlo en un informe médico estructurado, utilizando lenguaje técnico y formal.
                Mantené la información exacta, NO inventes síntomas ni diagnósticos que no estén en el texto.
                Estructurá el resultado con títulos como: 'Motivo de consulta', 'Síntomas', 'Diagnóstico' y 'Tratamiento' según corresponda.
                
                Texto dictado a transcribir:
                """ + textoCrudo;

        try {
            var opciones = org.springframework.ai.vertexai.gemini.VertexAiGeminiChatOptions.builder()
                    .withModel("gemini-2.5-flash-lite")
                    .build();

            var prompt = new org.springframework.ai.chat.prompt.Prompt(contextoIA, opciones);

            // Llamada directa y limpia a Vertex AI con el modelo correcto
            return chatmodel.call(prompt).getResult().getOutput().getContent();} catch (Exception e) {
            System.err.println("========== ERROR CRÍTICO DE VERTEX AI ==========");
            e.printStackTrace();
            System.err.println("================================================");
            throw new RuntimeException("Falló la IA: " + e.getMessage());
        }
    }

    private String feedbackGoogle(String textoActual, String feedbackMedico) {
        String contextoIA = """
                Sos un asistente médico profesional experto en transcripción clínica.
                A continuación te voy a pasar un informe médico que ya fue estructurado, y un comentario/feedback del doctor con correcciones o agregados que quiere hacerle.
                
                Tu tarea es reescribir el informe médico aplicando EXACTAMENTE las correcciones que pide el doctor.
                Mantené el formato estructurado profesional (Motivo de consulta, Síntomas, etc.) y no inventes información médica que no esté en el texto original o en el feedback.
                
                --- INFORME ACTUAL ---
                %s
                
                --- FEEDBACK DEL DOCTOR ---
                %s
                """.formatted(textoActual, feedbackMedico);

        try {
            var opciones = org.springframework.ai.vertexai.gemini.VertexAiGeminiChatOptions.builder()
                    .withModel("gemini-2.5-flash-lite")
                    .build();

            var prompt = new org.springframework.ai.chat.prompt.Prompt(contextoIA, opciones);

            return chatmodel.call(prompt).getResult().getOutput().getContent();
            
        } catch (Exception e) {
            System.err.println("========== ERROR EN REESCRITURA CON VERTEX AI ==========");
            e.printStackTrace();
            throw new RuntimeException("Falló la IA al reescribir: " + e.getMessage());
        }
    }
    public InformeMedico reescribirInformeConFeedback(String idInforme, String feedback) {
        
        // 1. Buscá el informe en la base de datos por su ID usando informeService
        // Pista: 
        InformeMedico informeEncontrado = informeService.buscarInformeId(idInforme);
        
        // 2. Extraé el texto que la IA había generado originalmente.
        // Pista: 
        String textoActual = informeEncontrado.getTextoCorregido();

        // 3. (Dejar comentado) Llamada a Vertex AI. 
         String nuevoTexto = feedbackGoogle(textoActual, feedback);
        
        // 4. Actualizá el informe con el nuevo texto y agregá el feedback.
         informeEncontrado.setTextoCorregido(nuevoTexto); // (Comentado por ahora)
        informeEncontrado.setFeedback(feedback);

        // 5. Guardá los cambios usando informeService.
        // Pista: informeService.actualizarInforme(informeEncontrado);
        informeService.crearInforme(informeEncontrado);
        
        // 6. Retorná el informe actualizado.
        return informeEncontrado; // Cambiá este null por tu informe guardado
    }

}