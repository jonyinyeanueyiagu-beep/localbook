package com. localbook.service;

import com.ibm.cloud.sdk.core.security.IamAuthenticator;
import com.ibm.watson.natural_language_understanding.v1. NaturalLanguageUnderstanding;
import com.ibm. watson.natural_language_understanding. v1.model. AnalysisResults;
import com.ibm. watson.natural_language_understanding. v1.model. AnalyzeOptions;
import com.ibm. watson.natural_language_understanding. v1.model.DocumentEmotionResults;
import com.ibm. watson.natural_language_understanding. v1.model.DocumentSentimentResults;
import com.ibm.watson.natural_language_understanding.v1.model.EmotionOptions;
import com.ibm. watson.natural_language_understanding. v1.model.EmotionResult;
import com.ibm. watson.natural_language_understanding. v1.model.EmotionScores;
import com.ibm.watson.natural_language_understanding.v1.model.Features;
import com.ibm. watson.natural_language_understanding. v1.model.SentimentOptions;
import com.ibm. watson.natural_language_understanding. v1.model.SentimentResult;

import org.springframework.stereotype.Service;
import jakarta.annotation.PostConstruct;

@Service
public class IBMWatsonSentimentService {
    
    // ✅ REPLACE WITH YOUR REAL IBM WATSON CREDENTIALS
    private static final String IBM_API_KEY = "1CbVZKt_SSGXdvnBxoBrDZwKxJcFk5ZuYGpqMcEROoXB";
    private static final String IBM_SERVICE_URL = "https://api.eu-gb.natural-language-understanding.watson.cloud.ibm.com/instances/b9ccc259-b0b6-4a9b-b31f-7c720549e8e1";
    
    private NaturalLanguageUnderstanding naturalLanguageUnderstanding;
    
    @PostConstruct
    public void init() {
        System.out.println("🤖 Initializing IBM Watson Natural Language Understanding.. .");
        
        try {
            IamAuthenticator authenticator = new IamAuthenticator(IBM_API_KEY);
            naturalLanguageUnderstanding = new NaturalLanguageUnderstanding("2022-04-07", authenticator);
            naturalLanguageUnderstanding.setServiceUrl(IBM_SERVICE_URL);
            
            System.out.println("✅ IBM Watson NLU initialized successfully!");
        } catch (Exception e) {
            System.err.println("❌ Failed to initialize IBM Watson: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    public SentimentAnalysisResult analyzeSentiment(String text) {
        System.out.println("🤖 === IBM WATSON ANALYSIS START ===");
        System.out.println("📝 Text to analyze: " + text);
        
        if (text == null || text.trim().isEmpty()) {
            System. out.println("⚠️ Empty text, returning neutral");
            return new SentimentAnalysisResult("neutral", 0.5, 0.5, null);
        }

                if (text.trim().length() < 10) {
            System.out.println("⚠️ Text too short for Watson analysis (less than 10 chars), returning neutral");
            return new SentimentAnalysisResult("neutral", 0.5, 0.5, null);
        }
        
        try {
            // Configure analysis features
            SentimentOptions sentimentOptions = new SentimentOptions.Builder()
                . build();
            
            EmotionOptions emotionOptions = new EmotionOptions.Builder()
                .build();
            
            Features features = new Features.Builder()
                .sentiment(sentimentOptions)
                . emotion(emotionOptions)
                .build();
            
            // Analyze text
            AnalyzeOptions parameters = new AnalyzeOptions. Builder()
                .text(text)
                .features(features)
                .build();
            
            System.out.println("🌐 Calling IBM Watson API...");
            
            AnalysisResults response = naturalLanguageUnderstanding
                .analyze(parameters)
                .execute()
                .getResult();
            
            System.out.println("✅ IBM Watson API response received");
            
            // Extract sentiment (using Watson's SentimentResult)
            SentimentResult watsonSentimentResult = response.getSentiment();
            DocumentSentimentResults documentSentiment = watsonSentimentResult. getDocument();
            
            String sentimentLabel = documentSentiment.getLabel();
            Double sentimentScore = documentSentiment. getScore();
            
            System.out.println("📊 Sentiment Label: " + sentimentLabel);
            System.out.println("📊 Sentiment Score: " + sentimentScore);
            
            // Extract emotions
            EmotionResult emotionResult = response.getEmotion();
            DocumentEmotionResults documentEmotion = emotionResult.getDocument();
            EmotionScores emotionScores = documentEmotion.getEmotion();
            
            Double joy = emotionScores.getJoy();
            Double sadness = emotionScores.getSadness();
            Double anger = emotionScores.getAnger();
            Double fear = emotionScores.getFear();
            Double disgust = emotionScores.getDisgust();
            
            System.out.println("😊 Joy: " + joy);
            System.out.println("😢 Sadness: " + sadness);
            System.out.println("😠 Anger: " + anger);
            System.out.println("😨 Fear: " + fear);
            System.out.println("🤢 Disgust: " + disgust);
            
            // Convert Watson sentiment to our format
            String sentiment;
            double score;
            
            if ("positive".equalsIgnoreCase(sentimentLabel)) {
                sentiment = "positive";
                score = 0.5 + (sentimentScore / 2.0);
            } else if ("negative".equalsIgnoreCase(sentimentLabel)) {
                sentiment = "negative";
                score = 0.5 + (sentimentScore / 2.0);
            } else {
                sentiment = "neutral";
                score = 0.5;
            }
            
            // Calculate confidence
            double emotionTotal = joy + sadness + anger + fear + disgust;
            double confidence = Math.min(emotionTotal, 1.0);
            
            // Create emotion data
            EmotionData emotions = new EmotionData(joy, sadness, anger, fear, disgust);
            
            System.out.println("🎯 Final sentiment: " + sentiment);
            System.out.println("📊 Score: " + score);
            System.out.println("🎲 Confidence: " + confidence);
            System.out.println("✅ === IBM WATSON ANALYSIS COMPLETE ===");
            
            return new SentimentAnalysisResult(sentiment, score, confidence, emotions);
            
        } catch (Exception e) {
            System.err.println("❌ Error calling IBM Watson: " + e.getMessage());
            e.printStackTrace();
            System.out.println("🔄 Falling back to keyword analysis...");
            return fallbackAnalysis(text);
        }
    }
    
    private SentimentAnalysisResult fallbackAnalysis(String text) {
        System.out.println("🔧 Using keyword fallback");
        
        String lowerText = text.toLowerCase();
        
        if (lowerText.contains("excellent") || lowerText.contains("amazing") || 
            lowerText.contains("great") || lowerText.contains("love") ||
            lowerText.contains("wonderful") || lowerText.contains("fantastic")) {
            return new SentimentAnalysisResult("positive", 0.8, 0.6, null);
        } else if (lowerText.contains("terrible") || lowerText.contains("awful") || 
                   lowerText.contains("bad") || lowerText.contains("hate") ||
                   lowerText. contains("worst") || lowerText.contains("horrible")) {
            return new SentimentAnalysisResult("negative", 0.2, 0.6, null);
        } else {
            return new SentimentAnalysisResult("neutral", 0.5, 0.5, null);
        }
    }
    
    // ✅ RENAMED: SentimentResult → SentimentAnalysisResult
    public static class SentimentAnalysisResult {
        private String sentiment;
        private double score;
        private double confidence;
        private EmotionData emotions;
        
        public SentimentAnalysisResult(String sentiment, double score, double confidence, EmotionData emotions) {
            this.sentiment = sentiment;
            this.score = score;
            this.confidence = confidence;
            this.emotions = emotions;
        }
        
        public String getSentiment() { return sentiment; }
        public double getScore() { return score; }
        public double getConfidence() { return confidence; }
        public EmotionData getEmotions() { return emotions; }
    }
    
    public static class EmotionData {
        private double joy;
        private double sadness;
        private double anger;
        private double fear;
        private double disgust;
        
        public EmotionData(double joy, double sadness, double anger, double fear, double disgust) {
            this.joy = joy;
            this.sadness = sadness;
            this.anger = anger;
            this.fear = fear;
            this.disgust = disgust;
        }
        
        public double getJoy() { return joy; }
        public double getSadness() { return sadness; }
        public double getAnger() { return anger; }
        public double getFear() { return fear; }
        public double getDisgust() { return disgust; }
    }
}