package com.transcriptor.BackEnd.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.transcriptor.BackEnd.DTOs.AuthResponseDTO;
import com.transcriptor.BackEnd.DTOs.LoginRequestDTO;
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
        
        // 1. Le decimos al Gerente que intente hacer el login. 
        // Si la contraseña está mal, Spring frena todo acá y tira un error 403 automático.
        // Pista: authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(request.email(), request.password()));
        manager.authenticate(new UsernamePasswordAuthenticationToken(request.email(), request.password()));
        // 2. Si pasamos la línea de arriba, las credenciales son perfectas.
        // Ahora buscamos al usuario en la base de datos usando tu servicio.
        // Pista: UserDetails usuario = usuarioService.loadUserByUsername(request.email());
        UserDetails usuario = usuarioService.loadUserByUsername(request.email());
        // 3. Mandamos los datos de ese usuario a nuestra fábrica para imprimir el Pase VIP.
        // Pista: String tokenGenerado = jwtService.generarToken(usuario);
        String tokenGenerado = jwtService.generarToken(usuario);
        // 4. Metemos el token en nuestro DTO de respuesta y lo devolvemos con un status 200 (OK).
        // Pista: return ResponseEntity.ok(new AuthResponseDTO(tokenGenerado));
        return ResponseEntity.ok(new AuthResponseDTO(tokenGenerado));
    }
}
