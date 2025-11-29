package com.localbook.Controller;
import com.localbook.controller.AppointmentController;
import com.localbook.model.Appointment;
import com.localbook.model.AppointmentStatus;
import com.localbook.service.AppointmentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;

@WebMvcTest(
    controllers = AppointmentController.class,
    excludeAutoConfiguration = {
        org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration.class
    }
)
class AppointmentControllerTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @MockBean
    private AppointmentService appointmentService;
    
    private Appointment confirmedAppointment;
    private Appointment canceledAppointment;
    private LocalDateTime appointmentDateTime;
    
    @BeforeEach
    void setUp() {
        appointmentDateTime = LocalDateTime.of(2025, 12, 25, 14, 30);
        
        confirmedAppointment = new Appointment();
        confirmedAppointment.setId(1L);
        confirmedAppointment.setAppointmentDateTime(appointmentDateTime);
        confirmedAppointment.setStatus(AppointmentStatus.CONFIRMED);
        confirmedAppointment.setNotes("Test appointment");
        
        canceledAppointment = new Appointment();
        canceledAppointment.setId(2L);
        canceledAppointment.setAppointmentDateTime(appointmentDateTime);
        canceledAppointment.setStatus(AppointmentStatus.CANCELED);
        canceledAppointment.setNotes("Canceled appointment");
    }
    
    @Test
    void testCreateAppointment_AutomaticallyConfirmed() throws Exception {
        when(appointmentService.createAppointment(
            eq(1L), eq(2L), eq(3L), any(), eq("Test notes")))
            .thenReturn(confirmedAppointment);
        
        mockMvc.perform(post("/api/appointments")
                .param("userId", "1")
                .param("businessId", "2")
                .param("serviceId", "3")
                .param("dateTime", "2025-12-25T14:30:00")
                .param("notes", "Test notes"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.status").value("CONFIRMED"));
        
        verify(appointmentService, times(1)).createAppointment(
            eq(1L), eq(2L), eq(3L), any(), eq("Test notes"));
    }
    
    @Test
    void testCreateAppointment_WithoutNotes_AutomaticallyConfirmed() throws Exception {
        Appointment appointmentWithoutNotes = new Appointment();
        appointmentWithoutNotes.setId(3L);
        appointmentWithoutNotes.setAppointmentDateTime(appointmentDateTime);
        appointmentWithoutNotes.setStatus(AppointmentStatus.CONFIRMED);
        
        when(appointmentService.createAppointment(
            eq(1L), eq(2L), eq(3L), any(), isNull()))
            .thenReturn(appointmentWithoutNotes);
        
        mockMvc.perform(post("/api/appointments")
                .param("userId", "1")
                .param("businessId", "2")
                .param("serviceId", "3")
                .param("dateTime", "2025-12-25T14:30:00"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("CONFIRMED"));
        
        verify(appointmentService, times(1)).createAppointment(
            eq(1L), eq(2L), eq(3L), any(), isNull());
    }
    
    @Test
    void testCreateAppointment_BadRequest() throws Exception {
        when(appointmentService.createAppointment(
            anyLong(), anyLong(), anyLong(), any(), anyString()))
            .thenThrow(new IllegalArgumentException("Invalid data"));
        
        mockMvc.perform(post("/api/appointments")
                .param("userId", "1")
                .param("businessId", "2")
                .param("serviceId", "3")
                .param("dateTime", "2025-12-25T14:30:00")
                .param("notes", "Test notes"))
                .andExpect(status().isBadRequest());
    }
    
    @Test
    void testGetAllAppointments() throws Exception {
        Appointment appointment3 = new Appointment();
        appointment3.setId(3L);
        appointment3.setStatus(AppointmentStatus.CONFIRMED);
        
        List<Appointment> appointments = Arrays.asList(confirmedAppointment, canceledAppointment, appointment3);
        
        when(appointmentService.getAllAppointments()).thenReturn(appointments);
        
        mockMvc.perform(get("/api/appointments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)))
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].status").value("CONFIRMED"))
                .andExpect(jsonPath("$[1].id").value(2))
                .andExpect(jsonPath("$[1].status").value("CANCELED"));
        
        verify(appointmentService, times(1)).getAllAppointments();
    }
    
    @Test
    void testGetAppointmentById_Confirmed() throws Exception {
        when(appointmentService.getAppointmentById(1L))
            .thenReturn(Optional.of(confirmedAppointment));
        
        mockMvc.perform(get("/api/appointments/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.status").value("CONFIRMED"));
        
        verify(appointmentService, times(1)).getAppointmentById(1L);
    }
    
    @Test
    void testGetAppointmentById_Canceled() throws Exception {
        when(appointmentService.getAppointmentById(2L))
            .thenReturn(Optional.of(canceledAppointment));
        
        mockMvc.perform(get("/api/appointments/2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(2))
                .andExpect(jsonPath("$.status").value("CANCELED"));
        
        verify(appointmentService, times(1)).getAppointmentById(2L);
    }
    
    @Test
    void testGetAppointmentById_NotFound() throws Exception {
        when(appointmentService.getAppointmentById(999L))
            .thenReturn(Optional.empty());
        
        mockMvc.perform(get("/api/appointments/999"))
                .andExpect(status().isNotFound());
        
        verify(appointmentService, times(1)).getAppointmentById(999L);
    }
    
    @Test
    void testGetUserAppointments() throws Exception {
        List<Appointment> userAppointments = Arrays.asList(confirmedAppointment, canceledAppointment);
        
        when(appointmentService.getUserAppointments(1L))
            .thenReturn(userAppointments);
        
        mockMvc.perform(get("/api/appointments/user/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[1].id").value(2));
        
        verify(appointmentService, times(1)).getUserAppointments(1L);
    }
    
    @Test
    void testGetUpcomingUserAppointments() throws Exception {
        List<Appointment> upcomingAppointments = Arrays.asList(confirmedAppointment);
        
        when(appointmentService.getUpcomingUserAppointments(1L))
            .thenReturn(upcomingAppointments);
        
        mockMvc.perform(get("/api/appointments/user/1/upcoming"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].status").value("CONFIRMED"));
        
        verify(appointmentService, times(1)).getUpcomingUserAppointments(1L);
    }
    
    @Test
    void testGetPastUserAppointments() throws Exception {
        List<Appointment> pastAppointments = Arrays.asList(canceledAppointment);
        
        when(appointmentService.getPastUserAppointments(1L))
            .thenReturn(pastAppointments);
        
        mockMvc.perform(get("/api/appointments/user/1/past"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].status").value("CANCELED"));
        
        verify(appointmentService, times(1)).getPastUserAppointments(1L);
    }
    
    @Test
    void testGetBusinessAppointments() throws Exception {
        List<Appointment> businessAppointments = Arrays.asList(confirmedAppointment);
        
        when(appointmentService.getBusinessAppointments(2L))
            .thenReturn(businessAppointments);
        
        mockMvc.perform(get("/api/appointments/business/2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(1));
        
        verify(appointmentService, times(1)).getBusinessAppointments(2L);
    }
    
    @Test
    void testGetUpcomingBusinessAppointments() throws Exception {
        List<Appointment> upcomingAppointments = Arrays.asList(confirmedAppointment);
        
        when(appointmentService.getUpcomingBusinessAppointments(2L))
            .thenReturn(upcomingAppointments);
        
        mockMvc.perform(get("/api/appointments/business/2/upcoming"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].status").value("CONFIRMED"));
        
        verify(appointmentService, times(1)).getUpcomingBusinessAppointments(2L);
    }
    
    @Test
    void testGetAppointmentsByStatus_Canceled() throws Exception {
        List<Appointment> canceledAppointments = Arrays.asList(canceledAppointment);
        
        when(appointmentService.getAppointmentsByStatus(AppointmentStatus.CANCELED))
            .thenReturn(canceledAppointments);
        
        mockMvc.perform(get("/api/appointments/status/CANCELED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(2))
                .andExpect(jsonPath("$[0].status").value("CANCELED"));
        
        verify(appointmentService, times(1)).getAppointmentsByStatus(AppointmentStatus.CANCELED);
    }
    
    @Test
    void testGetAppointmentsByStatus_Confirmed() throws Exception {
        List<Appointment> confirmedAppointments = Arrays.asList(confirmedAppointment);
        
        when(appointmentService.getAppointmentsByStatus(AppointmentStatus.CONFIRMED))
            .thenReturn(confirmedAppointments);
        
        mockMvc.perform(get("/api/appointments/status/CONFIRMED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].status").value("CONFIRMED"));
        
        verify(appointmentService, times(1)).getAppointmentsByStatus(AppointmentStatus.CONFIRMED);
    }
    
    @Test
    void testConfirmAppointment_Success() throws Exception {
        when(appointmentService.confirmAppointment(1L, 2L))
            .thenReturn(confirmedAppointment);
        
        mockMvc.perform(put("/api/appointments/1/confirm")
                .param("businessId", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONFIRMED"));
        
        verify(appointmentService, times(1)).confirmAppointment(1L, 2L);
    }
    
    @Test
    void testConfirmAppointment_BadRequest() throws Exception {
        when(appointmentService.confirmAppointment(1L, 2L))
            .thenThrow(new IllegalArgumentException("Cannot confirm appointment"));
        
        mockMvc.perform(put("/api/appointments/1/confirm")
                .param("businessId", "2"))
                .andExpect(status().isBadRequest());
    }
    
    @Test
    void testCancelAppointment_Success() throws Exception {
        when(appointmentService.cancelAppointment(1L, 1L))
            .thenReturn(canceledAppointment);
        
        mockMvc.perform(put("/api/appointments/1/cancel")
                .param("userId", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELED"));
        
        verify(appointmentService, times(1)).cancelAppointment(1L, 1L);
    }
    
    @Test
    void testCancelAppointment_BadRequest() throws Exception {
        when(appointmentService.cancelAppointment(1L, 1L))
            .thenThrow(new IllegalArgumentException("Cannot cancel appointment"));
        
        mockMvc.perform(put("/api/appointments/1/cancel")
                .param("userId", "1"))
                .andExpect(status().isBadRequest());
    }
    
    @Test
    void testCompleteAppointment_Success() throws Exception {
        Appointment completedAppointment = new Appointment();
        completedAppointment.setId(1L);
        completedAppointment.setStatus(AppointmentStatus.COMPLETED);
        
        when(appointmentService.completeAppointment(1L, 2L))
            .thenReturn(completedAppointment);
        
        mockMvc.perform(put("/api/appointments/1/complete")
                .param("businessId", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"));
        
        verify(appointmentService, times(1)).completeAppointment(1L, 2L);
    }
    
    @Test
    void testCompleteAppointment_BadRequest() throws Exception {
        when(appointmentService.completeAppointment(2L, 2L))
            .thenThrow(new IllegalArgumentException("Cannot complete canceled appointment"));
        
        mockMvc.perform(put("/api/appointments/2/complete")
                .param("businessId", "2"))
                .andExpect(status().isBadRequest());
    }
    
    @Test
    void testRescheduleAppointment_Success() throws Exception {
        LocalDateTime newDateTime = LocalDateTime.of(2025, 12, 26, 15, 0);
        Appointment rescheduledAppointment = new Appointment();
        rescheduledAppointment.setId(1L);
        rescheduledAppointment.setAppointmentDateTime(newDateTime);
        rescheduledAppointment.setStatus(AppointmentStatus.CONFIRMED);
        
        when(appointmentService.rescheduleAppointment(eq(1L), any(), eq(1L)))
            .thenReturn(rescheduledAppointment);
        
        mockMvc.perform(put("/api/appointments/1/reschedule")
                .param("newDateTime", "2025-12-26T15:00:00")
                .param("userId", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.status").value("CONFIRMED"));
        
        verify(appointmentService, times(1)).rescheduleAppointment(eq(1L), any(), eq(1L));
    }
    
    @Test
    void testRescheduleAppointment_BadRequest() throws Exception {
        when(appointmentService.rescheduleAppointment(eq(2L), any(), eq(1L)))
            .thenThrow(new IllegalArgumentException("Cannot reschedule canceled appointment"));
        
        mockMvc.perform(put("/api/appointments/2/reschedule")
                .param("newDateTime", "2025-12-26T15:00:00")
                .param("userId", "1"))
                .andExpect(status().isBadRequest());
    }
    
    @Test
    void testDeleteAppointment_Success() throws Exception {
        doNothing().when(appointmentService).deleteAppointment(1L, 1L);
        
        mockMvc.perform(delete("/api/appointments/1")
                .param("userId", "1"))
                .andExpect(status().isOk())
                .andExpect(content().string("Appointment deleted successfully"));
        
        verify(appointmentService, times(1)).deleteAppointment(1L, 1L);
    }
    
    @Test
    void testDeleteAppointment_Forbidden() throws Exception {
        doThrow(new IllegalArgumentException("Not authorized to delete this appointment"))
            .when(appointmentService).deleteAppointment(1L, 999L);
        
        mockMvc.perform(delete("/api/appointments/1")
                .param("userId", "999"))
                .andExpect(status().isForbidden())
                .andExpect(content().string("Not authorized to delete this appointment"));
    }
}