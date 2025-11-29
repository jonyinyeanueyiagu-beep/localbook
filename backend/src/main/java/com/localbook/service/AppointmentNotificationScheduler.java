package com.localbook.service;

import com.localbook.model.Appointment;
import com.localbook.model.PushToken;
import com.localbook.model.UserNotificationSettings;
import com.localbook.repository.AppointmentRepository;
import com.localbook.repository.PushTokenRepository;
import com.localbook.repository.UserNotificationSettingsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class AppointmentNotificationScheduler {
    
    @Autowired
    private AppointmentRepository appointmentRepository;
    
    @Autowired
    private PushTokenRepository pushTokenRepository;
    
    @Autowired
    private UserNotificationSettingsRepository settingsRepository;
    
    @Autowired
    private ExpoPushService expoPushService;
    
    private final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM dd, yyyy 'at' h:mm a");
    
    // ========================================
    // Run every 5 minutes to check for reminders
    // ========================================
    
    @Scheduled(fixedRate = 300000) // 5 minutes = 300,000 ms
    @Transactional
    public void checkAndSendReminders() {
        System.out.println("⏰ [" + LocalDateTime.now().format(formatter) + "] Checking for appointment reminders...");
        
        send24HourReminders();
        send30MinuteReminders();
        sendStartReminders();
    }
    
    // ========================================
    // 24 HOUR REMINDER
    // ========================================
    
    private void send24HourReminders() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime start = now.plusHours(23).plusMinutes(55); // 23:55 hours from now
        LocalDateTime end = now.plusHours(24).plusMinutes(5);     // 24:05 hours from now
        
        List<Appointment> appointments = appointmentRepository.findAppointmentsNeedingReminder24hr(start, end);
        
        System.out.println("📅 Found " + appointments.size() + " appointments needing 24hr reminder");
        
        for (Appointment appointment : appointments) {
            String dateStr = appointment.getAppointmentDateTime().format(formatter);
            
            sendReminderNotification(
                appointment,
                "Appointment Tomorrow 📅",
                "Your appointment at " + appointment.getBusiness().getBusinessName() + " is tomorrow at " + dateStr,
                "24hr_reminder"
            );
            
            appointment.setNotification24hrSent(true);
            appointmentRepository.save(appointment);
        }
    }
    
    // ========================================
    // 30 MINUTE REMINDER
    // ========================================
    
    private void send30MinuteReminders() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime start = now.plusMinutes(28); // 28 minutes from now
        LocalDateTime end = now.plusMinutes(32);    // 32 minutes from now
        
        List<Appointment> appointments = appointmentRepository.findAppointmentsNeedingReminder30min(start, end);
        
        System.out.println("⏰ Found " + appointments.size() + " appointments needing 30min reminder");
        
        for (Appointment appointment : appointments) {
            sendReminderNotification(
                appointment,
                "Appointment Starting Soon! ⏰",
                "Your appointment at " + appointment.getBusiness().getBusinessName() + " starts in 30 minutes!",
                "30min_reminder"
            );
            
            appointment.setNotification30minSent(true);
            appointmentRepository.save(appointment);
        }
    }
    
    // ========================================
    // START REMINDER (At appointment time)
    // ========================================
    
    private void sendStartReminders() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime start = now.minusMinutes(2); // 2 minutes ago
        LocalDateTime end = now.plusMinutes(2);     // 2 minutes from now
        
        List<Appointment> appointments = appointmentRepository.findAppointmentsNeedingStartReminder(start, end);
        
        System.out.println("🚀 Found " + appointments.size() + " appointments starting now");
        
        for (Appointment appointment : appointments) {
            sendReminderNotification(
                appointment,
                "Appointment Starting Now! 🚀",
                "Your appointment at " + appointment.getBusiness().getBusinessName() + " is starting now!",
                "start_reminder"
            );
            
            appointment.setNotificationStartSent(true);
            appointmentRepository.save(appointment);
        }
    }
    
    // ========================================
    // HELPER: Send reminder to both users
    // ========================================
    
    private void sendReminderNotification(Appointment appointment, String title, String body, String type) {
        Long customerId = appointment.getUser().getId();
        Long businessOwnerId = appointment.getBusiness().getOwner().getId();
        
        // Send to customer
        sendNotificationToUser(customerId, title, body, type, appointment.getId(), "customer");
        
        // Send to business owner
        String businessTitle = title + " - Customer: " + appointment.getUser().getName();
        String businessBody = appointment.getUser().getName() + " has an appointment for " + 
                             appointment.getService().getName();
        sendNotificationToUser(businessOwnerId, businessTitle, businessBody, type, appointment.getId(), "business");
    }
    
    private void sendNotificationToUser(Long userId, String title, String body, String type, Long appointmentId, String userType) {
        // Check user notification settings
        Optional<UserNotificationSettings> settingsOpt = settingsRepository.findByUserId(userId);
        
        boolean shouldSend = true;
        if (settingsOpt.isPresent()) {
            UserNotificationSettings settings = settingsOpt.get();
            
            if (type.equals("24hr_reminder") && !settings.getEnable24hrReminder()) {
                shouldSend = false;
            } else if (type.equals("30min_reminder") && !settings.getEnable30minReminder()) {
                shouldSend = false;
            } else if (type.equals("start_reminder") && !settings.getEnableStartReminder()) {
                shouldSend = false;
            }
        }
        
        if (!shouldSend) {
            System.out.println("⚠️ User " + userId + " has disabled " + type + " notifications");
            return;
        }
        
        // Send mobile push notification
        Optional<PushToken> tokenOpt = pushTokenRepository.findByUserId(userId);
        if (tokenOpt.isPresent()) {
            Map<String, Object> data = new HashMap<>();
            data.put("type", type);
            data.put("appointmentId", appointmentId.toString());
            data.put("userType", userType);
            
            expoPushService.sendPushNotification(
                tokenOpt.get().getPushToken(),
                title,
                body,
                data
            );
            System.out.println("✅ Mobile push sent to user " + userId);
        } else {
            System.out.println("⚠️ No mobile token for user " + userId);
        }
    }
}