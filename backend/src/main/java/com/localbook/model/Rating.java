package com.localbook.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ratings")
public class Rating {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @ManyToOne
    @JoinColumn(name = "business_id", nullable = false)
    private Business business;
    
    @ManyToOne
    @JoinColumn(name = "appointment_id")
    private Appointment appointment;
    
    @Column(nullable = false)
    private Integer rating; // 1-5 stars
    
    @Column(length = 500)
    private String review;

        // ✅ AI Sentiment Analysis Fields
    @Column(name = "sentiment")
    private String sentiment; // "positive", "negative", "neutral"

    @Column(name = "sentiment_score")
    private Double sentimentScore; // 0.0 to 1.0

    @Column(name = "sentiment_confidence")
    private Double sentimentConfidence; // How confident AI is

            // ✅ NEW: IBM Watson Emotion Fields
    @Column(name = "emotion_joy")
    private Double emotionJoy;

    @Column(name = "emotion_sadness")
    private Double emotionSadness;

    @Column(name = "emotion_anger")
    private Double emotionAnger;

    @Column(name = "emotion_fear")
    private Double emotionFear;

    @Column(name = "emotion_disgust")
    private Double emotionDisgust;

    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    // Constructors
    public Rating() {
        this.createdAt = LocalDateTime.now();
    }
    
    public Rating(User user, Business business, Appointment appointment, Integer rating, String review) {
        this.user = user;
        this.business = business;
        this.appointment = appointment;
        this.rating = rating;
        this.review = review;
        this.createdAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    
    public Business getBusiness() { return business; }
    public void setBusiness(Business business) { this.business = business; }
    
    public Appointment getAppointment() { return appointment; }
    public void setAppointment(Appointment appointment) { this.appointment = appointment; }
    
    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }

        // ✅ NEW: Emotion Getters and Setters
    public Double getEmotionJoy() { return emotionJoy; }
    public void setEmotionJoy(Double emotionJoy) { this. emotionJoy = emotionJoy; }

    public Double getEmotionSadness() { return emotionSadness; }
    public void setEmotionSadness(Double emotionSadness) { this.emotionSadness = emotionSadness; }

    public Double getEmotionAnger() { return emotionAnger; }
    public void setEmotionAnger(Double emotionAnger) { this.emotionAnger = emotionAnger; }

    public Double getEmotionFear() { return emotionFear; }
    public void setEmotionFear(Double emotionFear) { this.emotionFear = emotionFear; }

    public Double getEmotionDisgust() { return emotionDisgust; }
    public void setEmotionDisgust(Double emotionDisgust) { this.emotionDisgust = emotionDisgust; }
        
    public String getReview() { return review; }
    public void setReview(String review) { this.review = review; }

    public String getSentiment() {
    return sentiment;
 }

        public void setSentiment(String sentiment) {
            this.sentiment = sentiment;
        }

        public Double getSentimentScore() {
            return sentimentScore;
        }

        public void setSentimentScore(Double sentimentScore) {
            this. sentimentScore = sentimentScore;
        }

        public Double getSentimentConfidence() {
            return sentimentConfidence;
        }

        public void setSentimentConfidence(Double sentimentConfidence) {
            this.sentimentConfidence = sentimentConfidence;
        }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}