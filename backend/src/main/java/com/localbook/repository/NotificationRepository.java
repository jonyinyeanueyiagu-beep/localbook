package com.localbook.repository;

import com.localbook.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    // Get ALL notifications for a user (newest first)
    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);
    
    // Get only UNREAD notifications
    List<Notification> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(Long userId);
    
    // Get only READ notifications
    List<Notification> findByUserIdAndIsReadTrueOrderByCreatedAtDesc(Long userId);
    
    // Count unread notifications
    long countByUserIdAndIsReadFalse(Long userId);
    
    // For mark all as read functionality
    List<Notification> findByUserIdAndIsReadFalse(Long userId);
}