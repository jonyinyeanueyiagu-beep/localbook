package com.localbook. service;

import org.springframework. stereotype.Service;
import org. springframework.web.client.RestTemplate;
import org.springframework.http.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;

import java.util.*;

@Service
public class SentimentAnalysisService {
    
    // ✅ Your Hugging Face API Key
    private static final String HUGGINGFACE_API_KEY = "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";
    
    // ✅ Updated to use working model
    private static final String HUGGINGFACE_API_URL = 
        "https://api-inference.huggingface.co/models/distilbert/distilbert-base-uncased-finetuned-sst-2-english";
    
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    /**
     * Analyze sentiment of review text using Hugging Face AI
     */
    public SentimentResult analyzeSentiment(String text) {
        System.out.println("🤖 === SENTIMENT ANALYSIS START ===");
        System.out.println("📝 Text to analyze: " + text);
        
        // Validate input
        if (text == null || text.trim().isEmpty()) {
            System.out. println("⚠️ Empty text, returning neutral");
            return new SentimentResult("neutral", 0.5, 0.0);
        }
        
        try {
            // Call Hugging Face API with retry logic
            System.out.println("🌐 Calling Hugging Face API...");
            
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + HUGGINGFACE_API_KEY);
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("x-wait-for-model", "true");  // ✅ Wait for model to load
            
            // Create request body with wait option
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("inputs", text);
            
            Map<String, Object> options = new HashMap<>();
            options. put("wait_for_model", true);
            options.put("use_cache", true);
            requestBody.put("options", options);
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            
            // Make API call
            ResponseEntity<String> response = restTemplate.exchange(
                HUGGINGFACE_API_URL,
                HttpMethod.POST,
                request,
                String. class
            );
            
            System.out.println("✅ API Response received");
            System.out.println("📊 Response: " + response.getBody());
            
            // Parse response - Handle both array and single object formats
            String responseBody = response.getBody();
            
            // Try parsing as array first
            try {
                List<List<Map<String, Object>>> results = objectMapper.readValue(
                    responseBody,
                    new TypeReference<List<List<Map<String, Object>>>>() {}
                );
                
                if (results != null && ! results.isEmpty() && !results. get(0).isEmpty()) {
                    return processLabels(results.get(0));
                }
            } catch (Exception e) {
                // Try parsing as single array
                try {
                    List<Map<String, Object>> results = objectMapper.readValue(
                        responseBody,
                        new TypeReference<List<Map<String, Object>>>() {}
                    );
                    
                    if (results != null && !results.isEmpty()) {
                        return processLabels(results);
                    }
                } catch (Exception e2) {
                    System. err.println("⚠️ Could not parse response format");
                }
            }
            
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            System.err.println("❌ HTTP Error: " + e. getStatusCode() + " - " + e.getMessage());
            System. err.println("Response body: " + e.getResponseBodyAsString());
            
            // Check if it's a 503 (model loading) - retry once after delay
            if (e.getStatusCode(). value() == 503) {
                System.out.println("⏳ Model is loading, waiting 3 seconds...");
                try {
                    Thread.sleep(3000);
                    return analyzeSentiment(text); // Retry once
                } catch (InterruptedException ie) {
                    Thread. currentThread().interrupt();
                }
            }
            
            System.out.println("🔄 Falling back to simple analysis.. .");
            return simpleAnalysis(text);
            
        } catch (Exception e) {
            System.err.println("❌ Error calling Hugging Face API: " + e. getMessage());
            e.printStackTrace();
            System.out.println("🔄 Falling back to simple analysis.. .");
            return simpleAnalysis(text);
        }
        
        System.out.println("⚠️ No valid response, using fallback");
        return simpleAnalysis(text);
    }
    
    /**
     * Process labels from API response
     */
    private SentimentResult processLabels(List<Map<String, Object>> labels) {
        double positiveScore = 0.0;
        double negativeScore = 0.0;
        double neutralScore = 0.0;
        
        // Extract scores for all labels
        for (Map<String, Object> label : labels) {
            String labelName = (String) label.get("label");
            double score = ((Number) label.get("score")). doubleValue();
            
            if (labelName.toUpperCase().contains("POSITIVE") || labelName.toUpperCase().contains("POS")) {
                positiveScore = score;
            } else if (labelName.toUpperCase().contains("NEGATIVE") || labelName. toUpperCase().contains("NEG")) {
                negativeScore = score;
            } else if (labelName.toUpperCase().contains("NEUTRAL")) {
                neutralScore = score;
            }
        }
        
        System.out.println("😊 Positive score: " + positiveScore);
        System.out. println("😞 Negative score: " + negativeScore);
        System.out.println("😐 Neutral score: " + neutralScore);
        
        // Determine sentiment based on highest score
        String sentiment;
        double sentimentScore;
        double confidence;
        
        if (positiveScore >= negativeScore && positiveScore >= neutralScore) {
            sentiment = "positive";
            sentimentScore = positiveScore;
            confidence = positiveScore;
        } else if (negativeScore >= positiveScore && negativeScore >= neutralScore) {
            sentiment = "negative";
            sentimentScore = 1.0 - negativeScore; // Invert for 0-1 scale
            confidence = negativeScore;
        } else {
            sentiment = "neutral";
            sentimentScore = 0.5;
            confidence = neutralScore > 0 ? neutralScore : 0.5;
        }
        
        System.out.println("🎯 Final sentiment: " + sentiment);
        System.out.println("📊 Score: " + sentimentScore);
        System. out.println("🎲 Confidence: " + confidence);
        System.out.println("✅ === SENTIMENT ANALYSIS COMPLETE ===");
        
        return new SentimentResult(sentiment, sentimentScore, confidence);
    }
    
    /**
     * Fallback: Simple keyword-based sentiment analysis
     * Used when AI API fails or is unavailable
     */
    private SentimentResult simpleAnalysis(String text) {
        System.out.println("🔧 Using simple keyword analysis");
        
        String[] positiveWords = {
            "excellent", "amazing", "great", "fantastic", "wonderful",
            "professional", "friendly", "clean", "recommend", "perfect",
            "loved", "best", "awesome", "brilliant", "superb", "outstanding",
            "impressive", "beautiful", "satisfied", "happy", "pleased",
            "good", "nice", "quality", "helpful", "polite", "welcoming",
            "love", "incredible", "exceptional", "fabulous", "terrific"
        };
        
        String[] negativeWords = {
            "terrible", "awful", "worst", "bad", "horrible", "rude",
            "dirty", "unprofessional", "disappointed", "never", "poor",
            "waste", "avoid", "disgusting", "complained", "unhappy",
            "angry", "frustrating", "slow", "late", "overpriced", "expensive",
            "hate", "appalling", "useless", "incompetent", "ridiculous"
        };
        
        String lowerText = text. toLowerCase();
        
        int positiveCount = 0;
        int negativeCount = 0;
        
        // Count positive words
        for (String word : positiveWords) {
            if (lowerText.contains(word)) {
                positiveCount++;
                System.out.println("✅ Found positive: " + word);
            }
        }
        
        // Count negative words
        for (String word : negativeWords) {
            if (lowerText.contains(word)) {
                negativeCount++;
                System.out.println("❌ Found negative: " + word);
            }
        }
        
        int total = positiveCount + negativeCount;
        
        if (total == 0) {
            System.out.println("😐 No sentiment words found, returning neutral");
            return new SentimentResult("neutral", 0.5, 0.0);
        }
        
        double score = (double) positiveCount / total;
        String sentiment;
        
        if (score > 0.6) {
            sentiment = "positive";
        } else if (score < 0.4) {
            sentiment = "negative";
        } else {
            sentiment = "neutral";
        }
        
        double confidence = (double) total / text. split("\\s+").length;
        confidence = Math.min(confidence, 1.0);
        
        System.out. println("🎯 Simple analysis result: " + sentiment);
        System.out.println("📊 Score: " + score);
        System.out.println("🎲 Confidence: " + confidence);
        
        return new SentimentResult(sentiment, score, confidence);
    }
    
    /**
     * Result class to hold sentiment analysis data
     */
    public static class SentimentResult {
        private String sentiment;  // "positive", "negative", "neutral"
        private double score;      // 0.0 to 1.0
        private double confidence; // 0.0 to 1. 0
        
        public SentimentResult(String sentiment, double score, double confidence) {
            this. sentiment = sentiment;
            this. score = score;
            this. confidence = confidence;
        }
        
        public String getSentiment() { return sentiment; }
        public double getScore() { return score; }
        public double getConfidence() { return confidence; }
    }
}