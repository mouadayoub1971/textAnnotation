package com.annotations.demo.dto;

import com.annotations.demo.entity.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class SignUpRequest {
    @NotBlank
    private String nom ;
    @NotBlank
    private String prenom ;
    @NotBlank
    private String login ;
    @NotBlank
    private String password ;

    @NotNull
    private Boolean deleted;
    @NotBlank
    private String role;

}
