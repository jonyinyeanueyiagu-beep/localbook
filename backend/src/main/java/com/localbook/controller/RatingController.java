package com.localbook.controller;

import com.localbook.model.Rating;
import com.localbook.model.User;
import com.localbook. service.RatingService;
import com.localbook.service.UserService;
import org.springframework. beans.factory.annotation.Autowired;
import org.springframework. http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web. bind.annotation.*;

import java. util.HashMap;
import java. util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/ratings")
@CrossOrigin(origins = "*")
public class RatingController {
    
    @Autowired
    private RatingService ratingService;
    
    @Autowired
    private UserService userService;
    
    @PostMapping
    public ResponseEntity<? > createRating(
            @RequestParam Long userId,
            @RequestParam Long businessId,
            @RequestParam Long appointmentId,
            @RequestParam Integer rating,
            @RequestParam(required = false) String review) {
        
        try {
            System.out.println("=== CREATE RATING REQUEST ===");
            System.out.println("User ID: " + userId);
            System.out. println("Business ID: " + businessId);
            System.out. println("Appointment ID: " + appointmentId);
            System. out.println("Rating: " + rating);
            System.out. println("Review: " + review);
            
            final boolean isValidRating = rating >= 1 && rating <= 5;
            if (isValidRating == false) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Rating must be between 1 and 5");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }
            
            final Rating newRating = ratingService.createRating(
                userId,
                businessId,
                appointmentId,
                rating,
                review
            );
            
            System.out.println("✅ Rating created successfully with ID: " + newRating. getId());
            System.out.println("🤖 Sentiment: " + newRating.getSentiment());
            System.out.println("📊 Sentiment Score: " + newRating.getSentimentScore());
            System.out.println("📊 Confidence: " + newRating.getSentimentConfidence());
            
            // ✅ BUILD RESPONSE WITH SENTIMENT DATA
            Map<String, Object> response = new HashMap<>();
            response.put("id", newRating.getId());
            response.put("userId", newRating.getUser().getId());
            response. put("businessId", newRating.getBusiness().getId());
            response. put("appointmentId", newRating.getAppointment().getId());
            response.put("rating", newRating.getRating());
            response.put("review", newRating.getReview());
            response.put("sentiment", newRating.getSentiment());
            response.put("sentimentScore", newRating.getSentimentScore());
            response.put("sentimentConfidence", newRating.getSentimentConfidence());
            response.put("emotionJoy", newRating.getEmotionJoy());
            response. put("emotionSadness", newRating.getEmotionSadness());
            response.put("emotionAnger", newRating.getEmotionAnger());
            response. put("emotionFear", newRating.getEmotionFear());
            response.put("emotionDisgust", newRating.getEmotionDisgust());
            response.put("createdAt", newRating.getCreatedAt());
            
            return ResponseEntity.status(HttpStatus. CREATED).body(response);
            
        } catch (IllegalArgumentException e) {
            System.err.println("❌ Validation error: " + e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", e. getMessage());
            return ResponseEntity. status(HttpStatus.BAD_REQUEST).body(error);
            
        } catch (Exception e) {
            System.err.println("❌ Error creating rating: " + e.getMessage());
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error. put("error", "Failed to create rating: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR). body(error);
        }
    }
    
    @GetMapping("/business/{businessId}")
    public ResponseEntity<List<Rating>> getBusinessRatings(@PathVariable Long businessId) {
        try {
            System.out.println("📊 Fetching ratings for business ID: " + businessId);
            
            final List<Rating> ratings = ratingService.getBusinessRatings(businessId);
            final int ratingsCount = ratings.size();
            
            System.out.println("✅ Found " + ratingsCount + " ratings");
            
            return ResponseEntity.ok(ratings);
            
        } catch (Exception e) {
            System.err. println("❌ Error fetching ratings: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus. INTERNAL_SERVER_ERROR).body(null);
        }
    }
    
    @GetMapping("/business/{businessId}/summary")
    public ResponseEntity<? > getBusinessRatingSummary(@PathVariable Long businessId) {
        try {
            System.out.println("📊 Fetching rating summary for business ID: " + businessId);
            
            final List<Rating> ratings = ratingService.getBusinessRatings(businessId);
            final int totalRatings = ratings.size();
            
            System.out.println("📝 Total ratings found: " + totalRatings);
            
            // ✅ If NO ratings, return proper response
            if (totalRatings == 0) {
                Map<String, Object> summary = new HashMap<>();
                summary. put("averageRating", 0.0);
                summary.put("totalRatings", 0);
                
                System.out.println("⚠️ No ratings found - returning zeros");
                return ResponseEntity.ok(summary);
            }
            
            // ✅ Calculate REAL average
            double totalScore = 0.0;
            int ratingIndex = 0;
            
            while (ratingIndex < totalRatings) {
                final Rating currentRating = ratings.get(ratingIndex);
                final Integer ratingValue = currentRating.getRating();
                final double ratingDouble = ratingValue.doubleValue();
                totalScore = totalScore + ratingDouble;
                
                System.out.println("Rating " + (ratingIndex + 1) + ": " + ratingValue + " stars");
                
                ratingIndex = ratingIndex + 1;
            }
            
            final double averageRating = totalScore / totalRatings;
            final double roundedAverage = Math.round(averageRating * 10.0) / 10.0;
            
            System.out. println("📊 Total score: " + totalScore);
            System.out.println("📊 Average: " + averageRating);
            System.out.println("📊 Rounded average: " + roundedAverage);
            
            Map<String, Object> summary = new HashMap<>();
            summary.put("averageRating", roundedAverage);
            summary.put("totalRatings", totalRatings);
            
            System.out.println("✅ Returning summary: " + summary);
            
            return ResponseEntity.ok(summary);
            
        } catch (Exception e) {
            System.err.println("❌ Error calculating rating summary: " + e.getMessage());
            e.printStackTrace();
            
            Map<String, Object> summary = new HashMap<>();
            summary. put("averageRating", 0.0);
            summary.put("totalRatings", 0);
            
            return ResponseEntity.ok(summary);
        }
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Rating>> getUserRatings(@PathVariable Long userId) {
        try {
            System.out.println("👤 Fetching ratings by user ID: " + userId);
            
            final Optional<User> userOpt = userService.getUserById(userId);
            
            if (userOpt.isPresent() == false) {
                System.err.println("❌ User not found with ID: " + userId);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
            }
            
            final User user = userOpt.get();
            final List<Rating> ratings = ratingService.getUserRatings(user);
            final int ratingsCount = ratings.size();
            
            System.out.println("✅ Found " + ratingsCount + " ratings by user");
            
            return ResponseEntity.ok(ratings);
            
        } catch (Exception e) {
            System.err.println("❌ Error fetching user ratings: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR). body(null);
        }
    }
    
    @GetMapping("/appointment/{appointmentId}")
    public ResponseEntity<? > getRatingByAppointment(@PathVariable Long appointmentId) {
        try {
            System.out.println("🔍 Checking rating for appointment ID: " + appointmentId);
            
            final Optional<Rating> ratingOpt = ratingService.getRatingByAppointment(appointmentId);
            
            if (ratingOpt. isPresent() == true) {
                final Rating rating = ratingOpt.get();
                System.out.println("✅ Rating found for appointment");
                
                // ✅ BUILD RESPONSE WITH ALL DATA
                Map<String, Object> response = new HashMap<>();
                response.put("id", rating.getId());
                response.put("userId", rating.getUser().getId());
                response.put("businessId", rating.getBusiness().getId());
                response.put("appointmentId", rating.getAppointment().getId());
                response.put("rating", rating.getRating());
                response.put("review", rating.getReview());
                response.put("sentiment", rating. getSentiment());
                response. put("sentimentScore", rating. getSentimentScore());
                response.put("sentimentConfidence", rating.getSentimentConfidence());
                response.put("emotionJoy", rating.getEmotionJoy());
                response. put("emotionSadness", rating.getEmotionSadness());
                response.put("emotionAnger", rating.getEmotionAnger());
                response.put("emotionFear", rating.getEmotionFear());
                response.put("emotionDisgust", rating. getEmotionDisgust());
                response.put("createdAt", rating.getCreatedAt());
                
                return ResponseEntity.ok(response);
            } else {
                System.out. println("⚠️ No rating found for this appointment");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
            }
            
        } catch (Exception e) {
            System.err.println("❌ Error fetching appointment rating: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR). body(null);
        }
    }
    
    @DeleteMapping("/{ratingId}")
    public ResponseEntity<?> deleteRating(
            @PathVariable Long ratingId,
            @RequestParam Long userId) {
        
        try {
            System.out.println("🗑️ Delete request for rating ID: " + ratingId + " by user: " + userId);
            
            ratingService.deleteRating(ratingId, userId);
            
            System.out.println("✅ Rating deleted successfully");
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Rating deleted successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException e) {
            System.err.println("❌ Delete error: " + e.getMessage());
            Map<String, String> error = new HashMap<>();
            error. put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus. FORBIDDEN).body(error);
            
        } catch (Exception e) {
            System.err.println("❌ Error deleting rating: " + e. getMessage());
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to delete rating");
            return ResponseEntity.status(HttpStatus. INTERNAL_SERVER_ERROR).body(error);
        }
    }
}