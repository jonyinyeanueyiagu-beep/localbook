import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

function RegisterScreen(props) {
  const navigation = props.navigation;
  const route = props.route;
  
  let selectedRole = 'CLIENT';
  const hasParams = route.params !== null && route.params !== undefined;
  if (hasParams === true) {
    const hasRole = route.params.role !== null && route.params.role !== undefined;
    if (hasRole === true) {
      selectedRole = route.params.role;
    }
  }

  const authContext = useAuth();
  const register = authContext.register;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    console.log('🚀 Starting registration...');
    console.log('📋 Role:', selectedRole);

    const trimmedName = name.trim();
    const hasName = trimmedName.length > 0;
    if (hasName === false) {
      Alert.alert('Error', 'Please fill in your name');
      return;
    }

    const nameLength = trimmedName.length;
    const isNameLongEnough = nameLength >= 2;
    if (isNameLongEnough === false) {
      Alert.alert('Error', 'Name must be at least 2 characters');
      return;
    }

    const trimmedEmail = email.trim();
    const hasEmail = trimmedEmail.length > 0;
    if (hasEmail === false) {
      Alert.alert('Error', 'Please fill in your email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValidEmail = emailRegex.test(trimmedEmail);
    if (isValidEmail === false) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    const hasPassword = password.length > 0;
    if (hasPassword === false) {
      Alert.alert('Error', 'Please fill in your password');
      return;
    }

    const passwordLength = password.length;
    const isPasswordLongEnough = passwordLength >= 6;
    if (isPasswordLongEnough === false) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    const hasConfirmPassword = confirmPassword.length > 0;
    if (hasConfirmPassword === false) {
      Alert.alert('Error', 'Please confirm your password');
      return;
    }

    const passwordsMatch = password === confirmPassword;
    if (passwordsMatch === false) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    const isBusinessOwner = selectedRole === 'BUSINESS_OWNER';
    if (isBusinessOwner === true) {
      const trimmedBusinessName = businessName.trim();
      const hasBusinessName = trimmedBusinessName.length > 0;
      if (hasBusinessName === false) {
        Alert.alert('Error', 'Please enter your business name');
        return;
      }

      const trimmedLocation = location.trim();
      const hasLocation = trimmedLocation.length > 0;
      if (hasLocation === false) {
        Alert.alert('Error', 'Please enter your business location');
        return;
      }

      const trimmedCategory = category.trim();
      const hasCategory = trimmedCategory.length > 0;
      if (hasCategory === false) {
        Alert.alert('Error', 'Please enter your business category');
        return;
      }
    }

    setLoading(true);

    const registrationData = {
      name: trimmedName,
      email: trimmedEmail,
      password: password,
      role: selectedRole,
    };

    const trimmedPhoneNumber = phoneNumber.trim();
    const hasPhoneNumber = trimmedPhoneNumber.length > 0;
    if (hasPhoneNumber === true) {
      registrationData.phoneNumber = trimmedPhoneNumber;
    }

    if (isBusinessOwner === true) {
      const trimmedBusinessName = businessName.trim();
      const trimmedLocation = location.trim();
      const trimmedCategory = category.trim();
      const trimmedDescription = description.trim();

      registrationData.businessName = trimmedBusinessName;
      registrationData.location = trimmedLocation;
      registrationData.category = trimmedCategory;

      const hasDescription = trimmedDescription.length > 0;
      if (hasDescription === true) {
        registrationData.description = trimmedDescription;
      }
    }

    console.log('📤 Registration data:', registrationData);

    const result = await register(registrationData);
    setLoading(false);

    const isSuccess = result.success === true;
    if (isSuccess === false) {
      const errorMessage = result.error;
      const hasErrorMessage = errorMessage !== null && errorMessage !== undefined;
      
      let displayMessage = 'Something went wrong';
      if (hasErrorMessage === true) {
        displayMessage = errorMessage;
      }
      
      Alert.alert('Registration Failed', displayMessage);
    }
  }

  function handleNavigateToLogin() {
    navigation.navigate('Login');
  }

  const isBusinessOwner = selectedRole === 'BUSINESS_OWNER';
  const isClient = selectedRole === 'CLIENT';

  let roleLabel = 'User';
  if (isClient === true) {
    roleLabel = 'Client';
  } else if (isBusinessOwner === true) {
    roleLabel = 'Business Owner';
  }

  const platformOS = Platform.OS;
  const isIOS = platformOS === 'ios';

  const isNotLoading = loading === false;

  return (
    <KeyboardAvoidingView
      behavior={isIOS === true ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: '#f9fafb' }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flex: 1 }}>
          {/* Header */}
          <View style={{
            backgroundColor: '#7c3aed',
            paddingTop: 60,
            paddingBottom: 32,
            paddingHorizontal: 24,
          }}>
            <Text style={{
              fontSize: 32,
              fontWeight: '800',
              marginBottom: 8,
              color: '#ffffff',
            }}>
              Create Account
            </Text>
            <Text style={{
              fontSize: 16,
              color: '#e9d5ff',
            }}>
              Register as {roleLabel}
            </Text>
          </View>

          {/* Form */}
          <View style={{
            paddingHorizontal: 24,
            paddingTop: 32,
          }}>
            {/* Name Input */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                marginBottom: 8,
                color: '#374151',
              }}>
                Full Name *
              </Text>
              <TextInput
                style={{
                  borderWidth: 2,
                  borderColor: '#e5e7eb',
                  borderRadius: 12,
                  padding: 16,
                  fontSize: 16,
                  backgroundColor: '#ffffff',
                  color: '#111827',
                }}
                placeholder="Enter your full name"
                placeholderTextColor="#9ca3af"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                editable={isNotLoading}
              />
            </View>

            {/* Email Input */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                marginBottom: 8,
                color: '#374151',
              }}>
                Email Address *
              </Text>
              <TextInput
                style={{
                  borderWidth: 2,
                  borderColor: '#e5e7eb',
                  borderRadius: 12,
                  padding: 16,
                  fontSize: 16,
                  backgroundColor: '#ffffff',
                  color: '#111827',
                }}
                placeholder="Enter your email"
                placeholderTextColor="#9ca3af"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
                editable={isNotLoading}
              />
            </View>

            {/* Phone Number Input */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                marginBottom: 8,
                color: '#374151',
              }}>
                Phone Number
              </Text>
              <TextInput
                style={{
                  borderWidth: 2,
                  borderColor: '#e5e7eb',
                  borderRadius: 12,
                  padding: 16,
                  fontSize: 16,
                  backgroundColor: '#ffffff',
                  color: '#111827',
                }}
                placeholder="Optional"
                placeholderTextColor="#9ca3af"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                editable={isNotLoading}
              />
            </View>

            {/* Business Fields */}
            {isBusinessOwner === true && (
              <View>
                <View style={{ marginBottom: 20 }}>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '600',
                    marginBottom: 8,
                    color: '#374151',
                  }}>
                    Business Name *
                  </Text>
                  <TextInput
                    style={{
                      borderWidth: 2,
                      borderColor: '#e5e7eb',
                      borderRadius: 12,
                      padding: 16,
                      fontSize: 16,
                      backgroundColor: '#ffffff',
                      color: '#111827',
                    }}
                    placeholder="Enter business name"
                    placeholderTextColor="#9ca3af"
                    value={businessName}
                    onChangeText={setBusinessName}
                    editable={isNotLoading}
                  />
                </View>

                <View style={{ marginBottom: 20 }}>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '600',
                    marginBottom: 8,
                    color: '#374151',
                  }}>
                    Location *
                  </Text>
                  <TextInput
                    style={{
                      borderWidth: 2,
                      borderColor: '#e5e7eb',
                      borderRadius: 12,
                      padding: 16,
                      fontSize: 16,
                      backgroundColor: '#ffffff',
                      color: '#111827',
                    }}
                    placeholder="e.g., Carlow, Ireland"
                    placeholderTextColor="#9ca3af"
                    value={location}
                    onChangeText={setLocation}
                    editable={isNotLoading}
                  />
                </View>

                <View style={{ marginBottom: 20 }}>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '600',
                    marginBottom: 8,
                    color: '#374151',
                  }}>
                    Category *
                  </Text>
                  <TextInput
                    style={{
                      borderWidth: 2,
                      borderColor: '#e5e7eb',
                      borderRadius: 12,
                      padding: 16,
                      fontSize: 16,
                      backgroundColor: '#ffffff',
                      color: '#111827',
                    }}
                    placeholder="e.g., Hair Salon, Restaurant"
                    placeholderTextColor="#9ca3af"
                    value={category}
                    onChangeText={setCategory}
                    editable={isNotLoading}
                  />
                </View>

                <View style={{ marginBottom: 20 }}>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '600',
                    marginBottom: 8,
                    color: '#374151',
                  }}>
                    Description
                  </Text>
                  <TextInput
                    style={{
                      borderWidth: 2,
                      borderColor: '#e5e7eb',
                      borderRadius: 12,
                      padding: 16,
                      fontSize: 16,
                      backgroundColor: '#ffffff',
                      color: '#111827',
                      minHeight: 100,
                      textAlignVertical: 'top',
                    }}
                    placeholder="Describe your business (optional)"
                    placeholderTextColor="#9ca3af"
                    value={description}
                    onChangeText={setDescription}
                    multiline={true}
                    numberOfLines={4}
                    editable={isNotLoading}
                  />
                </View>
              </View>
            )}

            {/* Password Input */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                marginBottom: 8,
                color: '#374151',
              }}>
                Password *
              </Text>
              <TextInput
                style={{
                  borderWidth: 2,
                  borderColor: '#e5e7eb',
                  borderRadius: 12,
                  padding: 16,
                  fontSize: 16,
                  backgroundColor: '#ffffff',
                  color: '#111827',
                }}
                placeholder="At least 6 characters"
                placeholderTextColor="#9ca3af"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={true}
                autoCapitalize="none"
                editable={isNotLoading}
              />
              <Text style={{
                fontSize: 12,
                color: '#6b7280',
                marginTop: 4,
              }}>
                Minimum 6 characters
              </Text>
            </View>

            {/* Confirm Password Input */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                marginBottom: 8,
                color: '#374151',
              }}>
                Confirm Password *
              </Text>
              <TextInput
                style={{
                  borderWidth: 2,
                  borderColor: '#e5e7eb',
                  borderRadius: 12,
                  padding: 16,
                  fontSize: 16,
                  backgroundColor: '#ffffff',
                  color: '#111827',
                }}
                placeholder="Re-enter your password"
                placeholderTextColor="#9ca3af"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={true}
                autoCapitalize="none"
                editable={isNotLoading}
              />
            </View>

            {/* Register Button */}
            <TouchableOpacity
              style={{
                backgroundColor: loading === true ? '#a78bfa' : '#7c3aed',
                padding: 16,
                borderRadius: 12,
                alignItems: 'center',
                marginTop: 10,
                marginBottom: 20,
                shadowColor: '#7c3aed',
                shadowOffset: {
                  width: 0,
                  height: 4,
                },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading === true ? (
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                }}>
                  <ActivityIndicator color="#ffffff" />
                  <Text style={{
                    color: '#ffffff',
                    fontSize: 16,
                    fontWeight: '700',
                    marginLeft: 8,
                  }}>
                    Creating Account...
                  </Text>
                </View>
              ) : (
                <Text style={{
                  color: '#ffffff',
                  fontSize: 16,
                  fontWeight: '700',
                }}>
                  Create Account
                </Text>
              )}
            </TouchableOpacity>

            {/* Login Link */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <Text style={{
                color: '#6b7280',
                fontSize: 14,
              }}>
                Already have an account?{' '}
              </Text>
              <TouchableOpacity
                onPress={handleNavigateToLogin}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Text style={{
                  color: '#7c3aed',
                  fontSize: 14,
                  fontWeight: '600',
                }}>
                  Sign In
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default RegisterScreen;