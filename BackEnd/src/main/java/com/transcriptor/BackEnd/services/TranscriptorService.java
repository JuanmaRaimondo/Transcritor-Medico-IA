package com.transcriptor.BackEnd.services;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.transcriptor.BackEnd.Entities.InformeMedico;
import com.transcriptor.BackEnd.Entities.Paciente;
import com.transcriptor.BackEnd.repositories.IPacienteRepository;
import com.transcriptor.BackEnd.repositories.IUsuarioRepository;

@Service
public class TranscriptorService {
    
    @Autowired
    private IPacienteRepository pacienterepo;

    @Autowired
    private IUsuarioRepository usuariorepo;

    @Autowired
    private InformeService informeService;

            public String crearTranscripcion(String id_paciente, MultipartFile archivo){
                        Optional<Paciente> pacienteExiste = pacienterepo.findById(id_paciente);

                        if(pacienteExiste.isEmpty()){
                            throw new RuntimeException("Paciente no encontrado");
                        }

                        Paciente paciente = pacienteExiste.get();

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
                        informeService.crearInforme(informeNuevo);
                        return "Informe creado con estado PROCESADO ";

            }

            





    }
