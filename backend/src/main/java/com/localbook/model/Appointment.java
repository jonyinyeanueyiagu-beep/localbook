package com.localbook.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.LocalDateTime;

@Entity
@Table(name = "appointments")
public class Appointment {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({"appointments", "reviews", "favorites", "password"})
    private User user;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "business_id", nullable = false)
    @JsonIgnoreProperties({"appointments", "services", "reviews", "favorites", "businessHours", "password"})
    private Business business;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "service_id", nullable = false)
    @JsonIgnoreProperties({"appointments", "business"})
    private Service service;
    
    @Column(name = "appointment_date_time", nullable = false)
    private LocalDateTime appointmentDateTime;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AppointmentStatus status;
    
    @Column(columnDefinition = "TEXT")
    private String notes;

    // ✅ NEW: Track which mobile push notifications have been sent
    @Column(name = "notification_24hr_sent")
    private Boolean notification24hrSent = false;
    
    @Column(name = "notification_30min_sent")
    private Boolean notification30minSent = false;
    
    @Column(name = "notification_start_sent")
    private Boolean notificationStartSent = false;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // Constructors
    public Appointment() {
    }
    
    public Appointment(Long id, User user, Business business, Service service, 
                      LocalDateTime appointmentDateTime, AppointmentStatus status, 
                      String notes, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.user = user;
        this.business = business;
        this.service = service;
        this.appointmentDateTime = appointmentDateTime;
        this.status = status;
        this.notes = notes;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public User getUser() {
        return user;
    }
    
    public void setUser(User user) {
        this.user = user;
    }
    
    public Business getBusiness() {
        return business;
    }
    
    public void setBusiness(Business business) {
        this.business = business;
    }
    
    public Service getService() {
        return service;
    }
    
    public void setService(Service service) {
        this.service = service;
    }
    
    public LocalDateTime getAppointmentDateTime() {
        return appointmentDateTime;
    }
    
    public void setAppointmentDateTime(LocalDateTime appointmentDateTime) {
        this.appointmentDateTime = appointmentDateTime;
    }
    
    public AppointmentStatus getStatus() {
        return status;
    }
    
    public void setStatus(AppointmentStatus status) {
        this.status = status;
    }
    
    public String getNotes() {
        return notes;
    }
    
    public void setNotes(String notes) {
        this.notes = notes;
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



    // ✅ NEW: Notification tracking getters/setters
    public Boolean getNotification24hrSent() {
        return notification24hrSent != null ? notification24hrSent : false;
    }
    
    public void setNotification24hrSent(Boolean notification24hrSent) {
        this.notification24hrSent = notification24hrSent;
    }
    
    public Boolean getNotification30minSent() {
        return notification30minSent != null ? notification30minSent : false;
    }
    
    public void setNotification30minSent(Boolean notification30minSent) {
        this.notification30minSent = notification30minSent;
    }
    
    public Boolean getNotificationStartSent() {
        return notificationStartSent != null ? notificationStartSent : false;
    }
    
    public void setNotificationStartSent(Boolean notificationStartSent) {
        this.notificationStartSent = notificationStartSent;
    }
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = AppointmentStatus.CONFIRMED;
        }
        if (notification24hrSent == null) {
            notification24hrSent = false;
        }
        if (notification30minSent == null) {
            notification30minSent = false;
        }
        if (notificationStartSent == null) {
            notificationStartSent = false;
        }
    }
    

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}