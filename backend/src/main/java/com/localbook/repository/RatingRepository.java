package com.localbook.repository;

import com.localbook.model.Appointment;
import com.localbook.model.Business;
import com.localbook.model.Rating;
import com.localbook.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RatingRepository extends JpaRepository<Rating, Long> {
    
    // ✅ Get all ratings for a business (by Business object)
    List<Rating> findByBusinessOrderByCreatedAtDesc(Business business);
    
    // ✅ Get all ratings for a business (by business ID)
    List<Rating> findByBusinessIdOrderByCreatedAtDesc(Long businessId);
    
    // ✅ Get all ratings by a user (by User object)
    List<Rating> findByUserOrderByCreatedAtDesc(User user);
    
    // ✅ Get all ratings by a user (by user ID)
    List<Rating> findByUserIdOrderByCreatedAtDesc(Long userId);
    
    // ✅ Find rating by Appointment object
    Optional<Rating> findByAppointment(Appointment appointment);
    
    // ✅ Check if user rated this appointment (by IDs)
    Optional<Rating> findByUserIdAndAppointmentId(Long userId, Long appointmentId);
    
    // ✅ Check if user already rated this business (by IDs)
    Optional<Rating> findByUserIdAndBusinessId(Long userId, Long businessId);
    
    // ✅ Get average rating for a business
    @Query("SELECT AVG(r.rating) FROM Rating r WHERE r.business.id = :businessId")
    Double getAverageRatingByBusinessId(@Param("businessId") Long businessId);
    
    // ✅ Get rating count for a business
    Long countByBusinessId(Long businessId);
}