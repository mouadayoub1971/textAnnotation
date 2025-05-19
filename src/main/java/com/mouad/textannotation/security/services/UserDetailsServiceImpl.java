package com.mouad.textannotation.security.services;


import com.mouad.textannotation.models.User;
import com.mouad.textannotation.repository.UserRepository;
import com.mouad.textannotation.security.jwt.AuthEntryPointJwt;
import com.mouad.textannotation.security.jwt.AuthTokenFilter;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {
    @Autowired
    UserRepository userRepository;


    @Transactional
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User Not Found with username : " + username));
        return UserDetailsImpl.build(user);
    }
}
