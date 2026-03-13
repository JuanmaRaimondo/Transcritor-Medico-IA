package com.transcriptor.BackEnd.services;

import java.security.Key;
import java.util.Date;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {
    // 1. La Palabra Secreta: Tiene que ser larguísima (mínimo 256 bits). 
    // En producción esto va en un archivo .env, pero por ahora la dejamos acá.
    private static final String SECRET_KEY = "TranscriptorMedicoClaveSecretaSuperSeguraYLarga2026Tecnicatura";

    // 2. Método interno para transformar el String en una Llave criptográfica real
    private Key getSignInKey() {
        return Keys.hmacShaKeyFor(SECRET_KEY.getBytes());
    }

    // 3. LA FÁBRICA: Este es el método que vas a llamar cuando el médico haga login
    public String generarToken(UserDetails usuario) {
        return Jwts.builder()
                .setSubject(usuario.getUsername())
                // A. Decile de quién es el token (El "subject"). Usá usuario.getUsername()
                .setIssuedAt(new Date(System.currentTimeMillis()))
                // B. Decile cuándo se emitió el token. Usá new Date(System.currentTimeMillis())
                .setExpiration(new Date(System.currentTimeMillis()+ 1000 * 60 * 60 * 24))
                // C. Decile cuándo vence. (Ejemplo: 24 horas después). 
                //    Pista: new Date(System.currentTimeMillis() + 1000 * 60 * 60 * 24)
                .signWith(getSignInKey(), SignatureAlgorithm.HS256)
                // D. Firmalo usando la llave y el algoritmo HS256. 
                //    Pista: .signWith(getSignInKey(), SignatureAlgorithm.HS256)
                .compact(); // Esto lo empaqueta y lo transforma en un String
    }
    // 1. Extrae el email (subject) que guardamos adentro del token
    public String extraerUsername(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSignInKey()) // Usamos la misma llave para abrirlo
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    // 2. Valida si el token le pertenece a este usuario y si no está vencido
    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extraerUsername(token);
        return (username.equals(userDetails.getUsername())) && !isTokenExpired(token);
    }

    // 3. Método interno para saber si la fecha de hoy ya superó la fecha de expiración del token
    private boolean isTokenExpired(String token) {
        Date fechaExpiracion = Jwts.parserBuilder()
                .setSigningKey(getSignInKey())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getExpiration();
        return fechaExpiracion.before(new Date());
    }
    
}
