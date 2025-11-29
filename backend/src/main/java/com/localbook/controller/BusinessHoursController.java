package com.localbook.controller;
import com. localbook.model.BusinessHours;
import com.localbook.service.BusinessHoursService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/business-hours")
@CrossOrigin(origins = "*")
public class BusinessHoursController {
    
    @Autowired
    private BusinessHoursService businessHoursService;
    
    /**
     * GET /api/business-hours/{businessId}
     * Get all business hours for a specific business
     */
    @GetMapping("/{businessId}")
    public ResponseEntity<List<BusinessHours>> getBusinessHours(@PathVariable Long businessId) {
        List<BusinessHours> hours = businessHoursService.getBusinessHours(businessId);
        return ResponseEntity.ok(hours);
    }
    
    /**
     * GET /api/business-hours/{businessId}/{day}
     * Get hours for a specific day
     */
    @GetMapping("/{businessId}/{day}")
    public ResponseEntity<BusinessHours> getHoursForDay(
            @PathVariable Long businessId,
            @PathVariable String day) {
        
        BusinessHours.DayOfWeek dayOfWeek = BusinessHours.DayOfWeek.valueOf(day.toUpperCase());
        BusinessHours hours = businessHoursService.getHoursForDay(businessId, dayOfWeek);
        
        if (hours != null) {
            return ResponseEntity.ok(hours);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * POST /api/business-hours
     * Create or update business hours for a specific day
     */
    @PostMapping
    public ResponseEntity<BusinessHours> saveBusinessHours(@RequestBody BusinessHours businessHours) {
        BusinessHours saved = businessHoursService.saveBusinessHours(businessHours);
        return ResponseEntity.ok(saved);
    }
    
    /**
     * POST /api/business-hours/{businessId}/default
     * Create default hours for a new business
     */
    @PostMapping("/{businessId}/default")
    public ResponseEntity<String> createDefaultHours(@PathVariable Long businessId) {
        businessHoursService.createDefaultHours(businessId);
        return ResponseEntity.ok("Default hours created successfully");
    }
    
    /**
     * PUT /api/business-hours/bulk
     * Update multiple days at once
     */
    @PutMapping("/bulk")
    public ResponseEntity<List<BusinessHours>> updateMultipleHours(@RequestBody List<BusinessHours> hoursList) {
        List<BusinessHours> updated = businessHoursService.updateMultipleHours(hoursList);
        return ResponseEntity.ok(updated);
    }
    
    /**
     * DELETE /api/business-hours/{businessId}
     * Delete all hours for a business
     */
    @DeleteMapping("/{businessId}")
    public ResponseEntity<String> deleteBusinessHours(@PathVariable Long businessId) {
        businessHoursService.deleteBusinessHours(businessId);
        return ResponseEntity.ok("Business hours deleted successfully");
    }
}
