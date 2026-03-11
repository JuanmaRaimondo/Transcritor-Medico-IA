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

import com.transcriptor.BackEnd.Entities.Usuario;
import com.transcriptor.BackEnd.services.UsuarioService;

@RestController
@RequestMapping("/api/usuario")
public class UsuarioController {
    @Autowired
    private UsuarioService usuarioservice;

    @PostMapping("/crear")
    public Usuario crearUsuario(@RequestBody Usuario usuario){
        return usuarioservice.usuarioNuevo(usuario);
    }

    @GetMapping("/listausuarios")
    public List<Usuario> listaDeUsuario(){
        return usuarioservice.listaDeMedicos();
    }

    @GetMapping("/traerusuario/{id}")
    public Usuario traerUsuarioId(@PathVariable String id){
        return usuarioservice.traerMedicoConId(id);
    }

    @PutMapping("/editar/{id}")
    public Usuario editarUsuario(@PathVariable String id, @RequestBody Usuario usuario){
       
        return usuarioservice.editarMedico(usuario, id);
    }

    @DeleteMapping("/borrar/{id}")
    public String borrarUsuario(@PathVariable String id){
        usuarioservice.borrarMedico(id);
        return "Se ha borrado el medico exitosamente";
    }
}
