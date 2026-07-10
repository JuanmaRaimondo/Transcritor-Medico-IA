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
            // Llamamos a tu servicio pasándole directamente los dos Strings (email y password)
            // Tu servicio devolverá true si se cambió con éxito, o false si el email no existe
            boolean exito = usuarioService.cambiarPassword(email, nuevaPassword);
            
            if (exito) {
                return ResponseEntity.ok("{\"mensaje\": \"Contraseña actualizada exitosamente\"}");
            } else {
                return ResponseEntity.status(404).body("{\"error\": \"Usuario no encontrado\"}");
            }
            
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("{\"error\": \"Error interno del servidor\"}");
        }
    }

    // ⚠️ CAMBIA ESTO POR TU ID DE CLIENTE REAL DE GOOGLE
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
                    // Mantenemos la lógica de guardar la especialidad por defecto en apellido
                    usuario.setApellido(apellido != null ? apellido : "Radiología"); 
                    usuario.setRol("ROLE_MEDICO");
                    // Le asignamos una contraseña aleatoria encriptada segura (porque nunca la va a usar de forma manual)
                    usuario.setPassword(org.springframework.security.crypto.bcrypt.BCrypt.hashpw(java.util.UUID.randomUUID().toString(), org.springframework.security.crypto.bcrypt.BCrypt.gensalt()));
                    
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
                    usuario.getApellido() // Recordá que acá mapeas la especialidad
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
