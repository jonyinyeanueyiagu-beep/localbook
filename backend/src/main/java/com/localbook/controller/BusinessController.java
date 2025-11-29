package com.localbook.controller;

import com.localbook.model.Appointment;
import com.localbook.model.AppointmentStatus;
import com.localbook.model.Business;
import com.localbook.service.AppointmentService;
import com.localbook.service.BusinessService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/businesses")
@CrossOrigin(origins = "*")
public class BusinessController {
    
    @Autowired
    private BusinessService businessService;
    
    @Autowired
    private AppointmentService appointmentService;
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    @GetMapping("/{businessId}/dashboard")
    public ResponseEntity<?> getBusinessDashboard(@PathVariable Long businessId) {
        try {
            System.out.println("=== Dashboard requested for business: " + businessId);
            
            Optional<Business> businessOpt = businessService.getBusinessById(businessId);
            if (!businessOpt.isPresent()) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Business not found with ID: " + businessId);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
            }
            
            LocalDateTime now = LocalDateTime.now();
            LocalDate today = LocalDate.now();
            
            LocalDateTime startOfToday = today.atStartOfDay();
            LocalDateTime endOfToday = today.atTime(23, 59, 59);
            
            LocalDate startOfWeekDate = today.with(DayOfWeek.MONDAY);
            LocalDateTime startOfWeek = startOfWeekDate.atStartOfDay();
            
            LocalDate startOfMonthDate = today.withDayOfMonth(1);
            LocalDateTime startOfMonth = startOfMonthDate.atStartOfDay();
            
            List<Appointment> allAppointments = appointmentService.getBusinessAppointments(businessId);
            
            long todayAppointments = 0;
            long weekAppointments = 0;
            double monthRevenue = 0.0;
            
            for (Appointment apt : allAppointments) {
                LocalDateTime aptDateTime = apt.getAppointmentDateTime();
                
                if (aptDateTime.isAfter(startOfToday.minusSeconds(1)) && aptDateTime.isBefore(endOfToday.plusSeconds(1))) {
                    todayAppointments++;
                }
                
                if (aptDateTime.isAfter(startOfWeek.minusSeconds(1)) && aptDateTime.isBefore(now.plusDays(1))) {
                    weekAppointments++;
                }
                
                if (aptDateTime.isAfter(startOfMonth.minusSeconds(1)) && 
                    aptDateTime.isBefore(now.plusDays(1)) && 
                    apt.getStatus() == AppointmentStatus.COMPLETED) {
                    double price = apt.getService() != null ? apt.getService().getPrice() : 0.0;
                    monthRevenue = monthRevenue + price;
                }
            }
            
            long totalCustomers = allAppointments.stream()
                .filter(apt -> apt.getUser() != null)
                .map(apt -> apt.getUser().getId())
                .distinct()
                .count();
            
            List<Appointment> todaySchedule = allAppointments.stream()
                .filter(apt -> {
                    LocalDateTime aptDateTime = apt.getAppointmentDateTime();
                    return aptDateTime.isAfter(startOfToday.minusSeconds(1)) && 
                           aptDateTime.isBefore(endOfToday.plusSeconds(1));
                })
                .sorted((a1, a2) -> a1.getAppointmentDateTime().compareTo(a2.getAppointmentDateTime()))
                .collect(Collectors.toList());
            
            Map<String, Object> response = new HashMap<>();
            
            Map<String, Object> stats = new HashMap<>();
            stats.put("todayAppointments", todayAppointments);
            stats.put("weekAppointments", weekAppointments);
            stats.put("monthRevenue", monthRevenue);
            stats.put("totalCustomers", totalCustomers);
            
            response.put("stats", stats);
            response.put("todaySchedule", todaySchedule);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", "Error loading dashboard: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    @PostMapping("/register")
    public ResponseEntity<Business> registerBusiness(@RequestBody Business business, 
                                                     @RequestParam Long ownerId) {
        try {
            Business newBusiness = businessService.registerBusiness(business, ownerId);
            return new ResponseEntity<>(newBusiness, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(null, HttpStatus.BAD_REQUEST);
        }
    }
    
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllBusinesses() {
        try {
            List<Business> businesses = businessService.getAllBusinesses();
            List<Map<String, Object>> response = businesses.stream()
                .map(this::buildBusinessResponse)
                .collect(Collectors.toList());
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    @GetMapping("/approved")
    public ResponseEntity<List<Map<String, Object>>> getApprovedBusinesses() {
        try {
            List<Business> businesses = businessService.getApprovedBusinesses();
            List<Map<String, Object>> response = businesses.stream()
                .map(this::buildBusinessResponse)
                .collect(Collectors.toList());
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    @GetMapping("/unapproved")
    public ResponseEntity<List<Map<String, Object>>> getUnapprovedBusinesses() {
        try {
            List<Business> businesses = businessService.getUnapprovedBusinesses();
            List<Map<String, Object>> response = businesses.stream()
                .map(this::buildBusinessResponse)
                .collect(Collectors.toList());
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<?> getBusinessById(@PathVariable Long id) {
        try {
            System.out.println("📥 GET request for business ID: " + id);
            
            Optional<Business> businessOpt = businessService.getBusinessById(id);
            
            if (!businessOpt.isPresent()) {
                System.out.println("❌ Business not found with ID: " + id);
                return new ResponseEntity<>(null, HttpStatus.NOT_FOUND);
            }
            
            Business business = businessOpt.get();
            System.out.println("✅ Business found: " + business.getBusinessName());
            
            Map<String, Object> response = buildBusinessResponse(business);
            
            System.out.println("✅ Response built with opening hours");
            return new ResponseEntity<>(response, HttpStatus.OK);
            
        } catch (Exception e) {
            System.err.println("❌ Error getting business: " + e.getMessage());
            e.printStackTrace();
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    @GetMapping("/search/location/{location}")
    public ResponseEntity<List<Map<String, Object>>> searchByLocation(@PathVariable String location) {
        try {
            List<Business> businesses = businessService.searchByLocation(location);
            List<Map<String, Object>> response = businesses.stream()
                .map(this::buildBusinessResponse)
                .collect(Collectors.toList());
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    @GetMapping("/search/category/{category}")
    public ResponseEntity<List<Map<String, Object>>> searchByCategory(@PathVariable String category) {
        try {
            List<Business> businesses = businessService.searchByCategory(category);
            List<Map<String, Object>> response = businesses.stream()
                .map(this::buildBusinessResponse)
                .collect(Collectors.toList());
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    @GetMapping("/search")
    public ResponseEntity<List<Map<String, Object>>> searchByLocationAndCategory(
            @RequestParam String location, @RequestParam String category) {
        try {
            List<Business> businesses = businessService.searchByLocationAndCategory(location, category);
            List<Map<String, Object>> response = businesses.stream()
                .map(this::buildBusinessResponse)
                .collect(Collectors.toList());
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    @GetMapping("/search/name/{keyword}")
    public ResponseEntity<List<Map<String, Object>>> searchByName(@PathVariable String keyword) {
        try {
            List<Business> businesses = businessService.searchByName(keyword);
            List<Map<String, Object>> response = businesses.stream()
                .map(this::buildBusinessResponse)
                .collect(Collectors.toList());
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<List<Map<String, Object>>> getBusinessesByOwner(@PathVariable Long ownerId) {
        try {
            List<Business> businesses = businessService.getBusinessesByOwner(ownerId);
            List<Map<String, Object>> response = businesses.stream()
                .map(this::buildBusinessResponse)
                .collect(Collectors.toList());
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<?> updateBusiness(
            @PathVariable Long id,
            @RequestBody Map<String, Object> updates,
            @RequestParam Long ownerId) {
        
        try {
            System.out.println("📝 Updating business ID: " + id);
            
            Optional<Business> businessOpt = businessService.getBusinessById(id);
            if (!businessOpt.isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Business not found"));
            }
            
            Business business = businessOpt.get();
            
            if (!business.getOwner().getId().equals(ownerId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Unauthorized"));
            }
            
            if (updates.containsKey("businessName")) {
                business.setBusinessName((String) updates.get("businessName"));
            }
            if (updates.containsKey("ownerName")) {
                business.setOwnerName((String) updates.get("ownerName"));
            }
            if (updates.containsKey("description")) {
                business.setDescription((String) updates.get("description"));
            }
            if (updates.containsKey("category")) {
                business.setCategory((String) updates.get("category"));
            }
            if (updates.containsKey("location")) {
                business.setLocation((String) updates.get("location"));
            }
            if (updates.containsKey("address")) {
                business.setAddress((String) updates.get("address"));
            }
            if (updates.containsKey("town")) {
                business.setTown((String) updates.get("town"));
            }
            if (updates.containsKey("county")) {
                business.setCounty((String) updates.get("county"));
            }
            if (updates.containsKey("eircode")) {
                business.setEircode((String) updates.get("eircode"));
            }
            if (updates.containsKey("phoneNumber")) {
                business.setPhoneNumber((String) updates.get("phoneNumber"));
            }
            if (updates.containsKey("email")) {
                business.setEmail((String) updates.get("email"));
            }
            
            if (updates.containsKey("openingHours")) {
                String hours = (String) updates.get("openingHours");
                System.out.println("🕐 Setting opening hours: " + hours);
                business.setOpeningHours(hours);
            }
            
            if (updates.containsKey("operatingHours")) {
                String hours = (String) updates.get("operatingHours");
                System.out.println("🕐 Setting operating hours: " + hours);
                business.setOpeningHours(hours);
            }
            
            business.setUpdatedAt(LocalDateTime.now());
            Business updated = businessService.saveBusinessDirect(business);
            
            System.out.println("✅ Business updated successfully");
            
            Map<String, Object> response = buildBusinessResponse(updated);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("❌ Error updating business: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }
    
    @PutMapping("/{id}/approve")
    public ResponseEntity<?> approveBusiness(@PathVariable Long id) {
        try {
            Business approvedBusiness = businessService.approveBusiness(id);
            Map<String, Object> response = buildBusinessResponse(approvedBusiness);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(null, HttpStatus.NOT_FOUND);
        }
    }
             @PutMapping("/{id}/suspend")
public ResponseEntity<?> suspendBusiness(
        @PathVariable Long id,
        @RequestBody Map<String, Object> payload) {
    try {
        System.out.println("🚫 Suspending business ID: " + id);
        
        String reason = "Violation of terms";
        if (payload != null && payload.containsKey("reason")) {
            reason = (String) payload.get("reason");
        }
        
        int days = 30;
        if (payload != null && payload.containsKey("days")) {
            Object daysObj = payload.get("days");
            if (daysObj instanceof Integer) {
                days = (Integer) daysObj;
            } else if (daysObj instanceof String) {
                days = Integer.parseInt((String) daysObj);
            }
        }
        
        Optional<Business> businessOpt = businessService.getBusinessById(id);
        if (!businessOpt.isPresent()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", "Business not found"));
        }
        
        Business business = businessOpt.get();
        business.setStatus("SUSPENDED");
        business.setUpdatedAt(LocalDateTime.now());
        
        Business suspended = businessService.saveBusinessDirect(business);
        
        System.out.println("✅ Business suspended: " + business.getBusinessName());
        System.out.println("Reason: " + reason);
        System.out.println("Days: " + days);
        
        Map<String, Object> response = buildBusinessResponse(suspended);
        return ResponseEntity.ok(response);
        
    } catch (Exception e) {
        System.err.println("❌ Error suspending business: " + e.getMessage());
        e.printStackTrace();
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(Map.of("error", e.getMessage()));
    }
}
    @PutMapping("/{id}/reject")
    public ResponseEntity<?> rejectBusiness(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> payload) {
        try {
            String reason = "Did not meet requirements";
            if (payload != null && payload.containsKey("reason")) {
                reason = payload.get("reason");
            }
            
            Business rejectedBusiness = businessService.rejectBusiness(id, reason);
            Map<String, Object> response = buildBusinessResponse(rejectedBusiness);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }
    
    @DeleteMapping("/{id}")
public ResponseEntity<?> deleteBusiness(
        @PathVariable Long id,
        @RequestParam(required = false) Long userId) {
    try {
        System.out.println("🗑️ Deleting business ID: " + id);
        
        Optional<Business> businessOpt = businessService.getBusinessById(id);
        if (!businessOpt.isPresent()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", "Business not found"));
        }
        
        Business business = businessOpt.get();
        String businessName = business.getBusinessName();
        
        // Admin can delete any business
        if (userId != null) {
            businessService.deleteBusiness(id, userId);
        } else {
            // Direct delete for admin
            businessService.deleteBusinessDirect(id);
        }
        
        System.out.println("✅ Business deleted: " + businessName);
        
        return ResponseEntity.ok(Map.of(
            "message", "Business deleted successfully",
            "businessName", businessName
        ));
        
    } catch (Exception e) {
        System.err.println("❌ Error deleting business: " + e.getMessage());
        e.printStackTrace();
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(Map.of("error", e.getMessage()));
    }
}

    @GetMapping("/owner/{ownerId}/status")
    public ResponseEntity<?> getBusinessStatusByOwner(@PathVariable Long ownerId) {
        try {
            System.out.println("=== GET BUSINESS STATUS ===");
            System.out.println("Owner ID: " + ownerId);
            
            List<Business> businesses = businessService.getBusinessesByOwner(ownerId);
            
            if (businesses.isEmpty()) {
                Map<String, Object> response = new HashMap<>();
                response.put("hasBusinesses", false);
                response.put("isApproved", false);
                response.put("status", "NO_BUSINESS");
                response.put("message", "No business registered");
                return ResponseEntity.ok(response);
            }
            
            Business business = businesses.get(0);
            
            Map<String, Object> response = new HashMap<>();
            response.put("hasBusinesses", true);
            response.put("businessId", business.getId());
            response.put("businessName", business.getBusinessName());
            response.put("isApproved", business.isApproved());
            
            if (business.isApproved()) {
                response.put("status", "APPROVED");
                response.put("message", "Your business is approved and active");
            } else {
                response.put("status", "PENDING");
                response.put("message", "Your business is pending approval");
            }
            
            System.out.println("Business status: " + response.get("status"));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("Error getting business status: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error: " + e.getMessage());
        }
    }
    
    // ⭐ HELPER METHOD: Build business response with opening hours
    private Map<String, Object> buildBusinessResponse(Business business) {
        Map<String, Object> response = new HashMap<>();
        
        response.put("id", business.getId());
        response.put("businessName", business.getBusinessName());
        response.put("ownerName", business.getOwnerName());
        response.put("address", business.getAddress());
        response.put("town", business.getTown());
        response.put("county", business.getCounty());
        response.put("eircode", business.getEircode());
        response.put("location", business.getLocation());
        response.put("category", business.getCategory());
        response.put("phoneNumber", business.getPhoneNumber());
        response.put("email", business.getEmail());
        response.put("isApproved", business.getIsApproved());
        response.put("approved", business.getIsApproved());
        response.put("description", business.getDescription());
        response.put("lat", business.getLat());
        response.put("lng", business.getLng());
        response.put("status", business.getStatus());
        response.put("createdAt", business.getCreatedAt());
        response.put("updatedAt", business.getUpdatedAt());
        
        Map<String, Map<String, Object>> openingHours = parseOpeningHours(business.getOpeningHours());
        response.put("openingHours", openingHours);
        
        return response;
    }
    
    // ⭐ HELPER METHOD: Parse opening hours with normalization
    private Map<String, Map<String, Object>> parseOpeningHours(String openingHoursJson) {
        if (openingHoursJson == null || openingHoursJson.trim().isEmpty()) {
            return createDefaultOpeningHours();
        }
        
        try {
            Map<String, Object> rawMap = objectMapper.readValue(openingHoursJson, Map.class);
            Map<String, Map<String, Object>> openingHours = new HashMap<>();
            
            for (Map.Entry<String, Object> entry : rawMap.entrySet()) {
                String day = entry.getKey();
                Object value = entry.getValue();
                
                if (value instanceof Map) {
                    Map<String, Object> dayHours = (Map<String, Object>) value;
                    Map<String, Object> normalizedHours = new HashMap<>();
                    
                    // Normalize field names
                    if (dayHours.containsKey("open")) {
                        normalizedHours.put("openTime", dayHours.get("open"));
                    } else if (dayHours.containsKey("openTime")) {
                        normalizedHours.put("openTime", dayHours.get("openTime"));
                    }
                    
                    if (dayHours.containsKey("close")) {
                        normalizedHours.put("closeTime", dayHours.get("close"));
                    } else if (dayHours.containsKey("closeTime")) {
                        normalizedHours.put("closeTime", dayHours.get("closeTime"));
                    }
                    
                    if (dayHours.containsKey("enabled")) {
                        Boolean enabled = (Boolean) dayHours.get("enabled");
                        normalizedHours.put("isClosed", !enabled);
                    } else if (dayHours.containsKey("isClosed")) {
                        normalizedHours.put("isClosed", dayHours.get("isClosed"));
                    }
                    
                    openingHours.put(day, normalizedHours);
                }
            }
            
            return openingHours;
            
        } catch (Exception e) {
            System.out.println("⚠️ Failed to parse opening hours, using defaults");
            return createDefaultOpeningHours();
        }
    }
    
    // ⭐ HELPER METHOD: Create default opening hours
    private Map<String, Map<String, Object>> createDefaultOpeningHours() {
        Map<String, Map<String, Object>> hours = new HashMap<>();
        
        String[] weekdays = {"monday", "tuesday", "wednesday", "thursday", "friday"};
        for (String day : weekdays) {
            Map<String, Object> dayHours = new HashMap<>();
            dayHours.put("openTime", "09:00");
            dayHours.put("closeTime", "18:00");
            dayHours.put("isClosed", false);
            hours.put(day, dayHours);
        }
        
        Map<String, Object> saturdayHours = new HashMap<>();
        saturdayHours.put("openTime", "10:00");
        saturdayHours.put("closeTime", "16:00");
        saturdayHours.put("isClosed", false);
        hours.put("saturday", saturdayHours);
        
        Map<String, Object> sundayHours = new HashMap<>();
        sundayHours.put("isClosed", true);
        hours.put("sunday", sundayHours);
        
        return hours;
    }
}