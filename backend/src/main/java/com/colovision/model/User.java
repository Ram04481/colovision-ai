package com.colovision.model;
import jakarta.persistence.*; import java.time.Instant;
@Entity @Table(name="users") public class User { @Id @GeneratedValue(strategy=GenerationType.IDENTITY) public Long id; public String name; @Column(unique=true) public String email; public String phone; @Column(unique=true) public String username; @Column(name="password_hash") public String passwordHash; public String status="PENDING"; @Column(name="created_at") public Instant createdAt=Instant.now(); @Column(name="approved_by") public Long approvedBy; @Column(name="approved_at") public Instant approvedAt; }
