package com.localbook.controller;

import com.localbook.model.Appointment;
import com.localbook.model.AppointmentStatus;
import com.localbook.service.AppointmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/api/appointments")
@CrossOrigin(origins = "http://localhost:5173")
public class AppointmentController {
    
    @Autowired
    private AppointmentService appointmentService;
    
    @PostMapping
    public ResponseEntity<Appointment> createAppointment(
            @RequestParam Long userId,
            @RequestParam Long businessId,
            @RequestParam Long serviceId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dateTime,
            @RequestParam(required = false) String notes) {
        try {
            Appointment appointment = appointmentService.createAppointment(
                userId, businessId, serviceId, dateTime, notes);
            return new ResponseEntity<>(appointment, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(null, HttpStatus.BAD_REQUEST);
        }
    }
    
    @GetMapping
    public ResponseEntity<List<Appointment>> getAllAppointments() {
        List<Appointment> appointments = appointmentService.getAllAppointments();
        return new ResponseEntity<>(appointments, HttpStatus.OK);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Appointment> getAppointmentById(@PathVariable Long id) {
        Optional<Appointment> appointment = appointmentService.getAppointmentById(id);
        
        if (appointment.isPresent()) {
            return new ResponseEntity<>(appointment.get(), HttpStatus.OK);
        } else {
            return new ResponseEntity<>(null, HttpStatus.NOT_FOUND);
        }
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Appointment>> getUserAppointments(@PathVariable Long userId) {
        List<Appointment> appointments = appointmentService.getUserAppointments(userId);
        return new ResponseEntity<>(appointments, HttpStatus.OK);
    }
    
    @GetMapping("/user/{userId}/upcoming")
    public ResponseEntity<List<Appointment>> getUpcomingUserAppointments(@PathVariable Long userId) {
        List<Appointment> appointments = appointmentService.getUpcomingUserAppointments(userId);
        return new ResponseEntity<>(appointments, HttpStatus.OK);
    }
@GetMapping("/business/{businessId}/today")
public ResponseEntity<List<Appointment>> getTodayBusinessAppointments(@PathVariable Long businessId) {
    try {
        List<Appointment> appointments = appointmentService.getTodayBusinessAppointments(businessId);
        return new ResponseEntity<>(appointments, HttpStatus.OK);
    } catch (Exception e) {
        System.err.println("❌ Error fetching today's appointments: " + e.getMessage());
        return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
    
    @GetMapping("/user/{userId}/past")
    public ResponseEntity<List<Appointment>> getPastUserAppointments(@PathVariable Long userId) {
        List<Appointment> appointments = appointmentService.getPastUserAppointments(userId);
        return new ResponseEntity<>(appointments, HttpStatus.OK);
    }
    
    @GetMapping("/business/{businessId}")
    public ResponseEntity<List<Appointment>> getBusinessAppointments(@PathVariable Long businessId) {
        List<Appointment> appointments = appointmentService.getBusinessAppointments(businessId);
        return new ResponseEntity<>(appointments, HttpStatus.OK);
    }
    
    @GetMapping("/business/{businessId}/upcoming")
    public ResponseEntity<List<Appointment>> getUpcomingBusinessAppointments(@PathVariable Long businessId) {
        List<Appointment> appointments = appointmentService.getUpcomingBusinessAppointments(businessId);
        return new ResponseEntity<>(appointments, HttpStatus.OK);
    }
    
    @GetMapping("/status/{status}")
    public ResponseEntity<List<Appointment>> getAppointmentsByStatus(@PathVariable AppointmentStatus status) {
        List<Appointment> appointments = appointmentService.getAppointmentsByStatus(status);
        return new ResponseEntity<>(appointments, HttpStatus.OK);
    }
    
    @PutMapping("/{id}/confirm")
    public ResponseEntity<Appointment> confirmAppointment(@PathVariable Long id, 
                                                          @RequestParam Long businessId) {
        try {
            Appointment confirmedAppointment = appointmentService.confirmAppointment(id, businessId);
            return new ResponseEntity<>(confirmedAppointment, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(null, HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/business/{businessId}/booked-slots")
public ResponseEntity<List<String>> getBookedSlots(
        @PathVariable Long businessId,
        @RequestParam String date) {
    try {
        System.out.println("📅 Fetching booked slots for business: " + businessId + " on date: " + date);
        
        // Parse date: YYYY-MM-DD
        LocalDate selectedDate = LocalDate.parse(date, DateTimeFormatter.ISO_DATE);
        
        // Get all appointments for the business on that date
        List<Appointment> appointments = appointmentService.getBusinessAppointments(businessId);
        
        List<String> bookedSlots = new ArrayList<>();
        
        for (Appointment apt : appointments) {
            LocalDate appointmentDate = apt.getAppointmentDateTime().toLocalDate();
            
            // Only include appointments on the selected date that are CONFIRMED
            if (appointmentDate. equals(selectedDate) && apt.getStatus() == AppointmentStatus.CONFIRMED) {
                // Extract time: HH:MM
                String time = apt.getAppointmentDateTime().format(DateTimeFormatter.ofPattern("HH:mm"));
                bookedSlots.add(time);
                
                System.out.println("  ✓ Booked: " + time);
            }
        }
        
        System.out.println("✅ Total booked slots: " + bookedSlots.size());
        
        return ResponseEntity.ok(bookedSlots);
        
    } catch (Exception e) {
        System.err.println("❌ Error fetching booked slots: " + e.getMessage());
        e.printStackTrace();
        return ResponseEntity.ok(new ArrayList<>());
    }
}
    
    // ✅ FIXED: Cancel now uses userId (no changes needed, already correct)
    @PutMapping("/{id}/cancel")
    public ResponseEntity<Appointment> cancelAppointment(@PathVariable Long id, 
                                                         @RequestParam Long userId) {
        try {
            Appointment cancelledAppointment = appointmentService.cancelAppointment(id, userId);
            return new ResponseEntity<>(cancelledAppointment, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(null, HttpStatus.BAD_REQUEST);
        }
    }
    
    // ✅ FIXED: Complete now uses userId instead of businessId
    @PutMapping("/{id}/complete")
    public ResponseEntity<Appointment> completeAppointment(@PathVariable Long id, 
                                                           @RequestParam Long userId) {
        try {
            Appointment completedAppointment = appointmentService.completeAppointment(id, userId);
            return new ResponseEntity<>(completedAppointment, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(null, HttpStatus.BAD_REQUEST);
        }
    }
    
    @PutMapping("/{id}/reschedule")
    public ResponseEntity<Appointment> rescheduleAppointment(
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime newDateTime,
            @RequestParam Long userId) {
        try {
            Appointment rescheduledAppointment = appointmentService.rescheduleAppointment(id, newDateTime, userId);
            return new ResponseEntity<>(rescheduledAppointment, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(null, HttpStatus.BAD_REQUEST);
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteAppointment(@PathVariable Long id, @RequestParam Long userId) {
        try {
            appointmentService.deleteAppointment(id, userId);
            return new ResponseEntity<>("Appointment deleted successfully", HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.FORBIDDEN);
        }
    }
}