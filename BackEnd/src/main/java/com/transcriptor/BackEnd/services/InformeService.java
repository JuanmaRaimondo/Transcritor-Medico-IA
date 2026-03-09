package com.transcriptor.BackEnd.services;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.transcriptor.BackEnd.Entities.InformeMedico;
import com.transcriptor.BackEnd.repositories.IInformeMedicoRepository;

@Service
public class InformeService {
    
    @Autowired
    private IInformeMedicoRepository informerepo;

    public InformeMedico crearInforme(InformeMedico informe){
        return informerepo.save(informe);
    }

    public List<InformeMedico> traerInformesPorPaciente(String idPaciente){
                return informerepo.findByIdPaciente(idPaciente);
            }

    public InformeMedico editarInforme(String idInforme, InformeMedico informe){
        InformeMedico informeEncontrado =  informerepo.findById(idInforme).orElseThrow(() -> new RuntimeException("¡Error! Informe no encontrado"));

        if (informeEncontrado != null){
            informeEncontrado.setEstado(informe.getEstado());
            informeEncontrado.setTipoEstudio(informe.getTipoEstudio());
            informeEncontrado.setTextoCorregido(informe.getTextoCorregido());
            informeEncontrado.setFeedback(informe.getFeedback());

        }
        return informerepo.save(informeEncontrado);
    }

    public String borrarInforme(String id){
        informerepo.deleteById(id);
        return "¡Se ha borrado el informe!";
    }
}
