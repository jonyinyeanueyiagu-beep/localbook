import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const RoleSelectionScreen = ({ navigation }) => {
  // ✅ Function to handle role selection
  const handleRoleSelect = (role) => {
    console.log('Selected role:', role);
    navigation.navigate('Register', { role });
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <Text style={styles.title}>Welcome to LocalBook! 👋</Text>
        <Text style={styles.subtitle}>Choose how you'd like to use the app</Text>

        {/* Role Cards */}
        <View style={styles.cardsContainer}>
          {/* Client Card */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => handleRoleSelect('CLIENT')}
            activeOpacity={0.8}
          >
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>👤</Text>
            </View>
            <Text style={styles.cardTitle}>I'm a Client</Text>
            <Text style={styles.cardDescription}>
              Book appointments and discover local services
            </Text>
            <View style={styles.featuresList}>
              <Text style={styles.feature}>✓ Browse businesses</Text>
              <Text style={styles.feature}>✓ Book appointments</Text>
              <Text style={styles.feature}>✓ Leave reviews</Text>
            </View>
          </TouchableOpacity>

          {/* Business Owner Card */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => handleRoleSelect('BUSINESS_OWNER')}
            activeOpacity={0.8}
          >
            <View style={[styles.iconContainer, styles.iconBusinessContainer]}>
              <Text style={styles.icon}>🏪</Text>
            </View>
            <Text style={styles.cardTitle}>I'm a Business Owner</Text>
            <Text style={styles.cardDescription}>
              Manage your business and appointments
            </Text>
            <View style={styles.featuresList}>
              <Text style={styles.feature}>✓ Manage bookings</Text>
              <Text style={styles.feature}>✓ Add services</Text>
              <Text style={styles.feature}>✓ Connect with clients</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Login Link */}
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  cardsContainer: {
    width: '100%',
  },
  card: {
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    marginBottom: 10,
  },
  icon: {
    fontSize: 36,
    textAlign: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
    color: '#333',
  },
  cardDescription: {
    fontSize: 14,
    textAlign: 'center',
    color: '#555',
    marginBottom: 10,
  },
  featuresList: {
    alignItems: 'center',
  },
  feature: {
    fontSize: 13,
    color: '#666',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    color: '#666',
    fontSize: 14,
  },
  loginLink: {
    color: '#6b0ca1ff',
    fontWeight: '600',
  },
});

export default RoleSelectionScreen;
