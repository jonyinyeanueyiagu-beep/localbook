import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert,
  Modal,
  RefreshControl,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

function ManageServicesScreen() {
  const authContext = useAuth();
  const user = authContext.user;
  const token = authContext.token;

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingService, setEditingService] = useState(null);

  // Form fields
  const [serviceName, setServiceName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    console.log('=== MANAGE SERVICES SCREEN ===');
    console.log('User businessId:', user ? user.businessId : 'N/A');
    fetchServices();
  }, []);

  async function fetchServices() {
    try {
      if (!user || !user.businessId) {
        console.error('No businessId found');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const url = `http://192.168.1.15:8080/api/services/business/${user.businessId}`;
      console.log('Fetching services from:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Services loaded:', data.length);
        if (data.length > 0) {
          console.log('First service:', JSON.stringify(data[0], null, 2));
        }
        setServices(data);
      } else {
        const errorText = await response.text();
        console.error('Failed to load services:', errorText);
        Alert.alert('Error', 'Failed to load services');
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      Alert.alert('Error', 'Network error: ' + error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function onRefresh() {
    setRefreshing(true);
    fetchServices();
  }

  function openAddModal() {
    setEditingService(null);
    setServiceName('');
    setDescription('');
    setPrice('');
    setDuration('');
    setModalVisible(true);
  }

  function openEditModal(service) {
    console.log('Editing service:', JSON.stringify(service, null, 2));
    setEditingService(service);
    setServiceName(service.serviceName || '');
    setDescription(service.description || '');
    setPrice(String(service.price || ''));
    setDuration(String(service.durationMinutes || ''));
    setModalVisible(true);
  }

  function closeModal() {
    Keyboard.dismiss();
    setModalVisible(false);
    setEditingService(null);
    setServiceName('');
    setDescription('');
    setPrice('');
    setDuration('');
  }

  async function handleSaveService() {
    Keyboard.dismiss();

    // Validation
    if (!serviceName.trim()) {
      Alert.alert('Error', 'Please enter service name');
      return;
    }
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }
    if (!duration || isNaN(Number(duration)) || Number(duration) <= 0) {
      Alert.alert('Error', 'Please enter a valid duration (minutes)');
      return;
    }

    setSaving(true);

    try {
      const serviceData = {
        serviceName: serviceName.trim(),
        description: description.trim(),
        price: Number(price),
        durationMinutes: Number(duration),
        business: {
          id: user.businessId
        }
      };

      let url;
      let method;

      if (editingService) {
        url = `http://192.168.1.15:8080/api/services/${editingService.id}?businessId=${user.businessId}`;
        method = 'PUT';
      } else {
        url = `http://192.168.1.15:8080/api/services?businessId=${user.businessId}`;
        method = 'POST';
      }

      console.log('=== SAVE SERVICE ===');
      console.log('Method:', method);
      console.log('URL:', url);
      console.log('Data:', JSON.stringify(serviceData, null, 2));

      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serviceData),
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('Save successful:', result);
        Alert.alert(
          'Success', 
          editingService ? 'Service updated!' : 'Service created!',
          [
            {
              text: 'OK',
              onPress: () => {
                closeModal();
                fetchServices();
              }
            }
          ]
        );
      } else {
        const errorText = await response.text();
        console.error('Save failed:', errorText);
        Alert.alert('Error', 'Failed to save service: ' + errorText);
      }
    } catch (error) {
      console.error('Error saving service:', error);
      Alert.alert('Error', 'Network error: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  function handleDeleteService(service) {
    Alert.alert(
      'Delete Service',
      `Are you sure you want to delete "${service.serviceName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => confirmDelete(service)
        }
      ]
    );
  }

  async function confirmDelete(service) {
    try {
      const url = `http://192.168.1.15:8080/api/services/${service.id}?businessId=${user.businessId}`;
      console.log('Deleting service:', url);

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Delete response status:', response.status);

      if (response.ok) {
        Alert.alert('Success', 'Service deleted!');
        fetchServices();
      } else {
        const errorText = await response.text();
        console.error('Delete failed:', errorText);
        Alert.alert('Error', 'Failed to delete service: ' + errorText);
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      Alert.alert('Error', 'Network error: ' + error.message);
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#faf5ff' }}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={{ marginTop: 16, color: '#7c3aed', fontWeight: '600' }}>Loading services...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#faf5ff' }}>
      {/* Header */}
      <View style={{ backgroundColor: '#8b5cf6', paddingTop: 56, paddingBottom: 24, paddingHorizontal: 20 }}>
        <Text style={{ color: '#ffffff', fontSize: 24, fontWeight: '700', marginBottom: 8 }}>
          Manage Services
        </Text>
        <Text style={{ color: '#e9d5ff', fontSize: 14 }}>
          {services.length} service{services.length !== 1 ? 's' : ''} available
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#8b5cf6']}
            tintColor="#8b5cf6"
          />
        }
      >
        {/* Add Service Button */}
        <TouchableOpacity
          style={{
            backgroundColor: '#8b5cf6',
            borderRadius: 12,
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
            shadowColor: '#7c3aed',
            shadowOpacity: 0.3,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
            elevation: 5,
          }}
          onPress={openAddModal}
          activeOpacity={0.8}
        >
          <Text style={{ fontSize: 20, marginRight: 8 }}>➕</Text>
          <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600' }}>
            Add New Service
          </Text>
        </TouchableOpacity>

        {/* Services List */}
        {services.length === 0 ? (
          <View style={{ 
            backgroundColor: '#ffffff', 
            borderRadius: 16, 
            padding: 32, 
            alignItems: 'center',
            borderWidth: 2,
            borderColor: '#e9d5ff',
          }}>
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: '#faf5ff',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}>
              <Text style={{ fontSize: 48 }}>📋</Text>
            </View>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 8 }}>
              No Services Yet
            </Text>
            <Text style={{ color: '#7c3aed', textAlign: 'center', fontSize: 14 }}>
              Add your first service to start accepting bookings
            </Text>
          </View>
        ) : (
          services.map((service) => {
            const name = service.serviceName || 'Unnamed Service';
            const desc = service.description || '';
            const servicePrice = service.price || 0;
            const serviceDuration = service.durationMinutes || 0;

            return (
              <View
                key={service.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 12,
                  shadowColor: '#7c3aed',
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 2,
                  borderWidth: 1,
                  borderColor: '#f3e8ff',
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 4 }}>
                      {name}
                    </Text>
                    {desc ? (
                      <Text style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>
                        {desc}
                      </Text>
                    ) : null}
                  </View>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ backgroundColor: '#f3e8ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginRight: 8, borderWidth: 1, borderColor: '#e9d5ff' }}>
                      <Text style={{ color: '#7c3aed', fontWeight: '700', fontSize: 16 }}>
                        €{servicePrice.toFixed(2)}
                      </Text>
                    </View>
                    <View style={{ backgroundColor: '#faf5ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#e9d5ff' }}>
                      <Text style={{ color: '#8b5cf6', fontWeight: '600', fontSize: 14 }}>
                        ⏱️ {serviceDuration} min
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      backgroundColor: '#8b5cf6',
                      borderRadius: 8,
                      paddingVertical: 10,
                      alignItems: 'center',
                    }}
                    onPress={() => openEditModal(service)}
                    activeOpacity={0.8}
                  >
                    <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 14 }}>
                      ✏️ Edit
                    </Text>
                  </TouchableOpacity>

                 <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: '#a10eaeff',
                    borderRadius: 8,
                    paddingVertical: 10,
                    alignItems: 'center',
                  }}
                  onPress={() => handleDeleteService(service)}
                  activeOpacity={0.8}
                >
                  <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 14 }}>
                    🗑️ Delete
                  </Text>
                </TouchableOpacity>
              </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Add/Edit Service Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={{ flex: 1, backgroundColor: 'rgba(139, 92, 246, 0.4)', justifyContent: 'flex-end' }}>
              <TouchableWithoutFeedback>
                <View style={{ 
                  backgroundColor: '#ffffff', 
                  borderTopLeftRadius: 24, 
                  borderTopRightRadius: 24, 
                  padding: 24, 
                  maxHeight: '90%',
                  borderTopWidth: 3,
                  borderColor: '#8b5cf6',
                }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <Text style={{ fontSize: 20, fontWeight: '700', color: '#7c3aed' }}>
                      {editingService ? 'Edit Service' : 'Add New Service'}
                    </Text>
                    <TouchableOpacity onPress={closeModal}>
                      <Text style={{ fontSize: 24, color: '#9ca3af' }}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  <ScrollView 
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                  >
                    {/* Service Name */}
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#7c3aed', marginBottom: 8 }}>
                      Service Name *
                    </Text>
                    <TextInput
                      style={{
                        backgroundColor: '#faf5ff',
                        borderRadius: 8,
                        padding: 12,
                        fontSize: 16,
                        marginBottom: 16,
                        borderWidth: 2,
                        borderColor: '#e9d5ff',
                        color: '#111827',
                      }}
                      placeholder="e.g., Haircut, Facial, Manicure"
                      placeholderTextColor="#9ca3af"
                      value={serviceName}
                      onChangeText={setServiceName}
                      returnKeyType="next"
                      blurOnSubmit={false}
                    />

                    {/* Description */}
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#7c3aed', marginBottom: 8 }}>
                      Description
                    </Text>
                    <TextInput
                      style={{
                        backgroundColor: '#faf5ff',
                        borderRadius: 8,
                        padding: 12,
                        fontSize: 16,
                        marginBottom: 16,
                        borderWidth: 2,
                        borderColor: '#e9d5ff',
                        height: 80,
                        textAlignVertical: 'top',
                        color: '#111827',
                      }}
                      placeholder="Brief description of the service"
                      placeholderTextColor="#9ca3af"
                      value={description}
                      onChangeText={setDescription}
                      multiline={true}
                      numberOfLines={3}
                      returnKeyType="done"
                      blurOnSubmit={true}
                      onSubmitEditing={Keyboard.dismiss}
                    />

                    {/* Price */}
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#7c3aed', marginBottom: 8 }}>
                      Price (€) *
                    </Text>
                    <TextInput
                      style={{
                        backgroundColor: '#faf5ff',
                        borderRadius: 8,
                        padding: 12,
                        fontSize: 16,
                        marginBottom: 16,
                        borderWidth: 2,
                        borderColor: '#e9d5ff',
                        color: '#111827',
                      }}
                      placeholder="e.g., 25.00"
                      placeholderTextColor="#9ca3af"
                      value={price}
                      onChangeText={setPrice}
                      keyboardType="decimal-pad"
                      returnKeyType="done"
                      blurOnSubmit={true}
                      onSubmitEditing={Keyboard.dismiss}
                    />

                    {/* Duration */}
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#7c3aed', marginBottom: 8 }}>
                      Duration (minutes) *
                    </Text>
                    <TextInput
                      style={{
                        backgroundColor: '#faf5ff',
                        borderRadius: 8,
                        padding: 12,
                        fontSize: 16,
                        marginBottom: 24,
                        borderWidth: 2,
                        borderColor: '#e9d5ff',
                        color: '#111827',
                      }}
                      placeholder="e.g., 60"
                      placeholderTextColor="#9ca3af"
                      value={duration}
                      onChangeText={setDuration}
                      keyboardType="number-pad"
                      returnKeyType="done"
                      blurOnSubmit={true}
                      onSubmitEditing={Keyboard.dismiss}
                    />

                    {/* Save Button */}
                    <TouchableOpacity
                      style={{
                        backgroundColor: saving ? '#9ca3af' : '#8b5cf6',
                        borderRadius: 12,
                        padding: 16,
                        alignItems: 'center',
                        marginBottom: 12,
                        shadowColor: '#7c3aed',
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        shadowOffset: { width: 0, height: 4 },
                        elevation: 5,
                      }}
                      onPress={handleSaveService}
                      disabled={saving}
                      activeOpacity={0.8}
                    >
                      {saving ? (
                        <ActivityIndicator color="#ffffff" />
                      ) : (
                        <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '700' }}>
                          {editingService ? 'Update Service' : 'Create Service'}
                        </Text>
                      )}
                    </TouchableOpacity>

                    {/* Cancel Button */}
                    <TouchableOpacity
                      style={{
                        backgroundColor: '#f3f4f6',
                        borderRadius: 12,
                        padding: 16,
                        alignItems: 'center',
                        borderWidth: 2,
                        borderColor: '#e9d5ff',
                      }}
                      onPress={closeModal}
                      activeOpacity={0.8}
                    >
                      <Text style={{ color: '#7c3aed', fontSize: 16, fontWeight: '600' }}>
                        Cancel
                      </Text>
                    </TouchableOpacity>
                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

export default ManageServicesScreen;