package com.transcriptor.BackEnd.services;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.transcriptor.BackEnd.Entities.TerminoMedico;
import com.transcriptor.BackEnd.repositories.ITerminoMedicoRepository;

@Service
public class TerminoMedicoService {
    @Autowired
    private ITerminoMedicoRepository terminoRepo;

    public TerminoMedico crearTermino(TerminoMedico termino){
        return terminoRepo.save(termino);
    }

    public List<TerminoMedico> listarTerminos(){
        return terminoRepo.findAll();
    }

    public String borrarTermino(String id){
        terminoRepo.deleteById(id);
        return "Término borrado";
    }

    // Este es el método que va a usar TranscriptorService
    public String listarComoTextoParaPrompt(){
        List<TerminoMedico> todos = terminoRepo.findAll();
        return todos.stream()
                .map(TerminoMedico::getTermino)
                .collect(Collectors.joining(", "));
    }
}
