package com.transcriptor.BackEnd.services;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.transcriptor.BackEnd.Entities.Plantilla;
import com.transcriptor.BackEnd.repositories.IPlantillaRepository;

@Service
public class PlantillaService {
    @Autowired
    private IPlantillaRepository plantillaRepo;

    public Plantilla crearPlantilla(Plantilla plantilla){
        return plantillaRepo.save(plantilla);
    }

    public List<Plantilla> listarPlantillas(){
        return plantillaRepo.findAll();
    }

    public Plantilla buscarPorTipoEstudio(String tipoEstudio){
        return plantillaRepo.findBytipoEstudio(tipoEstudio)
                .orElseThrow(() -> new RuntimeException("No existe una plantilla para el estudio: " + tipoEstudio));
    }

    public String borrarPlantilla(String id){
        plantillaRepo.deleteById(id);
        return "Plantilla id";
    }

    public String resolverProcedimiento(Plantilla plantilla, Map<String, String> valores){
        String resultado = plantilla.getProcedimiento();
        if (valores != null) {
            for (Map.Entry<String, String> entry : valores.entrySet()) {
                resultado = resultado.replace("{{" + entry.getKey() + "}}", entry.getValue());
            }
        }
        return resultado;
    }
}
