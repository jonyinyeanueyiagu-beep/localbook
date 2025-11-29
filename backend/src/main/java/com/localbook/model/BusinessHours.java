package com.localbook.model;
import jakarta.persistence.*;
import java.time.LocalTime;
import java.util.Objects;

@Entity
@Table(name = "business_hours")
public class BusinessHours {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "business_id")
    private Long businessId;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "day_of_week", nullable = false)
    private DayOfWeek dayOfWeek;
    
    @Column(name = "is_open")
    private Boolean isOpen = true;
    
    @Column(name = "open_time")
    private LocalTime openTime;
    
    @Column(name = "close_time")
    private LocalTime closeTime;
    
    // Constructors
    public BusinessHours() {
    }
    
    public BusinessHours(Long businessId, DayOfWeek dayOfWeek, Boolean isOpen, LocalTime openTime, LocalTime closeTime) {
        this.businessId = businessId;
        this.dayOfWeek = dayOfWeek;
        this.isOpen = isOpen;
        this.openTime = openTime;
        this.closeTime = closeTime;
    }
    
    // Getters
    public Long getId() {
        return id;
    }
    
    public Long getBusinessId() {
        return businessId;
    }
    
    public DayOfWeek getDayOfWeek() {
        return dayOfWeek;
    }
    
    public Boolean getIsOpen() {
        return isOpen;
    }
    
    public LocalTime getOpenTime() {
        return openTime;
    }
    
    public LocalTime getCloseTime() {
        return closeTime;
    }
    
    // Setters
    public void setId(Long id) {
        this.id = id;
    }
    
    public void setBusinessId(Long businessId) {
        this.businessId = businessId;
    }
    
    public void setDayOfWeek(DayOfWeek dayOfWeek) {
        this.dayOfWeek = dayOfWeek;
    }
    
    public void setIsOpen(Boolean isOpen) {
        this.isOpen = isOpen;
    }
    
    public void setOpenTime(LocalTime openTime) {
        this.openTime = openTime;
    }
    
    public void setCloseTime(LocalTime closeTime) {
        this.closeTime = closeTime;
    }
    
    // toString
    @Override
    public String toString() {
        return "BusinessHours{" +
                "id=" + id +
                ", businessId=" + businessId +
                ", dayOfWeek=" + dayOfWeek +
                ", isOpen=" + isOpen +
                ", openTime=" + openTime +
                ", closeTime=" + closeTime +
                '}';
    }
    
    // equals and hashCode
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        BusinessHours that = (BusinessHours) o;
        return Objects.equals(id, that.id) &&
               Objects.equals(businessId, that.businessId) &&
               dayOfWeek == that.dayOfWeek &&
               Objects.equals(isOpen, that.isOpen) &&
               Objects.equals(openTime, that.openTime) &&
               Objects.equals(closeTime, that.closeTime);
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(id, businessId, dayOfWeek, isOpen, openTime, closeTime);
    }
    
    // Enum
    public enum DayOfWeek {
        MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY
    }
}