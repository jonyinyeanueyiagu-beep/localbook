package com.localbook.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_notification_settings")
public class UserNotificationSettings {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;
    
    @Column(name = "enable_24hr_reminder")
    private Boolean enable24hrReminder = true;
    
    @Column(name = "enable_30min_reminder")
    private Boolean enable30minReminder = true;
    
    @Column(name = "enable_start_reminder")
    private Boolean enableStartReminder = true;
    
    @Column(name = "enable_booking_notifications")
    private Boolean enableBookingNotifications = true;
    
    @Column(name = "enable_cancellation_notifications")
    private Boolean enableCancellationNotifications = true;
    
    @Column(name = "enable_reschedule_notifications")
    private Boolean enableRescheduleNotifications = true;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // Constructors
    public UserNotificationSettings() {
    }
    
    public UserNotificationSettings(Long userId) {
        this.userId = userId;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Long getUserId() {
        return userId;
    }
    
    public void setUserId(Long userId) {
        this.userId = userId;
    }
    
    public Boolean getEnable24hrReminder() {
        return enable24hrReminder;
    }
    
    public void setEnable24hrReminder(Boolean enable24hrReminder) {
        this.enable24hrReminder = enable24hrReminder;
    }
    
    public Boolean getEnable30minReminder() {
        return enable30minReminder;
    }
    
    public void setEnable30minReminder(Boolean enable30minReminder) {
        this.enable30minReminder = enable30minReminder;
    }
    
    public Boolean getEnableStartReminder() {
        return enableStartReminder;
    }
    
    public void setEnableStartReminder(Boolean enableStartReminder) {
        this.enableStartReminder = enableStartReminder;
    }
    
    public Boolean getEnableBookingNotifications() {
        return enableBookingNotifications;
    }
    
    public void setEnableBookingNotifications(Boolean enableBookingNotifications) {
        this.enableBookingNotifications = enableBookingNotifications;
    }
    
    public Boolean getEnableCancellationNotifications() {
        return enableCancellationNotifications;
    }
    
    public void setEnableCancellationNotifications(Boolean enableCancellationNotifications) {
        this.enableCancellationNotifications = enableCancellationNotifications;
    }
    
    public Boolean getEnableRescheduleNotifications() {
        return enableRescheduleNotifications;
    }
    
    public void setEnableRescheduleNotifications(Boolean enableRescheduleNotifications) {
        this.enableRescheduleNotifications = enableRescheduleNotifications;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}