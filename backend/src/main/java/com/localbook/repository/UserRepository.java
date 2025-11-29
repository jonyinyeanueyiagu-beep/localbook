package com.localbook.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import com.localbook.model.User;
import com.localbook.model.UserRole;  // ✅ ADD THIS IMPORT

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    // Find user by email
    Optional<User> findByEmail(String email);
    
    // Find user by phone number
    Optional<User> findByPhoneNumber(String phoneNumber);
    
    // Check if email exists
    boolean existsByEmail(String email);
    
    // Check if phone number exists
    boolean existsByPhoneNumber(String phoneNumber);
    
    // Find users by role (✅ Changed from String to UserRole)
    List<User> findByRole(UserRole role);
    
    // Delete user by email
    void deleteByEmail(String email);
}