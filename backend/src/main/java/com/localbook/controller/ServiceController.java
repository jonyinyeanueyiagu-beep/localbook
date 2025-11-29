package com.localbook.controller;

import com.localbook.model.Service;
import com.localbook.service.ServiceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@CrossOrigin(origins = "*")
public class ServiceController {
    
    @Autowired
    private ServiceService serviceService;
    
    // Create a new service
   @PostMapping("/api/services")
public ResponseEntity<?> createService(@RequestBody Service service, 
                                      @RequestParam Long businessId) {
    try {
        // Log what we received
        System.out.println("=== CREATE SERVICE REQUEST ===");
        System.out.println("Business ID: " + businessId);
        System.out.println("Service Name: " + service.getServiceName());
        System.out.println("Duration Minutes: " + service.getDurationMinutes());
        System.out.println("Price: " + service.getPrice());
        System.out.println("Description: " + service.getDescription());
        System.out.println("==============================");
        
        Service newService = serviceService.createService(service, businessId);
        return new ResponseEntity<>(newService, HttpStatus.CREATED);
    } catch (IllegalArgumentException e) {
        System.err.println("ERROR: " + e.getMessage());
        e.printStackTrace();
        // Return the actual error message to the frontend
        return ResponseEntity.badRequest().body(e.getMessage());
    } catch (Exception e) {
        System.err.println("UNEXPECTED ERROR: " + e.getMessage());
        e.printStackTrace();
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error: " + e.getMessage());
    }
}
    
    // Get all services
    @GetMapping("/api/services")
    public ResponseEntity<List<Service>> getAllServices() {
        List<Service> services = serviceService.getAllServices();
        return new ResponseEntity<>(services, HttpStatus.OK);
    }
    
    // Get service by ID
    @GetMapping("/api/services/{id}")
    public ResponseEntity<Service> getServiceById(@PathVariable Long id) {
        Optional<Service> service = serviceService.getServiceById(id);
        
        if (service.isPresent()) {
            return new ResponseEntity<>(service.get(), HttpStatus.OK);
        } else {
            return new ResponseEntity<>(null, HttpStatus.NOT_FOUND);
        }
    }
    
    // Get all services for a business - matches frontend expectation
    @GetMapping("/api/businesses/{businessId}/services")
    public ResponseEntity<List<Service>> getServicesByBusinessId(@PathVariable Long businessId) {
        try {
            List<Service> services = serviceService.getServicesByBusiness(businessId);
            return new ResponseEntity<>(services, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    // Alternative endpoint for getting services by business
    @GetMapping("/api/services/business/{businessId}")
    public ResponseEntity<List<Service>> getServicesByBusiness(@PathVariable Long businessId) {
        List<Service> services = serviceService.getServicesByBusiness(businessId);
        return new ResponseEntity<>(services, HttpStatus.OK);
    }
    
    // Search services by name
    @GetMapping("/api/services/search/{keyword}")
    public ResponseEntity<List<Service>> searchServicesByName(@PathVariable String keyword) {
        List<Service> services = serviceService.searchServicesByName(keyword);
        return new ResponseEntity<>(services, HttpStatus.OK);
    }
    
    // Get services by price range
    @GetMapping("/api/services/price-range")
    public ResponseEntity<List<Service>> getServicesByPriceRange(
            @RequestParam Double minPrice, @RequestParam Double maxPrice) {
        List<Service> services = serviceService.getServicesByPriceRange(minPrice, maxPrice);
        return new ResponseEntity<>(services, HttpStatus.OK);
    }
    
    // Get affordable services (under a certain price)
    @GetMapping("/api/services/affordable/{maxPrice}")
    public ResponseEntity<List<Service>> getAffordableServices(@PathVariable Double maxPrice) {
        List<Service> services = serviceService.getAffordableServices(maxPrice);
        return new ResponseEntity<>(services, HttpStatus.OK);
    }
    
    // Update service
    @PutMapping("/api/services/{id}")
    public ResponseEntity<Service> updateService(@PathVariable Long id, 
                                                 @RequestBody Service service,
                                                 @RequestParam Long businessId) {
        try {
            Service updatedService = serviceService.updateService(id, service, businessId);
            return new ResponseEntity<>(updatedService, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(null, HttpStatus.BAD_REQUEST);
        }
    }
    
    // Delete service
    @DeleteMapping("/api/services/{id}")
    public ResponseEntity<String> deleteService(
            @PathVariable Long id, 
            @RequestParam(required = false, defaultValue = "0") Long businessId) {
        try {
            if (businessId == 0) {
                Optional<Service> service = serviceService.getServiceById(id);
                if (service.isPresent()) {
                    businessId = service.get().getBusiness().getId();
                }
            }
            
            serviceService.deleteService(id, businessId);
            return new ResponseEntity<>("Service deleted successfully", HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.FORBIDDEN);
        }
    }
}