package com.annotations.demo.controller;

import com.annotations.demo.dto.LoginRequest;
import com.annotations.demo.dto.LoginResponse;
import com.annotations.demo.dto.MessageResponse;
import com.annotations.demo.dto.SignUpRequest;
import com.annotations.demo.entity.Role;
import com.annotations.demo.entity.RoleType;
import com.annotations.demo.entity.User;
import com.annotations.demo.repository.RoleRepository;
import com.annotations.demo.repository.UserRepository;
import com.annotations.demo.service.JwtService;
import jakarta.validation.Valid;
import org.hibernate.boot.model.process.internal.UserTypeResolution;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Contrôleur gérant l'authentification et les autorisations des utilisateurs.
 *
 * Points de terminaison :
 * - POST /api/auth/login : Authentifie un utilisateur
 * - GET /api/auth/ : Page d'accueil de l'API
 * - GET /api/auth/access-denied : Page d'erreur d'accès refusé
 *
 * Tests recommandés :
 * 1. Vérifier que POST /api/auth/login avec des identifiants valides renvoie un statut 200 et un message de succès.
 * 2. Vérifier que POST /api/auth/login avec des identifiants invalides renvoie un statut 401.
 * 3. Vérifier que / renvoie un statut 200 et le message de bienvenue
 * 4. Vérifier que /access-denied renvoie un statut 403 et le message d'erreur
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final UserRepository userRepository ;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final PasswordEncoder encoder;
    private final RoleRepository roleRepository;

    @Autowired
    public AuthController(AuthenticationManager authenticationManager, JwtService jwtService, UserRepository userRepository, PasswordEncoder encoder, RoleRepository roleRepository) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.encoder = encoder;
        this.roleRepository = roleRepository;
    }

    @PostMapping("/SignUp")
    public ResponseEntity<?> SignUp(@Valid @RequestBody SignUpRequest signUpRequest){
        if(userRepository.existsByLogin(signUpRequest.getLogin())){
            return ResponseEntity.badRequest().body(new MessageResponse("the login is already taken "));
        }

        User user = new User(signUpRequest.getNom(),signUpRequest.getPrenom(), signUpRequest.getLogin(), encoder.encode(signUpRequest.getPassword()), signUpRequest.getDeleted());
        Role role;
        if("ADMIN".equals(signUpRequest.getRole())){
            role  = roleRepository.findByRole(RoleType.ADMIN_ROLE);
        } else {
             role  = roleRepository.findByRole(RoleType.USER_ROLE);
        }
        user.setRole(role);
        userRepository.save(user);
        return ResponseEntity.ok(new MessageResponse("new user added with success "));
    }

    /**
     * Authentifie un utilisateur en utilisant les identifiants fournis.
     *
     * @param loginRequest Les identifiants de connexion (login et mot de passe)
     * @return ResponseEntity avec un message de succès et le rôle de l'utilisateur, ou un message d'erreur.
     *
     * Test : Envoyer une requête POST à /api/auth/login avec des identifiants valides/invalides.
     */
    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser( @RequestBody LoginRequest loginRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getLogin(), loginRequest.getPassword())
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            
            // Collect user authorities
            String role = userDetails.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .collect(Collectors.joining(","));

            // Generate JWT token
            Map<String, Object> extraClaims = new HashMap<>();
            extraClaims.put("role", role);
            String jwt = jwtService.generateToken(extraClaims, userDetails.getUsername());

            // Create response body
            Map<String, Object> response = new HashMap<>();
            response.put("token", jwt);
            response.put("username", userDetails.getUsername());
            response.put("role", role);
            response.put("message", "Authentication successful");

            // Add token to headers
            HttpHeaders headers = new HttpHeaders();
            headers.add("Authorization", "Bearer " + jwt);

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(response);

        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                        "error", "Invalid credentials",
                        "message", "Username or password incorrect"
                    ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                        "error", "Authentication failed",
                        "message", e.getMessage()
                    ));
        }
    }
}