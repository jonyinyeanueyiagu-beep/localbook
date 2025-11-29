package com.localbook.repository;

import com.localbook.model.Business;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BusinessRepository extends JpaRepository<Business, Long> {
    
    List<Business> findByIsApproved(boolean isApproved);
    
    List<Business> findByLocationContainingIgnoreCase(String location);
    
    List<Business> findByCategory(String category);
    
    List<Business> findByLocationContainingIgnoreCaseAndCategory(String location, String category);
    
    List<Business> findByBusinessNameContainingIgnoreCase(String keyword);

       Long countByCategory(String category);

    
    List<Business> findByOwner_Id(Long ownerId);
}