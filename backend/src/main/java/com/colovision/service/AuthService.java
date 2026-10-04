package com.colovision.service;
import com.colovision.model.*;
import com.colovision.repository.*;
import com.colovision.security.JwtService;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
@Service
public class AuthService {
    private final UserRepository users;
    private final AdminRepository admins;
    private final JwtService jwt;
    private final BCryptPasswordEncoder encoder=new BCryptPasswordEncoder();
    public AuthService(UserRepository u, AdminRepository a, JwtService j){
        users=u;
        admins=a;
        jwt=j;
    }
    public String register(String name, String email, String phone, String username, String password) {
        if(users.existsByEmailOrUsername(email,username))throw new IllegalArgumentException("Email or username already exists");
        User u=new User();
        u.name=name;
        u.email=email;
        u.phone=phone;
        u.username=username;
        u.passwordHash=encoder.encode(password);
        users.save(u);
        return "Registration submitted and waiting for administrator approval.";
    }
    public String login(String identity, String password, boolean admin){
        if(admin){Admin a=admins.findByEmail(identity).orElseThrow(()->new BadCredentialsException("Invalid administrator credentials"));
        if(!encoder.matches(password,a.passwordHash))throw new BadCredentialsException("Invalid administrator credentials");
        return jwt.create(a.id,"admin");
        }
        User u=users.findByEmailOrUsername(identity,identity).orElseThrow(()->new BadCredentialsException("Invalid login credentials"));
        if(!encoder.matches(password,u.passwordHash))throw new BadCredentialsException("Invalid login credentials");
        if(!"APPROVED".equals(u.status))throw new AccessDeniedException("Account status: "+u.status);
        return jwt.create(u.id,"user");
    }
    public User currentUser(String id){
        User u=users.findById(Long.valueOf(id)).orElseThrow(()->new AccessDeniedException("Approved user access required"));
        if(!"APPROVED".equals(u.status))throw new AccessDeniedException("Approved user access required");return u;
    }
    public Admin currentAdmin(String id){
        return admins.findById(Long.valueOf(id)).orElseThrow(()->new BadCredentialsException("Administrator not found"));
    }
    public User findByEmailOrUsername(String identifier) {
        return users.findByEmailOrUsername(identifier, identifier).orElse(null);
    }
}
