package com.transcriptor.BackEnd.services;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import com.transcriptor.BackEnd.DTOs.CrearInformeDesdePlantillaDTO;
import com.transcriptor.BackEnd.Entities.InformeMedico;
import com.transcriptor.BackEnd.Entities.Plantilla;
import com.transcriptor.BackEnd.repositories.IInformeMedicoRepository;

@Service
public class InformeService {
    
    @Autowired
    private IInformeMedicoRepository informerepo;

    @Autowired
    private MongoTemplate mongoTemplate;

    @Autowired
    private PlantillaService plantillaService;

    public InformeMedico crearInforme(InformeMedico informe){
        return informerepo.save(informe);
    }

    public InformeMedico crearInformeDesdePlantilla(CrearInformeDesdePlantillaDTO datos, String idMedico){
    // Validamos que el tipo de estudio sea uno soportado (mismo enum que ya usás en dictado libre)
    com.transcriptor.BackEnd.Entities.TipoEstudio.fromLabel(datos.tipoEstudio());

    Plantilla plantilla = plantillaService.buscarPorTipoEstudio(datos.tipoEstudio());
    String procedimientoResuelto = plantillaService.resolverProcedimiento(plantilla, datos.valoresPlaceholders());

    InformeMedico informeNuevo = new InformeMedico(
        null,
        datos.nombrePaciente(),
        datos.apellidoPaciente(),
        idMedico,
        datos.tipoEstudio(),
        procedimientoResuelto,
        null,                       // textoCrudo — no aplica, la interpretación ya viene armada del frontend
        datos.interpretacion(),     // lo que el médico armó con chips + dictado
        null,
        "PENDIENTE_REVISION",
        LocalDateTime.now()
    );

    return crearInforme(informeNuevo);
}

    public List<InformeMedico> traerInformesPorMedico(String idMedico){
        return informerepo.findByIdMedico(idMedico);
    }

    // Reemplaza a traerInformesPorPaciente: filtra por médico logueado + nombre/apellido/tipoEstudio opcionales
    public List<InformeMedico> buscarInformes(String idMedico, String nombrePaciente, String apellidoPaciente, String tipoEstudio){
        Query query = new Query();
        query.addCriteria(Criteria.where("idMedico").is(idMedico));

        if (nombrePaciente != null && !nombrePaciente.isBlank()) {
            query.addCriteria(Criteria.where("nombrePaciente").regex(nombrePaciente, "i"));
        }
        if (apellidoPaciente != null && !apellidoPaciente.isBlank()) {
            query.addCriteria(Criteria.where("apellidoPaciente").regex(apellidoPaciente, "i"));
        }
        if (tipoEstudio != null && !tipoEstudio.isBlank()) {
            query.addCriteria(Criteria.where("tipoEstudio").is(tipoEstudio));
        }

        return mongoTemplate.find(query, InformeMedico.class);
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

    public InformeMedico buscarInformeId(String id){
        InformeMedico informeEncontrado =  informerepo.findById(id).orElseThrow(() -> new RuntimeException("¡Error! Informe no encontrado"));
        return informeEncontrado;
    }

    public InformeMedico aprobarYFinalizarInforme(String id, String textoFinalManual) {
        InformeMedico informeEncontrado = buscarInformeId(id);

        informeEncontrado.setTextoCorregido(textoFinalManual);
        informeEncontrado.setEstado("REVISADO");
        
        return informerepo.save(informeEncontrado); 
    }
}