package com.transcriptor.BackEnd.services;

import java.io.InputStream;
import java.time.LocalDateTime;

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

@Service
public class TranscriptorService {
    
    @Autowired
    private InformeService informeService;

    @Autowired
    private TerminoMedicoService terminoMedicoService;

    private final ChatModel chatmodel;

    @Autowired
    public TranscriptorService(ChatModel chatmodel) {
        this.chatmodel = chatmodel;
    }

    public InformeMedico crearTranscripcion(String nombrePaciente, String apellidoPaciente, MultipartFile archivo, String tipoEstudio, String emailMedico){
        
        String textoCrudo = escucharAudioGoogle(archivo);
        String textoInteligente = correccionAudioGoogle(textoCrudo, tipoEstudio);

        InformeMedico informeNuevo = new InformeMedico(
            null,
            nombrePaciente,
            apellidoPaciente,
            emailMedico,
            tipoEstudio,
            textoCrudo,
            textoInteligente,
            null,
            "PENDIENTE_REVISION",
            LocalDateTime.now()
        );

        informeService.crearInforme(informeNuevo);
        
        return informeNuevo;
    }

    private String escucharAudioGoogle(MultipartFile archivo){
        try {
           GoogleCredentials credenciales;
            InputStream credentialsStream = getClass().getResourceAsStream("/google-credentials.json");
            
            if (credentialsStream != null) {
                credenciales = GoogleCredentials.fromStream(credentialsStream);
            } else {
                credenciales = GoogleCredentials.getApplicationDefault();
            }
            
            Storage storage = StorageOptions.newBuilder().setCredentials(credenciales).build().getService();
            String projectId = storage.getOptions().getProjectId();
            if (projectId == null) projectId = "transcriptor-ia-app";
            
            String bucketName = "audios-tmp-" + projectId;
            
            if (storage.get(bucketName) == null) {
                storage.create(BucketInfo.newBuilder(bucketName).build());
            }

            String nombreArchivo = archivo.getOriginalFilename();
            String objectName = java.util.UUID.randomUUID().toString() + "-" + nombreArchivo;
            BlobId blobId = BlobId.of(bucketName, objectName);
            BlobInfo blobInfo = BlobInfo.newBuilder(blobId).setContentType(archivo.getContentType()).build();
            
            System.out.println("Subiendo archivo a GCS: gs://" + bucketName + "/" + objectName);
            storage.create(blobInfo, archivo.getBytes());
            
            SpeechSettings configuracionCliente = SpeechSettings.newBuilder()
                    .setCredentialsProvider(FixedCredentialsProvider.create(credenciales))
                    .build();

            try (SpeechClient speechClient = SpeechClient.create(configuracionCliente)) {
                
                String gcsUri = "gs://" + bucketName + "/" + objectName;
                RecognitionAudio paqueteAudio = RecognitionAudio.newBuilder().setUri(gcsUri).build();
                
                RecognitionConfig.Builder configBuilder = RecognitionConfig.newBuilder().setLanguageCode("es-AR");
                
                if (nombreArchivo != null && nombreArchivo.toLowerCase().endsWith(".webm")) {
                    configBuilder.setEncoding(RecognitionConfig.AudioEncoding.WEBM_OPUS);
                    configBuilder.setSampleRateHertz(48000); 
                }
                
                RecognitionConfig configuracion = configBuilder.build();
                
                System.out.println("Iniciando transcripción asíncrona de larga duración...");
                OperationFuture<LongRunningRecognizeResponse, LongRunningRecognizeMetadata> response =
                        speechClient.longRunningRecognizeAsync(configuracion, paqueteAudio);
                
                while (!response.isDone()) {
                    System.out.println("Esperando a que Google termine de transcribir (espere)...");
                    Thread.sleep(3000);
                }
                
                System.out.println("Transcripción terminada. Borrando audio de GCS...");
                storage.delete(blobId);

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

    private String correccionAudioGoogle(String textoCrudo, String tipoEstudio) {
        // Traemos el diccionario médico completo para dárselo como contexto a la IA
        String diccionario = terminoMedicoService.listarComoTextoParaPrompt();

        String contextoIA = """
                Sos un médico especialista en diagnóstico por imágenes con amplia experiencia
                en la redacción de informes radiológicos en español rioplatense.

                Tu tarea es tomar el texto dictado por el médico (que puede venir desordenado,
                sin puntuación, o con muletillas) y convertirlo en un informe de diagnóstico
                por imágenes correctamente estructurado, correspondiente al siguiente estudio:

                Tipo de estudio: %s

                Reglas para redactar el informe:
                1. NO inventes hallazgos, medidas ni datos que no estén explícita o
                   implícitamente en el texto dictado. Si el médico no mencionó algo,
                   no lo completes por tu cuenta.
                2. Usá terminología médica formal y precisa, propia de un informe de
                   diagnóstico por imágenes (no de una consulta clínica general).
                3. Organizá los HALLAZGOS agrupándolos por estructura u órgano anatómico
                   relevante para este tipo de estudio (por ejemplo, para una tomografía
                   de cráneo: parénquima encefálico, sistema ventricular, estructuras óseas;
                   para una ecografía abdominal: hígado, vesícula, riñones, páncreas; adaptá
                   las secciones al estudio indicado arriba, no uses siempre las mismas).
                4. Si el texto menciona la técnica utilizada (espesor de corte, uso de
                   contraste, planos de reconstrucción), incluila en una sección de
                   TÉCNICA al inicio. Si no se menciona, omitila (no la inventes).
                5. Cerrá siempre con una sección de CONCLUSIÓN (o IMPRESIÓN DIAGNÓSTICA)
                   que resuma en pocas líneas el hallazgo más relevante, en el mismo
                   tono que usaría un médico especialista al firmar el informe.
                6. Formato de salida: texto plano, con los títulos de sección en mayúsculas
                   seguidos de dos puntos (ej. "HALLAZGOS:"), sin usar markdown (nada de
                   asteriscos ni almohadillas), porque este texto se va a insertar
                   directamente en un documento Word/PDF.

                Vocabulario de referencia del centro: si el texto dictado contiene una palabra
                parecida fonéticamente a alguno de estos términos pero mal transcripta por el
                reconocimiento de voz, corregila al término correcto de esta lista:
                %s

                Texto dictado a transcribir:
                %s
                """.formatted(tipoEstudio, diccionario, textoCrudo);

        try {
            var opciones = org.springframework.ai.vertexai.gemini.VertexAiGeminiChatOptions.builder()
                    .withModel("gemini-2.5-flash-lite")
                    .build();

            var prompt = new org.springframework.ai.chat.prompt.Prompt(contextoIA, opciones);

            return chatmodel.call(prompt).getResult().getOutput().getContent();
        } catch (Exception e) {
            System.err.println("========== ERROR CRÍTICO DE VERTEX AI ==========");
            e.printStackTrace();
            System.err.println("================================================");
            throw new RuntimeException("Falló la IA: " + e.getMessage());
        }
    }

    private String feedbackGoogle(String textoActual, String feedbackMedico) {
    String contextoIA = """
            Sos un médico especialista en diagnóstico por imágenes con amplia experiencia
            en la redacción de informes radiológicos en español rioplatense.

            A continuación te voy a pasar un informe de diagnóstico por imágenes que ya fue
            estructurado (con secciones como TÉCNICA, HALLAZGOS y CONCLUSIÓN), y un comentario
            o feedback del médico con correcciones o agregados que quiere hacerle.

            Tu tarea es reescribir el informe aplicando EXACTAMENTE las correcciones que pide
            el médico, manteniendo la estructura de informe de diagnóstico por imágenes
            (TÉCNICA, HALLAZGOS organizados por estructura anatómica, y CONCLUSIÓN al final).
            NO cambies el informe a un formato de consulta clínica general.
            NO inventes hallazgos, medidas ni datos que no estén en el texto original o en
            el feedback del médico.

            Formato de salida: texto plano, con los títulos de sección en mayúsculas seguidos
            de dos puntos, sin usar markdown (nada de asteriscos ni almohadillas), porque este
            texto se va a insertar directamente en un documento Word/PDF.

            --- INFORME ACTUAL ---
            %s

            --- FEEDBACK DEL MÉDICO ---
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
        InformeMedico informeEncontrado = informeService.buscarInformeId(idInforme);
        String textoActual = informeEncontrado.getTextoCorregido();
        String nuevoTexto = feedbackGoogle(textoActual, feedback);
        
        informeEncontrado.setTextoCorregido(nuevoTexto); 
        informeEncontrado.setFeedback(feedback);

        informeService.crearInforme(informeEncontrado);
        
        return informeEncontrado; 
    }
}