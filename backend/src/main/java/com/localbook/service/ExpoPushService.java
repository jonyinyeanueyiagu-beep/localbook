package com.localbook.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.util.HashMap;
import java.util.Map;
import java.util.List;

@Service
public class ExpoPushService {
    
    private static final String EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
    
    public void sendPushNotification(String expoPushToken, String title, String body, Map<String, Object> data) {
        try {
            System.out.println("📤 Sending Expo push notification to: " + expoPushToken);
            
            RestTemplate restTemplate = new RestTemplate();
            
            Map<String, Object> message = new HashMap<>();
            message.put("to", expoPushToken);
            message.put("sound", "default");
            message.put("title", title);
            message.put("body", body);
            message.put("priority", "high");
            message.put("channelId", "default");
            
            if (data != null && !data.isEmpty()) {
                message.put("data", data);
            }
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Accept", "application/json");
            headers.set("Accept-Encoding", "gzip, deflate");
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(message, headers);
            
            ResponseEntity<String> response = restTemplate.postForEntity(EXPO_PUSH_URL, request, String.class);
            
            System.out.println("✅ Expo push notification sent: " + response.getBody());
            
        } catch (Exception e) {
            System.err.println("❌ Error sending Expo push notification: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    public void sendToMultipleDevices(List<String> tokens, String title, String body, Map<String, Object> data) {
        try {
            System.out.println("📤 Sending to " + tokens.size() + " devices");
            
            for (String token : tokens) {
                sendPushNotification(token, title, body, data);
            }
            
            System.out.println("✅ Sent to all devices");
            
        } catch (Exception e) {
            System.err.println("❌ Error sending multicast: " + e.getMessage());
        }
    }
}