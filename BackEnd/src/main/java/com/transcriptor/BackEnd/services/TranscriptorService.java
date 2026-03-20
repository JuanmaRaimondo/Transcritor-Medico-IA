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
import com.google.cloud.speech.v1.SpeechClient;
import com.google.cloud.speech.v1.SpeechSettings;
import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.BucketInfo;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.StorageOptions;
import com.google.api.gax.longrunning.OperationFuture;
import com.google.cloud.speech.v1.LongRunningRecognizeMetadata;
import com.google.cloud.speech.v1.LongRunningRecognizeResponse;
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
            
            // 1. Configuramos Google Cloud Storage para subir el audio temporalmente
            Storage storage = StorageOptions.newBuilder().setCredentials(credenciales).build().getService();
            String projectId = storage.getOptions().getProjectId();
            if (projectId == null) projectId = "transcriptor-ia-app";
            
            // Creamos un nombre de bucket único por proyecto (nombres deben ser únicos globalmente)
            String bucketName = "audios-tmp-" + projectId;
            
            // Si el bucket no existe, lo creamos
            if (storage.get(bucketName) == null) {
                storage.create(BucketInfo.newBuilder(bucketName).build());
            }

            // 2. Subimos el archivo a Storage
            String nombreArchivo = archivo.getOriginalFilename();
            String objectName = java.util.UUID.randomUUID().toString() + "-" + nombreArchivo;
            BlobId blobId = BlobId.of(bucketName, objectName);
            BlobInfo blobInfo = BlobInfo.newBuilder(blobId).setContentType(archivo.getContentType()).build();
            
            System.out.println("Subiendo archivo a GCS: gs://" + bucketName + "/" + objectName);
            storage.create(blobInfo, archivo.getBytes());
            
            // 3. Procedemos a transcribir con la URL de GCS
            SpeechSettings configuracionCliente = SpeechSettings.newBuilder()
                    .setCredentialsProvider(FixedCredentialsProvider.create(credenciales))
                    .build();

            try (SpeechClient speechClient = SpeechClient.create(configuracionCliente)) {
                
                String gcsUri = "gs://" + bucketName + "/" + objectName;
                RecognitionAudio paqueteAudio = RecognitionAudio.newBuilder().setUri(gcsUri).build();
                
                // ---- LA MAGIA DE QA EMPIEZA ACÁ ----
                RecognitionConfig.Builder configBuilder = RecognitionConfig.newBuilder().setLanguageCode("es-AR");
                
                if (nombreArchivo != null && nombreArchivo.toLowerCase().endsWith(".webm")) {
                    configBuilder.setEncoding(RecognitionConfig.AudioEncoding.WEBM_OPUS);
                    configBuilder.setSampleRateHertz(48000); 
                }
                
                RecognitionConfig configuracion = configBuilder.build();
                // ---- TERMINA LA MAGIA ----
                
                System.out.println("Iniciando transcripción asíncrona de larga duración...");
                OperationFuture<LongRunningRecognizeResponse, LongRunningRecognizeMetadata> response =
                        speechClient.longRunningRecognizeAsync(configuracion, paqueteAudio);
                
                // Esperamos a que termine el procesamiento en Google
                while (!response.isDone()) {
                    System.out.println("Esperando a que Google termine de transcribir (espere)...");
                    Thread.sleep(3000);
                }
                
                // 4. Borramos el archivo inmediatamente para que sea gratis (capa siempre gratuita)
                System.out.println("Transcripción terminada. Borrando audio de GCS...");
                storage.delete(blobId);

                // 5. Unimos todos los fragmentos transcriptos
                StringBuilder reporteCompleto = new StringBuilder();
                for (com.google.cloud.speech.v1.SpeechRecognitionResult result : response.get().getResultsList()) {
                    reporteCompleto.append(result.getAlternativesList().get(0).getTranscript()).append(" ");
                }
                
                return reporteCompleto.toString().trim();
            }

        } catch (Exception e) {
            e.printStackTrace();
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

        
        informeService.crearInforme(informeEncontrado);
        
        
        return informeEncontrado; 
    }

}