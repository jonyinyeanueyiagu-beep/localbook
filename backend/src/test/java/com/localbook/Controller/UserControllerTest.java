package com.localbook.Controller;
import com.localbook.controller.UserController;
import com.localbook.dto.UserResponseDTO;
import com.localbook.model.User;
import com.localbook.model.UserRole;
import com.localbook.service.UserService;
import com.localbook.util.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;

@WebMvcTest(
    controllers = UserController.class,
    excludeAutoConfiguration = {
        org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration.class
    }
)
class UserControllerTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @MockBean
    private UserService userService;
    
    @MockBean
    private JwtUtil jwtUtil;
    
    private User sampleClient;
    private User sampleBusinessOwner;
    
    @BeforeEach
    void setUp() {
        sampleClient = new User();
        sampleClient.setId(1L);
        sampleClient.setEmail("client@test.com");
        sampleClient.setPassword("hashedPassword123");
        sampleClient.setName("John Doe");
        sampleClient.setPhoneNumber("1234567890");
        sampleClient.setRole(UserRole.CLIENT);
        
        sampleBusinessOwner = new User();
        sampleBusinessOwner.setId(2L);
        sampleBusinessOwner.setEmail("business@test.com");
        sampleBusinessOwner.setPassword("hashedPassword456");
        sampleBusinessOwner.setName("Jane Smith");
        sampleBusinessOwner.setPhoneNumber("0987654321");
        sampleBusinessOwner.setRole(UserRole.BUSINESS_OWNER);
    }
    
    @Test
    void testRegisterClient_Success() throws Exception {
        when(userService.registerClient(org.mockito.ArgumentMatchers.any(User.class)))
            .thenReturn(sampleClient);
        
        mockMvc.perform(post("/api/users/register/client")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"client@test.com\",\"password\":\"password123\",\"name\":\"John Doe\",\"phoneNumber\":\"1234567890\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.email").value("client@test.com"))
                .andExpect(jsonPath("$.role").value("CLIENT"));
        
        verify(userService, times(1)).registerClient(org.mockito.ArgumentMatchers.any(User.class));
    }
    
    @Test
    void testRegisterClient_BadRequest() throws Exception {
        when(userService.registerClient(org.mockito.ArgumentMatchers.any(User.class)))
            .thenThrow(new IllegalArgumentException("Email already exists"));
        
        mockMvc.perform(post("/api/users/register/client")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"duplicate@test.com\",\"password\":\"password123\"}"))
                .andExpect(status().isBadRequest());
    }
    
    @Test
    void testRegisterBusinessOwner_Success() throws Exception {
        when(userService.registerBusinessOwner(org.mockito.ArgumentMatchers.any(User.class)))
            .thenReturn(sampleBusinessOwner);
        
        mockMvc.perform(post("/api/users/register/business-owner")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"business@test.com\",\"password\":\"password456\",\"name\":\"Jane Smith\",\"phoneNumber\":\"0987654321\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(2))
                .andExpect(jsonPath("$.email").value("business@test.com"))
                .andExpect(jsonPath("$.role").value("BUSINESS_OWNER"));
        
        verify(userService, times(1)).registerBusinessOwner(org.mockito.ArgumentMatchers.any(User.class));
    }
    
    @Test
    void testLogin_Success() throws Exception {
        when(userService.login("client@test.com", "password123"))
            .thenReturn(Optional.of(sampleClient));
        
        when(jwtUtil.generateToken(1L, "client@test.com", "CLIENT"))
            .thenReturn("mock.jwt.token");
        
        mockMvc.perform(post("/api/users/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"client@test.com\",\"password\":\"password123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("mock.jwt.token"))
                .andExpect(jsonPath("$.user.id").value(1))
                .andExpect(jsonPath("$.user.email").value("client@test.com"))
                .andExpect(jsonPath("$.user.role").value("CLIENT"));
        
        verify(userService, times(1)).login("client@test.com", "password123");
        verify(jwtUtil, times(1)).generateToken(1L, "client@test.com", "CLIENT");
    }
    
    @Test
    void testLogin_InvalidCredentials() throws Exception {
        when(userService.login("wrong@test.com", "wrongpassword"))
            .thenReturn(Optional.empty());
        
        mockMvc.perform(post("/api/users/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"wrong@test.com\",\"password\":\"wrongpassword\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid email or password"));
        
        verify(userService, times(1)).login("wrong@test.com", "wrongpassword");
        verify(jwtUtil, never()).generateToken(anyLong(), anyString(), anyString());
    }
    
    @Test
    void testGetAllUsers() throws Exception {
        List<User> users = Arrays.asList(sampleClient, sampleBusinessOwner);
        
        when(userService.getAllUsers()).thenReturn(users);
        
        mockMvc.perform(get("/api/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].email").value("client@test.com"))
                .andExpect(jsonPath("$[1].email").value("business@test.com"));
        
        verify(userService, times(1)).getAllUsers();
    }
    
    @Test
    void testGetUserById_Found() throws Exception {
        when(userService.getUserById(1L))
            .thenReturn(Optional.of(sampleClient));
        
        mockMvc.perform(get("/api/users/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.email").value("client@test.com"));
        
        verify(userService, times(1)).getUserById(1L);
    }
    
    @Test
    void testGetUserById_NotFound() throws Exception {
        when(userService.getUserById(999L))
            .thenReturn(Optional.empty());
        
        mockMvc.perform(get("/api/users/999"))
                .andExpect(status().isNotFound());
        
        verify(userService, times(1)).getUserById(999L);
    }
    
    @Test
    void testGetUserByEmail_Found() throws Exception {
        when(userService.getUserByEmail("client@test.com"))
            .thenReturn(Optional.of(sampleClient));
        
        mockMvc.perform(get("/api/users/email/client@test.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("client@test.com"));
        
        verify(userService, times(1)).getUserByEmail("client@test.com");
    }
    
    @Test
    void testGetUserByEmail_NotFound() throws Exception {
        when(userService.getUserByEmail("notfound@test.com"))
            .thenReturn(Optional.empty());
        
        mockMvc.perform(get("/api/users/email/notfound@test.com"))
                .andExpect(status().isNotFound());
        
        verify(userService, times(1)).getUserByEmail("notfound@test.com");
    }
    
    @Test
    void testGetAllClients() throws Exception {
        List<User> clients = Arrays.asList(sampleClient);
        
        when(userService.getAllClients()).thenReturn(clients);
        
        mockMvc.perform(get("/api/users/clients"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].role").value("CLIENT"));
        
        verify(userService, times(1)).getAllClients();
    }
    
    @Test
    void testGetAllBusinessOwners() throws Exception {
        List<User> businessOwners = Arrays.asList(sampleBusinessOwner);
        
        when(userService.getAllBusinessOwners()).thenReturn(businessOwners);
        
        mockMvc.perform(get("/api/users/business-owners"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].role").value("BUSINESS_OWNER"));
        
        verify(userService, times(1)).getAllBusinessOwners();
    }
    
    @Test
    void testUpdateUser_Success() throws Exception {
        User updatedUser = new User();
        updatedUser.setId(1L);
        updatedUser.setEmail("updated@test.com");
        updatedUser.setName("Updated John");
        
        when(userService.updateUser(eq(1L), org.mockito.ArgumentMatchers.any(User.class)))
            .thenReturn(updatedUser);
        
        mockMvc.perform(put("/api/users/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"updated@test.com\",\"name\":\"Updated John\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("updated@test.com"))
                .andExpect(jsonPath("$.name").value("Updated John"));
        
        verify(userService, times(1)).updateUser(eq(1L), org.mockito.ArgumentMatchers.any(User.class));
    }
    
    @Test
    void testUpdateUser_NotFound() throws Exception {
        when(userService.updateUser(eq(999L), org.mockito.ArgumentMatchers.any(User.class)))
            .thenThrow(new IllegalArgumentException("User not found"));
        
        mockMvc.perform(put("/api/users/999")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"updated@test.com\"}"))
                .andExpect(status().isNotFound());
    }
    
    @Test
    void testDeleteUser_Success() throws Exception {
        doNothing().when(userService).deleteUser(1L);
        
        mockMvc.perform(delete("/api/users/1"))
                .andExpect(status().isOk())
                .andExpect(content().string("User deleted successfully"));
        
        verify(userService, times(1)).deleteUser(1L);
    }
    
    @Test
    void testDeleteUser_NotFound() throws Exception {
        doThrow(new IllegalArgumentException("User not found"))
            .when(userService).deleteUser(999L);
        
        mockMvc.perform(delete("/api/users/999"))
                .andExpect(status().isNotFound())
                .andExpect(content().string("User not found"));
    }
    
    @Test
    void testCheckEmailExists_True() throws Exception {
        when(userService.existsByEmail("existing@test.com"))
            .thenReturn(true);
        
        mockMvc.perform(get("/api/users/exists/email/existing@test.com"))
                .andExpect(status().isOk())
                .andExpect(content().string("true"));
        
        verify(userService, times(1)).existsByEmail("existing@test.com");
    }
    
    @Test
    void testCheckEmailExists_False() throws Exception {
        when(userService.existsByEmail("new@test.com"))
            .thenReturn(false);
        
        mockMvc.perform(get("/api/users/exists/email/new@test.com"))
                .andExpect(status().isOk())
                .andExpect(content().string("false"));
        
        verify(userService, times(1)).existsByEmail("new@test.com");
    }
}