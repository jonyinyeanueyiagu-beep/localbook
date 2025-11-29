package com.localbook.service;

import com.localbook.model.Service;
import com.localbook.model.Business;
import com.localbook.repository.ServiceRepository;
import com.localbook.repository.BusinessRepository;
import org.springframework.beans.factory.annotation.Autowired;
import java.util.List;
import java.util.Optional;

@org.springframework.stereotype.Service
public class ServiceService {
    
    @Autowired
    private ServiceRepository serviceRepository;
    
    @Autowired
    private BusinessRepository businessRepository;
    
    // Create a new service for a business
    public Service createService(Service service, Long businessId) {
        // Verify the business exists
        Optional<Business> business = businessRepository.findById(businessId);
        
        if (business.isEmpty()) {
            throw new IllegalArgumentException("Business not found with ID: " + businessId);
        }
        
        // Check if service name already exists for this business
        if (serviceRepository.existsByServiceNameAndBusiness_Id(
                service.getServiceName(), businessId)) {
            throw new IllegalArgumentException(
                "Service with this name already exists for this business.");
        }
        
        // Link the service to the business
        service.setBusiness(business.get());
        
        return serviceRepository.save(service);
    }
    
    // Get all services
    public List<Service> getAllServices() {
        return serviceRepository.findAll();
    }
    
    // Get service by ID
    public Optional<Service> getServiceById(Long id) {
        return serviceRepository.findById(id);
    }
    
    // Get all services offered by a specific business
    public List<Service> getServicesByBusiness(Long businessId) {
        return serviceRepository.findByBusiness_Id(businessId);
    }
    
    // Search services by name
    public List<Service> searchServicesByName(String keyword) {
        return serviceRepository.findByServiceNameContainingIgnoreCase(keyword);
    }
    
    // Find services by price range
    public List<Service> getServicesByPriceRange(Double minPrice, Double maxPrice) {
        return serviceRepository.findByPriceBetween(minPrice, maxPrice);
    }
    
    // Find affordable services (under a certain price)
    public List<Service> getAffordableServices(Double maxPrice) {
        return serviceRepository.findByPriceLessThan(maxPrice);
    }
    
    // Update service (Business owner only)
    public Service updateService(Long id, Service updatedService, Long businessId) {
        Optional<Service> existing = serviceRepository.findById(id);
        
        if (existing.isEmpty()) {
            throw new IllegalArgumentException("Service not found with ID: " + id);
        }
        
        Service service = existing.get();
        
        // Verify the service belongs to the business
        if (!service.getBusiness().getId().equals(businessId)) {
            throw new IllegalArgumentException(
                "You can only update services for your own business.");
        }
        
        // Update fields
        service.setServiceName(updatedService.getServiceName());
        service.setDurationMinutes(updatedService.getDurationMinutes());
        service.setPrice(updatedService.getPrice());
        service.setDescription(updatedService.getDescription());
        
        return serviceRepository.save(service);
    }
    
    // Delete service (Business owner only)
    public void deleteService(Long id, Long businessId) {
        Optional<Service> service = serviceRepository.findById(id);
        
        if (service.isEmpty()) {
            throw new IllegalArgumentException("Service not found with ID: " + id);
        }
        
        // Verify the service belongs to the business
        if (!service.get().getBusiness().getId().equals(businessId)) {
            throw new IllegalArgumentException(
                "You can only delete services for your own business.");
        }
        
        serviceRepository.deleteById(id);
    }
}