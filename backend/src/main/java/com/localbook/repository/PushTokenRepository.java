package com.localbook.repository;

import com.localbook.model.PushToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PushTokenRepository extends JpaRepository<PushToken, Long> {
    
    Optional<PushToken> findByUserId(Long userId);
    
    Optional<PushToken> findByPushToken(String pushToken);
    
    List<PushToken> findAllByUserId(Long userId);
    
    void deleteByUserId(Long userId);
}