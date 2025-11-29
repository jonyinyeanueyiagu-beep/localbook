package com.localbook.repository;

import com.localbook.model.Appointment;
import com.localbook.model.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    
    List<Appointment> findByUserId(Long userId);
    
    List<Appointment> findByBusinessId(Long businessId);
    
    List<Appointment> findByStatus(AppointmentStatus status);
    
    List<Appointment> findByUserIdAndStatus(Long userId, AppointmentStatus status);
    
    List<Appointment> findByBusinessIdAndStatus(Long businessId, AppointmentStatus status);
    
    List<Appointment> findByUserIdAndAppointmentDateTimeAfterOrderByAppointmentDateTimeAsc(
        Long userId, LocalDateTime dateTime);
    
    List<Appointment> findByUserIdAndAppointmentDateTimeBeforeOrderByAppointmentDateTimeDesc(
        Long userId, LocalDateTime dateTime);
    
    List<Appointment> findByBusinessIdAndAppointmentDateTimeAfterOrderByAppointmentDateTimeAsc(
        Long businessId, LocalDateTime dateTime);
    
    List<Appointment> findByBusinessIdAndAppointmentDateTimeBeforeOrderByAppointmentDateTimeDesc(
        Long businessId, LocalDateTime dateTime);
    
    List<Appointment> findByAppointmentDateTimeBetween(LocalDateTime start, LocalDateTime end);
    
    List<Appointment> findByBusinessIdAndAppointmentDateTimeBetween(
        Long businessId, LocalDateTime start, LocalDateTime end);
    @Query("SELECT a FROM Appointment a WHERE a.status = 'CONFIRMED' " +
           "AND a.notification24hrSent = false " +
           "AND a.appointmentDateTime BETWEEN :start AND :end")
    List<Appointment> findAppointmentsNeedingReminder24hr(
        @Param("start") LocalDateTime start,
        @Param("end") LocalDateTime end
    );
    
    @Query("SELECT a FROM Appointment a WHERE a.status = 'CONFIRMED' " +
           "AND a.notification30minSent = false " +
           "AND a.appointmentDateTime BETWEEN :start AND :end")
    List<Appointment> findAppointmentsNeedingReminder30min(
        @Param("start") LocalDateTime start,
        @Param("end") LocalDateTime end
    );
    
    @Query("SELECT a FROM Appointment a WHERE a.status = 'CONFIRMED' " +
           "AND a.notificationStartSent = false " +
           "AND a.appointmentDateTime BETWEEN :start AND :end")
    List<Appointment> findAppointmentsNeedingStartReminder(
        @Param("start") LocalDateTime start,
        @Param("end") LocalDateTime end
    );    




}