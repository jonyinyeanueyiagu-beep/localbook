package com.localbook.repository;
import com.localbook.model.BusinessHours;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BusinessHoursRepository extends JpaRepository<BusinessHours, Long> {
    
    /**
     * Find all business hours for a specific business
     * @param businessId the business ID
     * @return list of business hours for all days of the week
     */
    List<BusinessHours> findByBusinessId(Long businessId);
    
    /**
     * Find business hours for a specific business and day
     * @param businessId the business ID
     * @param dayOfWeek the day of the week
     * @return business hours for that specific day
     */
    BusinessHours findByBusinessIdAndDayOfWeek(Long businessId, BusinessHours.DayOfWeek dayOfWeek);
    
    /**
     * Delete all business hours for a specific business
     * @param businessId the business ID
     */
    void deleteByBusinessId(Long businessId);
    
    /**
     * Check if business hours exist for a specific business
     * @param businessId the business ID
     * @return true if hours exist, false otherwise
     */
    boolean existsByBusinessId(Long businessId);
}