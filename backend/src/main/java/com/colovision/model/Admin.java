package com.colovision.model;
import jakarta.persistence.*; import java.time.Instant;
@Entity
@Table(name="admins")
public class Admin {
    @Id
    @GeneratedValue(strategy=GenerationType.IDENTITY) public Long id;
    @Column(length=120,nullable=false) public String name;
    @Column(unique=true,nullable=false) public String email;
    @Column(name="password_hash",nullable=false) public String passwordHash;
    @Column(name="created_at",nullable=false) public Instant createdAt=Instant.now();
}
