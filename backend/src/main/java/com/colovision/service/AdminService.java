package com.colovision.service;

import com.colovision.model.User;
import com.colovision.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class AdminService {

    private final UserRepository userRepository;

    public AdminService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public List<User> getPendingUsers() {
        return userRepository.findByStatus("PENDING");
    }

    public List<User> getApprovedUsers() {
        return userRepository.findByStatus("APPROVED");
    }

    public User approveUser(Long userId, Long adminId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        user.status = "APPROVED";
        user.approvedBy = adminId;
        user.approvedAt = Instant.now();

        return userRepository.save(user);
    }

    public User rejectUser(Long userId, Long adminId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        user.status = "REJECTED";
        user.approvedBy = adminId;
        user.approvedAt = Instant.now();

        return userRepository.save(user);
    }

    public User suspendUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        user.status = "SUSPENDED";
        return userRepository.save(user);
    }
}