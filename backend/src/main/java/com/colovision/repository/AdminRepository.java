package com.colovision.repository;

import com.colovision.model.Admin;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdminRepository extends JpaRepository<Admin, Long> {

    Optional<Admin> findByEmail(String email);

    long count();

    List<Admin> findAll();
}