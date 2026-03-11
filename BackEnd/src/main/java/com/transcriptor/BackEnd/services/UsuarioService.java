package com.transcriptor.BackEnd.services;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.transcriptor.BackEnd.Entities.Usuario;
import com.transcriptor.BackEnd.repositories.IUsuarioRepository;

@Service
public class UsuarioService {
    
    @Autowired
    private IUsuarioRepository usuariorepo;

    public Usuario usuarioNuevo(Usuario usuario){
        return usuariorepo.save(usuario);
    }

    public List<Usuario> listaDeMedicos(){
        return usuariorepo.findAll();
    }

    public Usuario traerMedicoConId(String id){
        Usuario usuarioEncontrado = usuariorepo.findById(id).orElseThrow(() -> new RuntimeException("¡Error! Medico no encontrado"));
        
            return usuarioEncontrado;
        
    }

    public Usuario editarMedico(Usuario usuario, String id){
        Usuario usuarioEncontrado = usuariorepo.findById(id).orElseThrow(() -> new RuntimeException("¡Error! Medico no encontrado"));
        usuarioEncontrado.setApellido(usuario.getApellido());
        usuarioEncontrado.setNombre(usuario.getNombre());
        usuarioEncontrado.setEmail(usuario.getEmail());
        usuarioEncontrado.setPreferenciasIA(usuario.getPreferenciasIA());

        usuariorepo.save(usuarioEncontrado);
        return usuarioEncontrado;
    }

    public String borrarMedico(String id){
        usuariorepo.deleteById(id);
        return "El medico ha sido borrado";
    }
}
