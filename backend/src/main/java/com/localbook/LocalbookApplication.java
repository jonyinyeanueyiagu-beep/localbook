package com.localbook;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling  // ✅ Enable scheduled tasks for reminders
@EnableJpaAuditing // Enable JPA Auditing for automatic timestamp management

public class LocalbookApplication {

	public static void main(String[] args) {
		SpringApplication.run(LocalbookApplication.class, args);
		System.out.println("✅ LocalBook Application Started!");
        System.out.println("📱 Push Notifications: ENABLED");
        System.out.println("⏰ Scheduler: RUNNING");
	}

}
