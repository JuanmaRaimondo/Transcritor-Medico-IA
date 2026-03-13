package com.transcriptor.BackEnd.controllers;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.transcriptor.BackEnd.DTOs.PacienteRequestDTO;
import com.transcriptor.BackEnd.DTOs.PacienteResponseDTO;
import com.transcriptor.BackEnd.Entities.Paciente;
import com.transcriptor.BackEnd.services.PacienteService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/paciente")
public class PacienteController {
    @Autowired
    private PacienteService pacienteService;

    @PostMapping("/crear")
    public Paciente crearPaciente(@Valid @RequestBody PacienteRequestDTO pacienteDTO) {
        
        // 1. Creamos un Paciente vacío (la Entidad que va a la base de datos)
        Paciente pacienteAguardar = new Paciente();

        // 2. Mapeamos (copiamos) los datos del DTO a la Entidad
        // Ojo acá: como usaste un 'record', se llama pacienteDTO.nombre() y no getNombre()
        pacienteAguardar.setNombre(pacienteDTO.nombre());
        pacienteAguardar.setApellido(pacienteDTO.apellido());
        pacienteAguardar.setObraSocial(pacienteDTO.obraSocial());
        pacienteAguardar.setFechaNacimiento(pacienteDTO.fechaNacimiento());

        // 3. Mandamos a guardar la Entidad (ahora el servicio no se queja porque le pasamos un Paciente)
        Paciente pacienteGuardado = pacienteService.pacienteNuevo(pacienteAguardar);
        
        // 4. Devolvemos el paciente ya guardado (con su ID de Mongo)
        return pacienteGuardado;
    }

    @GetMapping("/listapacientes")
    public List<Paciente> listaDePaciente(){
       
        return  pacienteService.listaDePaciente();
    }

    @GetMapping("/traerpaciente/{id}")
    public PacienteResponseDTO traerPacientePorId(@PathVariable String id) {
        // 1. Buscamos la entidad real en la base de datos
        Paciente paciente = pacienteService.buscarPacienteId(id);
        
        // 2. Armamos el DTO de salida copiando los datos
        PacienteResponseDTO respuestaDTO = new PacienteResponseDTO(
                paciente.getId(),
                paciente.getNombre(),
                paciente.getApellido(),
                paciente.getObraSocial(),
                paciente.getFechaNacimiento()
        );
        
        // 3. Devolvemos el DTO limpio
        return respuestaDTO;
    }

    @PutMapping("/editar/{id}")
    public Paciente editarPaciente(@PathVariable String id, @Valid @RequestBody Paciente paciente){
      return  pacienteService.editarPaciente(id, paciente);
    }

    @DeleteMapping("/borrar/{id}")
    public String borrarPaciente(@PathVariable String id){
        pacienteService.borrarPaciente(id);
        return "Paciente borrado exitosamente";
    }
}
