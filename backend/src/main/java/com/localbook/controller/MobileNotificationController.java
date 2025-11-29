package com.localbook.controller;

import com.localbook.model.PushToken;
import com.localbook.model.UserNotificationSettings;
import com.localbook.repository.PushTokenRepository;
import com.localbook.repository.UserNotificationSettingsRepository;
import com.localbook.service.ExpoPushService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/notifications/mobile")
@CrossOrigin(origins = "*")
public class MobileNotificationController {
    
    @Autowired
    private PushTokenRepository pushTokenRepository;
    
    @Autowired
    private UserNotificationSettingsRepository settingsRepository;
    
    @Autowired
    private ExpoPushService expoPushService;
    
    // ========================================
    // REGISTER MOBILE PUSH TOKEN
    // ========================================
    
    @PostMapping("/register-token")
    public ResponseEntity<?> registerMobileToken(@RequestBody Map<String, Object> request) {
        System.out.println("📥 POST /api/notifications/mobile/register-token");
        
        try {
            Long userId = Long.valueOf(request.get("userId").toString());
            String pushToken = request.get("pushToken").toString();
            String platform = request.get("platform").toString();
            String type = request.getOrDefault("type", "expo").toString();
            
            System.out.println("User ID: " + userId);
            System.out.println("Mobile Push Token: " + pushToken);
            System.out.println("Platform: " + platform);
            System.out.println("Type: " + type);
            
            // Check if token already exists for this user
            Optional<PushToken> existing = pushTokenRepository.findByUserId(userId);
            
            if (existing.isPresent()) {
                PushToken tokenEntity = existing.get();
                tokenEntity.setPushToken(pushToken);
                tokenEntity.setPlatform(platform);
                tokenEntity.setType(type);
                pushTokenRepository.save(tokenEntity);
                System.out.println("✅ Mobile push token updated");
            } else {
                PushToken tokenEntity = new PushToken(userId, pushToken, platform, type);
                pushTokenRepository.save(tokenEntity);
                System.out.println("✅ Mobile push token registered");
            }
            
            // Create default notification settings if not exists
            Optional<UserNotificationSettings> settingsOpt = settingsRepository.findByUserId(userId);
            if (settingsOpt.isEmpty()) {
                UserNotificationSettings settings = new UserNotificationSettings(userId);
                settingsRepository.save(settings);
                System.out.println("✅ Default notification settings created");
            }
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Mobile token registered successfully");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("❌ Error registering mobile token: " + e.getMessage());
            e.printStackTrace();
            
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to register mobile token");
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    // ========================================
    // UNREGISTER MOBILE PUSH TOKEN
    // ========================================
    
    @DeleteMapping("/unregister-token/{userId}")
    public ResponseEntity<?> unregisterMobileToken(@PathVariable Long userId) {
        System.out.println("📥 DELETE /api/notifications/mobile/unregister-token/" + userId);
        
        try {
            pushTokenRepository.deleteByUserId(userId);
            System.out.println("✅ Mobile push token unregistered");
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Mobile token unregistered successfully");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("❌ Error unregistering mobile token: " + e.getMessage());
            
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to unregister mobile token");
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    // ========================================
    // GET USER NOTIFICATION SETTINGS
    // ========================================
    
    @GetMapping("/settings/{userId}")
    public ResponseEntity<?> getUserNotificationSettings(@PathVariable Long userId) {
        System.out.println("📥 GET /api/notifications/mobile/settings/" + userId);
        
        try {
            Optional<UserNotificationSettings> settingsOpt = settingsRepository.findByUserId(userId);
            
            if (settingsOpt.isEmpty()) {
                // Create default settings
                UserNotificationSettings settings = new UserNotificationSettings(userId);
                settingsRepository.save(settings);
                return ResponseEntity.ok(settings);
            }
            
            return ResponseEntity.ok(settingsOpt.get());
            
        } catch (Exception e) {
            System.err.println("❌ Error fetching settings: " + e.getMessage());
            
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to fetch settings");
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    // ========================================
    // UPDATE USER NOTIFICATION SETTINGS
    // ========================================
    
    @PutMapping("/settings/{userId}")
    public ResponseEntity<?> updateUserNotificationSettings(
            @PathVariable Long userId,
            @RequestBody UserNotificationSettings newSettings) {
        System.out.println("📥 PUT /api/notifications/mobile/settings/" + userId);
        
        try {
            Optional<UserNotificationSettings> existingOpt = settingsRepository.findByUserId(userId);
            
            UserNotificationSettings settings;
            if (existingOpt.isPresent()) {
                settings = existingOpt.get();
            } else {
                settings = new UserNotificationSettings(userId);
            }
            
            // Update settings
            if (newSettings.getEnable24hrReminder() != null) {
                settings.setEnable24hrReminder(newSettings.getEnable24hrReminder());
            }
            if (newSettings.getEnable30minReminder() != null) {
                settings.setEnable30minReminder(newSettings.getEnable30minReminder());
            }
            if (newSettings.getEnableStartReminder() != null) {
                settings.setEnableStartReminder(newSettings.getEnableStartReminder());
            }
            if (newSettings.getEnableBookingNotifications() != null) {
                settings.setEnableBookingNotifications(newSettings.getEnableBookingNotifications());
            }
            if (newSettings.getEnableCancellationNotifications() != null) {
                settings.setEnableCancellationNotifications(newSettings.getEnableCancellationNotifications());
            }
            if (newSettings.getEnableRescheduleNotifications() != null) {
                settings.setEnableRescheduleNotifications(newSettings.getEnableRescheduleNotifications());
            }
            
            UserNotificationSettings saved = settingsRepository.save(settings);
            System.out.println("✅ Notification settings updated");
            
            return ResponseEntity.ok(saved);
            
        } catch (Exception e) {
            System.err.println("❌ Error updating settings: " + e.getMessage());
            e.printStackTrace();
            
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to update settings");
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    // ========================================
    // SEND TEST NOTIFICATION
    // ========================================
    
    @PostMapping("/send-test")
    public ResponseEntity<?> sendTestNotification(@RequestBody Map<String, Object> request) {
        System.out.println("📥 POST /api/notifications/mobile/send-test");
        
        try {
            Long userId = Long.valueOf(request.get("userId").toString());
            String title = request.getOrDefault("title", "Test Notification").toString();
            String body = request.getOrDefault("body", "This is a test notification from LocalBook! 🎉").toString();
            
            Optional<PushToken> tokenOpt = pushTokenRepository.findByUserId(userId);
            
            if (tokenOpt.isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "No push token found for user");
                return ResponseEntity.badRequest().body(error);
            }
            
            Map<String, Object> data = new HashMap<>();
            data.put("type", "test");
            data.put("timestamp", System.currentTimeMillis());
            
            expoPushService.sendPushNotification(
                tokenOpt.get().getPushToken(),
                title,
                body,
                data
            );
            
            System.out.println("✅ Test notification sent");
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Test notification sent successfully");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("❌ Error sending test notification: " + e.getMessage());
            e.printStackTrace();
            
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to send test notification");
            return ResponseEntity.badRequest().body(error);
        }
    }
}