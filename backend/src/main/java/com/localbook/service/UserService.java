package com.localbook.service;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;
import com.localbook.model.User;
import com.localbook.model.UserRole;
import com.localbook.repository.UserRepository;

@Service
public class UserService {
    
    @Autowired
    private UserRepository userRepository;

    // Register a new CLIENT
    @Transactional
    public User registerClient(User user) {
        System.out.println("====================================");
        System.out.println("🔵 registerClient called");
        System.out.println("🔵 Email: " + user.getEmail());
        
        // Check if email already exists
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new IllegalArgumentException("Email already in use.");
        }
        
        // Check if phone number already exists
        if (userRepository.existsByPhoneNumber(user.getPhoneNumber())) {
            throw new IllegalArgumentException("Phone number already in use.");
        }
        
        System.out.println("🔵 Role before setting: " + user.getRole());
        
        // Force set role as CLIENT - clear any existing value first
        user.setRole(null);
        user.setRole(UserRole.CLIENT);
        
        System.out.println("🔵 Role after setting: " + user.getRole());
        
        // Save the user
        User savedUser = userRepository.save(user);
        
        System.out.println("✅ User saved with ID: " + savedUser.getId());
        System.out.println("✅ Final role in DB: " + savedUser.getRole());
        System.out.println("====================================");
        
        // Verify the role was saved correctly
        if (savedUser.getRole() != UserRole.CLIENT) {
            System.err.println("❌❌❌ CRITICAL ERROR: Role was not CLIENT after save!");
            System.err.println("❌ Expected: CLIENT, Got: " + savedUser.getRole());
            // Try to fix it
            savedUser.setRole(UserRole.CLIENT);
            savedUser = userRepository.save(savedUser);
            System.out.println("🔧 Attempted to fix role, new value: " + savedUser.getRole());
        }
        
        return savedUser;
    }

    // Register a new BUSINESS OWNER - Ultra defensive version
    @Transactional
    public User registerBusinessOwner(User user) {
        System.out.println("====================================");
        System.out.println("🟢 registerBusinessOwner called");
        System.out.println("🟢 Email: " + user.getEmail());
        System.out.println("🟢 Name: " + user.getName());
        System.out.println("🟢 Phone: " + user.getPhoneNumber());
        
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new IllegalArgumentException("Email already in use.");
        }
        
        if (userRepository.existsByPhoneNumber(user.getPhoneNumber())) {
            throw new IllegalArgumentException("Phone number already in use.");
        }
        
        System.out.println("🟢 Role before any setting: " + user.getRole());
        
        // ⭐ ULTRA DEFENSIVE: Force set role multiple times
        user.setRole(null);  // Clear any existing value
        user.setRole(UserRole.BUSINESS_OWNER);  // Set correct value
        
        System.out.println("🟢 Role after first setting: " + user.getRole());
        
        // Verify it stuck
        if (user.getRole() != UserRole.BUSINESS_OWNER) {
            System.err.println("⚠️ WARNING: Role didn't stick, setting again");
            user.setRole(UserRole.BUSINESS_OWNER);
        }
        
        System.out.println("🟢 Role before save: " + user.getRole());
        
        // Save the user
        User savedUser = userRepository.save(user);
        
        System.out.println("✅ User saved with ID: " + savedUser.getId());
        System.out.println("✅ Role immediately after save: " + savedUser.getRole());
        
        // ⭐ CRITICAL: Verify the role was saved correctly
        if (savedUser.getRole() != UserRole.BUSINESS_OWNER) {
            System.err.println("❌❌❌ CRITICAL ERROR ❌❌❌");
            System.err.println("❌ Role was NOT BUSINESS_OWNER after save!");
            System.err.println("❌ Expected: BUSINESS_OWNER");
            System.err.println("❌ Got: " + savedUser.getRole());
            System.err.println("❌ This indicates a database-level issue!");
            System.err.println("❌ Check for DEFAULT values in database schema!");
            
            // Try to fix it immediately
            savedUser.setRole(UserRole.BUSINESS_OWNER);
            savedUser = userRepository.save(savedUser);
            System.out.println("🔧 Forced second save with role: " + savedUser.getRole());
            
            if (savedUser.getRole() != UserRole.BUSINESS_OWNER) {
                System.err.println("❌ STILL WRONG AFTER SECOND SAVE!");
                System.err.println("❌ DATABASE SCHEMA MUST BE FIXED!");
                System.err.println("❌ Run: ALTER TABLE users MODIFY COLUMN role VARCHAR(50) NOT NULL;");
                System.err.println("❌ Then run: UPDATE users SET role='BUSINESS_OWNER' WHERE id=" + savedUser.getId() + ";");
            }
        }
        
        // Fetch fresh from database to absolutely confirm
        User confirmedUser = userRepository.findById(savedUser.getId()).orElse(savedUser);
        System.out.println("✅ Role confirmed from fresh DB query: " + confirmedUser.getRole());
        System.out.println("====================================");
        
        return confirmedUser;
    }

    // Get all users
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // Find user by ID
    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    // Find user by email
    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    // Find user by phone number
    public Optional<User> getUserByPhoneNumber(String phoneNumber) {
        return userRepository.findByPhoneNumber(phoneNumber);
    }

    // Get all clients
    public List<User> getAllClients() {
        return userRepository.findByRole(UserRole.CLIENT);
    }

    // Get all business owners
    public List<User> getAllBusinessOwners() {
        return userRepository.findByRole(UserRole.BUSINESS_OWNER);
    }

    // Update user information
    @Transactional
    public User updateUser(Long id, User updatedUser) {
        Optional<User> existingUserOpt = userRepository.findById(id);
        
        if (existingUserOpt.isPresent()) {
            User user = existingUserOpt.get();
            
            System.out.println("🔄 Updating user ID: " + id + ", Email: " + user.getEmail());
            
            // Update name if provided
            if (updatedUser.getName() != null && !updatedUser.getName().isEmpty()) {
                user.setName(updatedUser.getName());
            }
            
            // Update phone number if provided
            if (updatedUser.getPhoneNumber() != null && !updatedUser.getPhoneNumber().isEmpty()) {
                user.setPhoneNumber(updatedUser.getPhoneNumber());
            }
            
            // Update email if provided
            if (updatedUser.getEmail() != null && !updatedUser.getEmail().isEmpty()) {
                user.setEmail(updatedUser.getEmail());
            }
            
            // Update role if provided
            if (updatedUser.getRole() != null) {
                String oldRole = user.getRole() != null ? user.getRole().toString() : "NULL";
                user.setRole(updatedUser.getRole());
                System.out.println("🔄 Role changed from " + oldRole + " to " + updatedUser.getRole());
            }
            
            // Update businessId if provided
            if (updatedUser.getBusinessId() != null) {
                user.setBusinessId(updatedUser.getBusinessId());
            }
            
            // Update password if provided (not empty)
            if (updatedUser.getPassword() != null && !updatedUser.getPassword().isEmpty()) {
                user.setPassword(updatedUser.getPassword());
            }
            
            User savedUser = userRepository.save(user);
            System.out.println("✅ User updated successfully, final role: " + savedUser.getRole());
            
            return savedUser;
        } else {
            throw new IllegalArgumentException("User not found with ID: " + id);
        }
    }

    // Delete user
    public void deleteUser(Long id) {
        if (userRepository.existsById(id)) {
            userRepository.deleteById(id);
        } else {
            throw new IllegalArgumentException("User not found with ID: " + id);
        }
    }

    // Check if user exists by email
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    // Login validation (basic - improve later with Spring Security)
    public Optional<User> login(String email, String password) {
        Optional<User> user = userRepository.findByEmail(email);
        
        if (user.isPresent() && user.get().getPassword().equals(password)) {
            System.out.println("✅ Login successful");
            System.out.println("   Email: " + email);
            System.out.println("   Role: " + user.get().getRole());
            System.out.println("   User ID: " + user.get().getId());
            return user;
        }
        
        System.out.println("❌ Login failed for: " + email);
        return Optional.empty();
    }
}