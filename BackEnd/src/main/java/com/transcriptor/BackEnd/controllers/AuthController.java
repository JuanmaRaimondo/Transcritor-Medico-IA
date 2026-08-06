package com.transcriptor.BackEnd.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.transcriptor.BackEnd.DTOs.AuthResponseDTO;
import com.transcriptor.BackEnd.Entities.Usuario;
import com.transcriptor.BackEnd.services.JwtService;
import com.transcriptor.BackEnd.services.UsuarioService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    private UsuarioService usuarioService;
    @Autowired 
    private JwtService jwtService;

    private static final String GOOGLE_CLIENT_ID = "910669398388-qc6l71fa3kqi4t1tq236tcpd0v8dm852.apps.googleusercontent.com";

    @PostMapping("/google")
    public ResponseEntity<?> loginConGoogle(@RequestBody com.transcriptor.BackEnd.DTOs.TokenDto tokenDto) {
        try {
            // 1. Configurar el verificador oficial de Google
            com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier verifier = 
                new com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier.Builder(
                    new com.google.api.client.http.javanet.NetHttpTransport(), 
                    new com.google.api.client.json.gson.GsonFactory()
                )
                .setAudience(java.util.Collections.singletonList(GOOGLE_CLIENT_ID))
                .build();

            // 2. Validar que el token enviado por React sea auténtico
            com.google.api.client.googleapis.auth.oauth2.GoogleIdToken idToken = verifier.verify(tokenDto.getToken());

            if (idToken != null) {
                com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload payload = idToken.getPayload();

                // Datos extraídos directamente del perfil seguro de Google del médico
                String email = payload.getEmail();
                String nombre = (String) payload.get("given_name");
                String apellido = (String) payload.get("family_name");

                Usuario usuario;

                try {
                    // 3. Buscamos si el médico ya existe en MongoDB
                    usuario = (Usuario) usuarioService.loadUserByUsername(email);
                } catch (org.springframework.security.core.userdetails.UsernameNotFoundException e) {
                    // 4. REGISTRO IMPLÍCITO: Si no existe, lo creamos automáticamente en este instante
                    usuario = new Usuario();
                    usuario.setEmail(email);
                    usuario.setNombre(nombre);
                    usuario.setApellido(apellido != null ? apellido : ""); 
                    usuario.setRol("ROLE_MEDICO");
                    // Le asignamos una contraseña aleatoria encriptada segura (porque nunca la va a usar de forma manual)
                    usuario.setPassword(org.springframework.security.crypto.bcrypt.BCrypt.hashpw(java.util.UUID.randomUUID().toString(), org.springframework.security.crypto.bcrypt.BCrypt.gensalt()));
                    usuario.setMatricula(null);
                    // Guardamos el nuevo usuario en MongoDB
                    usuario = usuarioService.usuarioNuevo(usuario);
                }

                // 5. Generamos TU TOKEN JWT de siempre usando tu servicio existente
                String tokenGenerado = jwtService.generarToken(usuario);

                // 6. Devolvemos el AuthResponseDTO que tu Frontend ya sabe leer perfectamente
                return ResponseEntity.ok(new AuthResponseDTO(
                    tokenGenerado,
                    usuario.getNombre(),
                    usuario.getEmail(),
                    usuario.getApellido(),
                    usuario.getMatricula() 
                ));

            } else {
                return ResponseEntity.status(401).body(java.util.Map.of("mensaje", "Token de Google inválido o expirado"));
            }

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(java.util.Map.of("mensaje", "Error interno del servidor al validar con Google"));
        }
    }
}
