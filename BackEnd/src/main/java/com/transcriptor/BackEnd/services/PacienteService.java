package com.transcriptor.BackEnd.services;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.transcriptor.BackEnd.Entities.Paciente;
import com.transcriptor.BackEnd.repositories.IPacienteRepository;

@Service
public class PacienteService {
    @Autowired
    private IPacienteRepository pacienterepo;

    public Paciente pacienteNuevo(Paciente paciente){
        return pacienterepo.save(paciente);
    }

    public List<Paciente> listaDePaciente(){
        return pacienterepo.findAll();
    }

    public Paciente buscarPacienteId(String id){
        Paciente pacienteEncontrado = pacienterepo.findById(id).orElse(null);
        return pacienteEncontrado;
    }

    public Paciente editarPaciente(String id, Paciente paciente){
        Paciente pacienteEncontrado = pacienterepo.findById(id).orElseThrow(() -> new RuntimeException("¡Error! Paciente no encontrado"));
        
            pacienteEncontrado.setApellido(paciente.getApellido());
            pacienteEncontrado.setNombre(paciente.getNombre());
            pacienteEncontrado.setFechaNacimiento(paciente.getFechaNacimiento());
            pacienteEncontrado.setObraSocial(paciente.getObraSocial());
        
        return pacienterepo.save(pacienteEncontrado);
    }
    
    public String borrarPaciente(String id){
        pacienterepo.deleteById(id);
        return "El paciente ha sido borrado con exito";
    }
    
}
