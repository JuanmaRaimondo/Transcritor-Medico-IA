package com.transcriptor.BackEnd.services;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.transcriptor.BackEnd.Entities.Usuario;
import com.transcriptor.BackEnd.repositories.IUsuarioRepository;

@Service
public class UsuarioService implements UserDetailsService{
    
    @Autowired
    private IUsuarioRepository usuariorepo;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public Usuario usuarioNuevo(Usuario usuario){
            String contraseñaEncriptada = passwordEncoder.encode(usuario.getPassword());
            usuario.setPassword(contraseñaEncriptada);
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

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
       Optional<Usuario> usuarioEncontrado = usuariorepo.findByEmail(username);
       if(!usuarioEncontrado.isEmpty()){
        return usuarioEncontrado.get();
       }else{
            throw new UsernameNotFoundException("No se encuentra el usuario");
       }
    }
}
