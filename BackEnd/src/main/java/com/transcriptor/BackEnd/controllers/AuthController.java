package com.transcriptor.BackEnd.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.transcriptor.BackEnd.DTOs.AuthResponseDTO;
import com.transcriptor.BackEnd.DTOs.LoginRequestDTO;
import com.transcriptor.BackEnd.DTOs.RegisterRequestDTO;
import com.transcriptor.BackEnd.Entities.Usuario;
import com.transcriptor.BackEnd.services.JwtService;
import com.transcriptor.BackEnd.services.UsuarioService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    private AuthenticationManager manager;
    @Autowired
    private UsuarioService usuarioService;
    @Autowired 
    private JwtService jwtService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(@RequestBody LoginRequestDTO request) {
        
        // 1. Autenticamos las credenciales
        manager.authenticate(new UsernamePasswordAuthenticationToken(request.email(), request.password()));
        
        // 2. Buscamos al usuario. Hacemos un "cast" a Usuario para poder acceder a getNombre() y getApellido()
        Usuario usuario = (Usuario) usuarioService.loadUserByUsername(request.email());
        
        // 3. Generamos el token
        String tokenGenerado = jwtService.generarToken(usuario);
        
        // 4. Devolvemos el paquete completo: Token + Datos del usuario
        // Recordá que guardaste la especialidad en el campo apellido durante el registro
        return ResponseEntity.ok(new AuthResponseDTO(
            tokenGenerado, 
            usuario.getNombre(), 
            usuario.getEmail(), 
            usuario.getApellido() // Acá está guardada la especialidad
        ));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequestDTO request) {
        
        // 1. Instanciamos un nuevo usuario vacío
        Usuario nuevoUsuario = new Usuario();
        
        // 2. Mapeamos los datos del Frontend a nuestra Entidad
        nuevoUsuario.setNombre(request.nombre());
        nuevoUsuario.setEmail(request.email());
        nuevoUsuario.setPassword(request.password());
        
        // Como tu modelo no tiene "especialidad", lo guardamos temporalmente en "apellido" 
        // (después podés agregar el atributo especialidad a tu clase Usuario si querés)
        nuevoUsuario.setApellido(request.especialidad()); 
        
        // 3. Le asignamos un rol por defecto. Spring Security suele requerir el prefijo "ROLE_"
        nuevoUsuario.setRol("ROLE_MEDICO"); 

        // 4. Se lo pasamos a tu servicio (que ya tiene la lógica para encriptar la clave y guardarlo en MongoDB)
        usuarioService.usuarioNuevo(nuevoUsuario);

        
        return ResponseEntity.ok("Usuario registrado exitosamente");
    }

    @PostMapping("/cambiar-password")
    public ResponseEntity<?> cambiarPassword(@RequestBody java.util.Map<String, String> request) {
        
        String email = request.get("email");
        String nuevaPassword = request.get("password"); // Verificá que en React el campo se llame "password"

        if (email == null || nuevaPassword == null) {
            return ResponseEntity.badRequest().body("{\"error\": \"Email y contraseña son obligatorios\"}");
        }

        try {
            // 1. Buscamos al usuario por su email
            Usuario usuario = (Usuario) usuarioService.loadUserByUsername(email);
            
            // 2. Necesitamos actualizar la contraseña.
            // OJO: Esta contraseña NUEVA tiene que encriptarse antes de guardarse en MongoDB.
            usuarioService.cambiarPassword(usuario, nuevaPassword);
            
            return ResponseEntity.ok("{\"mensaje\": \"Contraseña actualizada exitosamente\"}");
            
        } catch (org.springframework.security.core.userdetails.UsernameNotFoundException e) {
            return ResponseEntity.status(404).body("{\"error\": \"Usuario no encontrado\"}");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("{\"error\": \"Error interno del servidor\"}");
        }
    }
}
