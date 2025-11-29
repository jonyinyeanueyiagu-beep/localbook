package com.localbook.config;
import com.localbook.model.User;
import com.localbook.model.UserRole;
import com.localbook.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DemoDataSeeder implements CommandLineRunner {
    
    @Autowired
    private UserRepository userRepository;
    
    @Override
    public void run(String... args) throws Exception {
        // Only seed if database is empty
        if (userRepository.count() == 0) {
            createDemoUsers();
        }
    }
    
    private void createDemoUsers() {
        // Create Admin
        User admin = new User();
        admin.setName("Admin User");
        admin.setEmail("admin@localbook.ie");
        admin.setPassword("admin123");  // In production, hash this!
        admin.setPhoneNumber("0851234567");
        admin.setRole(UserRole.ADMIN);
        userRepository.save(admin);
        
        // Create Business Owner
        User owner = new User();
        owner.setName("John Business Owner");
        owner.setEmail("owner@business.ie");
        owner.setPassword("password123");
        owner.setPhoneNumber("0857654321");
        owner.setRole(UserRole.BUSINESS_OWNER);
        userRepository.save(owner);
        
        // Create Client
        User client = new User();
        client.setName("Jane Client");
        client.setEmail("client@email.com");
        client.setPassword("password123");
        client.setPhoneNumber("0859876543");
        client.setRole(UserRole.CLIENT);
        userRepository.save(client);
        
        System.out.println("✅ Demo users created!");
        System.out.println("Admin: admin@localbook.ie / admin123");
        System.out.println("Business Owner: owner@business.ie / password123");
        System.out.println("Client: client@email.com / password123");
    }
}