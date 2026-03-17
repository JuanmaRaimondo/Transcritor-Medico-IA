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

    public String crearTranscripcion(String id_paciente, MultipartFile archivo){
        Optional<Paciente> pacienteExiste = pacienterepo.findById(id_paciente);

        if(pacienteExiste.isEmpty()){
            throw new RuntimeException("Paciente no encontrado");
        }

        InformeMedico informeNuevo = new InformeMedico(
            id_paciente,            // 1. idPaciente
            null,                   // 2. idMedico (lo agregaremos más adelante)
            "General",              // 3. tipoEstudio
            null,                   // 4. textoTranscritoCrudo (esperando a la IA)
            null,                   // 5. textoCorregidoIa (esperando a la IA)
            null,                   // 6. feedbackMedico
            "PROCESANDO",           // 7. estado inicial
            LocalDateTime.now()     // 8. fechaCreacion (marca la hora actual exacta)
        );

        //Recibimos el audio y lo transcribimos a texto.
        InformeMedico informeGuardado =  informeService.crearInforme(informeNuevo);
        String textoCrudo = escucharAudioGoogle(archivo);
        informeGuardado.setTextoCrudo(textoCrudo);
        
        //recibido el audio transcripto pasa a ser corregido con IA.
        String textoInteligente = correccionAudioGoogle(textoCrudo);
        informeGuardado.setTextoCorregido(textoInteligente);
        informeGuardado.setEstado("PENDIENTE_REVISION");
        informeService.editarInforme(informeGuardado.getId(), informeGuardado);
        
        return "Informe creado con estado PENDIENTE de REVISION por parte del usuario ";
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
}