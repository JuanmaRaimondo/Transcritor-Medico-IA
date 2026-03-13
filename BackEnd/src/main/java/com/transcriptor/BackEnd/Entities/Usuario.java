package com.transcriptor.BackEnd.Entities;

import java.util.Collection;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import lombok.Data;

@Data
@Document(collection = "usuarios")
public class Usuario implements UserDetails{
    @Id
    private String id;
    private String nombre;
    private String apellido;
    private String email;
    private String password;
    private String rol;
    private List<String> preferenciasIA;

    public Usuario(){}

    public Usuario(String id, String nombre, String apellido, String email,String password,String rol, List<String> preferenciasIA) {
        this.id = id;
        this.nombre = nombre;
        this.apellido = apellido;
        this.email = email;
        this.password = password;
        this.rol = rol;
        this.preferenciasIA = preferenciasIA;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority(rol));
    }

    @Override
    public String getUsername() {
       return email;
    }
    
}
