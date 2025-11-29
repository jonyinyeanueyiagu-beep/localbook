package com.localbook.service;

import com.localbook.model.Appointment;
import com.localbook.model.AppointmentStatus;
import com.localbook.model.Business;
import com.localbook.model.User;
import com.localbook.model.Service;
import com.localbook.model.PushToken;
import com.localbook.model.UserNotificationSettings;
import com.localbook.repository.AppointmentRepository;
import com.localbook.repository.BusinessRepository;
import com.localbook.repository.UserRepository;
import com.localbook.repository.ServiceRepository;
import com.localbook.repository.PushTokenRepository;
import com.localbook.repository.UserNotificationSettingsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@org.springframework.stereotype.Service
public class AppointmentService {
    
    @Autowired
    private AppointmentRepository appointmentRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private BusinessRepository businessRepository;
    
    @Autowired
    private ServiceRepository serviceRepository;
    
    @Autowired
    private PushTokenRepository pushTokenRepository;
    
    @Autowired
    private UserNotificationSettingsRepository settingsRepository;
    
    @Autowired
    private ExpoPushService expoPushService;
    
    private final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM dd, yyyy 'at' h:mm a");
    
    // ========================================
    // CREATE APPOINTMENT with notifications
    // ========================================
    
    @Transactional
    public Appointment createAppointment(Long userId, Long businessId, Long serviceId, 
                                        LocalDateTime appointmentDateTime, String notes) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));
        
        Business business = businessRepository.findById(businessId)
            .orElseThrow(() -> new IllegalArgumentException("Business not found with ID: " + businessId));
        
        Service service = serviceRepository.findById(serviceId)
            .orElseThrow(() -> new IllegalArgumentException("Service not found with ID: " + serviceId));
        
        if (appointmentDateTime.isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Cannot book appointment in the past");
        }
        
        Appointment appointment = new Appointment();
        appointment.setUser(user);
        appointment.setBusiness(business);
        appointment.setService(service);
        appointment.setAppointmentDateTime(appointmentDateTime);
        appointment.setNotes(notes);
        appointment.setStatus(AppointmentStatus.CONFIRMED);
        appointment.setCreatedAt(LocalDateTime.now());
        appointment.setUpdatedAt(LocalDateTime.now());
        
        Appointment saved = appointmentRepository.save(appointment);
        
        // ✅ Send notifications
        Long customerId = saved.getUser().getId();
        Long businessOwnerId = saved.getBusiness().getOwner().getId();
        
        String appointmentDetails = saved.getService().getName() + " on " + 
                                   saved.getAppointmentDateTime().format(formatter);
        
        // Send "New Booking" notification to BUSINESS OWNER
        sendNotificationIfEnabled(
            businessOwnerId,
            "New Booking! 🎉",
            saved.getUser().getName() + " booked " + appointmentDetails,
            "new_booking",
            saved.getId(),
            "enableBookingNotifications"
        );
        
        // Send "Booking Confirmation" to CUSTOMER
        sendNotificationIfEnabled(
            customerId,
            "Booking Confirmed! ✅",
            "Your appointment for " + appointmentDetails + " at " + saved.getBusiness().getBusinessName() + " is confirmed!",
            "booking_confirmation",
            saved.getId(),
            "enableBookingNotifications"
        );
        
        System.out.println("✅ Appointment created with notifications sent");
        return saved;
    }
    
    // ✅ YOUR EXISTING METHODS (keep all of these)
    
    public List<Appointment> getAllAppointments() {
        return appointmentRepository.findAll();
    }
    
    public Optional<Appointment> getAppointmentById(Long id) {
        return appointmentRepository.findById(id);
    }
    
    public List<Appointment> getUserAppointments(Long userId) {
        return appointmentRepository.findByUserId(userId);
    }
    
    public List<Appointment> getUpcomingUserAppointments(Long userId) {
        LocalDateTime now = LocalDateTime.now();
        return appointmentRepository.findByUserIdAndAppointmentDateTimeAfterOrderByAppointmentDateTimeAsc(userId, now);
    }
    
    public List<Appointment> getPastUserAppointments(Long userId) {
        LocalDateTime now = LocalDateTime.now();
        return appointmentRepository.findByUserIdAndAppointmentDateTimeBeforeOrderByAppointmentDateTimeDesc(userId, now);
    }
    
    public List<Appointment> getBusinessAppointments(Long businessId) {
        return appointmentRepository.findByBusinessId(businessId);
    }
    
    public List<Appointment> getTodayBusinessAppointments(Long businessId) {
    System.out.println("=== FETCHING TODAY'S APPOINTMENTS ===");
    System.out.println("Business ID: " + businessId);
    
    LocalDate today = LocalDate.now();
    System.out.println("Today's date: " + today);
    
    List<Appointment> allAppointments = appointmentRepository.findAll();
    System.out.println("Total appointments in DB: " + allAppointments.size());
    
    List<Appointment> todayActiveAppointments = allAppointments.stream()
        .filter(apt -> {
            boolean isThisBusiness = apt.getBusiness().getId().equals(businessId);
            boolean isToday = apt.getAppointmentDateTime().toLocalDate().equals(today);
            boolean isNotCanceled = apt.getStatus() != AppointmentStatus.CANCELED;
            boolean isNotCompleted = apt.getStatus() != AppointmentStatus.COMPLETED;
            
            if (isThisBusiness && isToday) {
                System.out.println("Appointment " + apt.getId() + ": Status=" + apt.getStatus() + 
                                 ", Include=" + (isNotCanceled && isNotCompleted));
            }
            
            return isThisBusiness && isToday && isNotCanceled && isNotCompleted;
        })
        .collect(Collectors.toList());
    
    System.out.println("✅ Today's active appointments: " + todayActiveAppointments.size());
    
    return todayActiveAppointments;
}
    
    public List<Appointment> getUpcomingBusinessAppointments(Long businessId) {
        LocalDateTime now = LocalDateTime.now();
        return appointmentRepository.findByBusinessIdAndAppointmentDateTimeAfterOrderByAppointmentDateTimeAsc(businessId, now);
    }
    
    public List<Appointment> getAppointmentsByStatus(AppointmentStatus status) {
        return appointmentRepository.findByStatus(status);
    }
    
    @Transactional
    public Appointment confirmAppointment(Long appointmentId, Long businessId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> new IllegalArgumentException("Appointment not found with ID: " + appointmentId));
        
        if (!appointment.getBusiness().getId().equals(businessId)) {
            throw new IllegalArgumentException("Unauthorized: You can only confirm appointments for your business");
        }
        
        appointment.setStatus(AppointmentStatus.CONFIRMED);
        appointment.setUpdatedAt(LocalDateTime.now());
        
        return appointmentRepository.save(appointment);
    }
    
    // ========================================
    // CANCEL APPOINTMENT with notifications
    // ========================================
    
    @Transactional
    public Appointment cancelAppointment(Long appointmentId, Long userId) {
        System.out.println("=== CANCEL APPOINTMENT ===");
        System.out.println("Appointment ID: " + appointmentId);
        System.out.println("User ID: " + userId);
        
        Appointment appointment = appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> new IllegalArgumentException("Appointment not found with ID: " + appointmentId));
        
        boolean isUser = appointment.getUser().getId().equals(userId);
        boolean isBusinessOwner = appointment.getBusiness().getOwner().getId().equals(userId);
        
        System.out.println("Is client? " + isUser);
        System.out.println("Is business owner? " + isBusinessOwner);
        
        if (!isUser && !isBusinessOwner) {
            throw new IllegalArgumentException("Unauthorized: You can only cancel your own appointments");
        }
        
        appointment.setStatus(AppointmentStatus.CANCELED);
        appointment.setUpdatedAt(LocalDateTime.now());
        
        Appointment saved = appointmentRepository.save(appointment);
        
        // ✅ Send cancellation notifications to BOTH
        Long customerId = saved.getUser().getId();
        Long businessOwnerId = saved.getBusiness().getOwner().getId();
        
        String appointmentDetails = saved.getService().getName() + " on " + 
                                   saved.getAppointmentDateTime().format(formatter);
        
        sendNotificationIfEnabled(
            customerId,
            "Appointment Cancelled ❌",
            "Your appointment for " + appointmentDetails + " has been cancelled",
            "cancelled",
            saved.getId(),
            "enableCancellationNotifications"
        );
        
        sendNotificationIfEnabled(
            businessOwnerId,
            "Appointment Cancelled ❌",
            "Appointment with " + saved.getUser().getName() + " for " + appointmentDetails + " has been cancelled",
            "cancelled",
            saved.getId(),
            "enableCancellationNotifications"
        );
        
        System.out.println("✅ Appointment cancelled with notifications sent");
        return saved;
    }
    
    @Transactional
    public Appointment completeAppointment(Long appointmentId, Long userId) {
        System.out.println("=== COMPLETE APPOINTMENT ===");
        System.out.println("Appointment ID: " + appointmentId);
        System.out.println("User ID: " + userId);
        
        Appointment appointment = appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> new IllegalArgumentException("Appointment not found with ID: " + appointmentId));
        
        System.out.println("Appointment Business Owner ID: " + appointment.getBusiness().getOwner().getId());
        System.out.println("Match? " + appointment.getBusiness().getOwner().getId().equals(userId));
        
        if (!appointment.getBusiness().getOwner().getId().equals(userId)) {
            throw new IllegalArgumentException("Unauthorized: You can only complete appointments for your business");
        }
        
        if (appointment.getAppointmentDateTime().isAfter(LocalDateTime.now())) {
            throw new IllegalArgumentException("Cannot complete a future appointment");
        }
        
        appointment.setStatus(AppointmentStatus.COMPLETED);
        appointment.setUpdatedAt(LocalDateTime.now());
        
        System.out.println("✅ Appointment completed successfully");
        
        return appointmentRepository.save(appointment);
    }
    
    // ========================================
    // RESCHEDULE APPOINTMENT with notifications
    // ========================================
    
    @Transactional
    public Appointment rescheduleAppointment(Long appointmentId, LocalDateTime newDateTime, Long userId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> new IllegalArgumentException("Appointment not found with ID: " + appointmentId));
        
        boolean isUser = appointment.getUser().getId().equals(userId);
        boolean isBusinessOwner = appointment.getBusiness().getOwner().getId().equals(userId);
        
        if (!isUser) {
            throw new IllegalArgumentException("Unauthorized: Only customers can reschedule appointments");
        }
        
        if (newDateTime.isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Cannot reschedule appointment to a past date/time");
        }
        
        if (appointment.getStatus() == AppointmentStatus.CANCELED) {
            throw new IllegalArgumentException("Cannot reschedule a cancelled appointment");
        }
        
        if (appointment.getStatus() == AppointmentStatus.COMPLETED) {
            throw new IllegalArgumentException("Cannot reschedule a completed appointment");
        }
        
        LocalDateTime oldDateTime = appointment.getAppointmentDateTime();
        appointment.setAppointmentDateTime(newDateTime);
        appointment.setStatus(AppointmentStatus.CONFIRMED);
        appointment.setUpdatedAt(LocalDateTime.now());
        
        // Reset notification flags
        appointment.setNotification24hrSent(false);
        appointment.setNotification30minSent(false);
        appointment.setNotificationStartSent(false);
        
        Appointment saved = appointmentRepository.save(appointment);
        
        // ✅ Send reschedule notifications to BOTH
        Long customerId = saved.getUser().getId();
        Long businessOwnerId = saved.getBusiness().getOwner().getId();
        
        String message = saved.getService().getName() + " rescheduled from " + 
                        oldDateTime.format(formatter) + " to " + newDateTime.format(formatter);
        
        sendNotificationIfEnabled(
            customerId,
            "Appointment Rescheduled 🔄",
            message,
            "rescheduled",
            saved.getId(),
            "enableRescheduleNotifications"
        );
        
        sendNotificationIfEnabled(
            businessOwnerId,
            "Appointment Rescheduled 🔄",
            saved.getUser().getName() + "'s appointment: " + message,
            "rescheduled",
            saved.getId(),
            "enableRescheduleNotifications"
        );
        
        System.out.println("✅ Appointment rescheduled with notifications sent");
        return saved;
    }
    
    @Transactional
    public void deleteAppointment(Long appointmentId, Long userId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> new IllegalArgumentException("Appointment not found with ID: " + appointmentId));
        
        boolean isUser = appointment.getUser().getId().equals(userId);
        boolean isBusinessOwner = appointment.getBusiness().getOwner().getId().equals(userId);
        
        if (!isUser && !isBusinessOwner) {
            throw new IllegalArgumentException("Unauthorized: You can only delete your own appointments");
        }
        
        appointmentRepository.delete(appointment);
    }
    
    // ========================================
    // HELPER: Send notification with settings check
    // ========================================
    
    private void sendNotificationIfEnabled(Long userId, String title, String body, String type, Long appointmentId, String settingField) {
        // Check user notification settings
        Optional<UserNotificationSettings> settingsOpt = settingsRepository.findByUserId(userId);
        
        boolean shouldSend = true;
        if (settingsOpt.isPresent()) {
            UserNotificationSettings settings = settingsOpt.get();
            
            try {
                String methodName = "get" + settingField.substring(0, 1).toUpperCase() + settingField.substring(1);
                Boolean enabled = (Boolean) settings.getClass().getMethod(methodName).invoke(settings);
                
                if (enabled != null && !enabled) {
                    shouldSend = false;
                }
            } catch (Exception e) {
                // If setting not found, send anyway
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