package com.localbook.service;
import com.localbook.model.BusinessHours;
import com.localbook.repository.BusinessHoursRepository;
import org.springframework.beans.factory.annotation.Autowired;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;
import java.util.List;  
import java.time.LocalTime;
@Service
public class BusinessHoursService {
    
    @Autowired
    private BusinessHoursRepository businessHoursRepository;
    
    /**
     * Get all business hours for a specific business
     */
    public List<BusinessHours> getBusinessHours(Long businessId) {
        return businessHoursRepository.findByBusinessId(businessId);
    }
    
    /**
     * Get hours for a specific day
     */
    public BusinessHours getHoursForDay(Long businessId, BusinessHours.DayOfWeek dayOfWeek) {
        return businessHoursRepository.findByBusinessIdAndDayOfWeek(businessId, dayOfWeek);
    }
    
    /**
     * Create or update business hours for a specific day
     */
    public BusinessHours saveBusinessHours(BusinessHours businessHours) {
        return businessHoursRepository.save(businessHours);
    }
    
    /**
     * Create default business hours (9am-5pm, Mon-Fri) for a new business
     */
    @Transactional
    public void createDefaultHours(Long businessId) {
        BusinessHours.DayOfWeek[] allDays = BusinessHours.DayOfWeek.values();
        
        for (BusinessHours.DayOfWeek day : allDays) {
            BusinessHours hours = new BusinessHours();
            hours.setBusinessId(businessId);
            hours.setDayOfWeek(day);
            
            // Monday to Friday: Open 9am-5pm
            if (day != BusinessHours.DayOfWeek.SATURDAY && day != BusinessHours.DayOfWeek.SUNDAY) {
                hours.setIsOpen(true);
                hours.setOpenTime(LocalTime.of(9, 0));
                hours.setCloseTime(LocalTime.of(17, 0));
            } else {
                // Saturday & Sunday: Closed by default
                hours.setIsOpen(false);
            }
            
            businessHoursRepository.save(hours);
        }
    }
    
    /**
     * Update business hours for multiple days at once
     */
    @Transactional
    public List<BusinessHours> updateMultipleHours(List<BusinessHours> hoursList) {
        return businessHoursRepository.saveAll(hoursList);
    }
    
    /**
     * Delete all hours for a business (when business is deleted)
     */
    @Transactional
    public void deleteBusinessHours(Long businessId) {
        businessHoursRepository.deleteByBusinessId(businessId);
    }
    
    /**
     * Check if business has set their hours
     */
    public boolean hasSetHours(Long businessId) {
        return businessHoursRepository.existsByBusinessId(businessId);
    }
}