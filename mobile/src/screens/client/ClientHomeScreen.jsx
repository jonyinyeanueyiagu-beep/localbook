import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Dimensions,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import BusinessCard from '../../common/BusinessCard';
import * as Location from 'expo-location';

// ❌ REMOVED: Hardcoded categories
// const CATEGORIES = ['All', 'Hair Salon', 'Beauty', 'Barber', 'Restaurant'];

const screenDimensions = Dimensions.get('window');
const SCREEN_HEIGHT = screenDimensions.height;

function ClientHomeScreen(props) {
  const navigation = props.navigation;
  const authContext = useAuth();
  const user = authContext.user;
  
  const [businesses, setBusinesses] = useState([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState([]);
  const [businessRatings, setBusinessRatings] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [userLocation, setUserLocation] = useState(null);
  const [error, setError] = useState(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  
  // ✅ NEW: State for dynamic categories
  const [categories, setCategories] = useState(['All']);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const API_BASE_URL = 'http://192.168.1.15:8080/api';

  useEffect(function() {
    getUserLocation();
    fetchCategories(); // ✅ NEW: Fetch categories first
    fetchBusinesses();
  }, []);

  useEffect(function() {
    filterBusinesses();
  }, [searchQuery, selectedCategory, businesses]);

  // ✅ NEW: Fetch categories from database
  async function fetchCategories() {
    try {
      setLoadingCategories(true);
      console.log('📂 Fetching categories...');
      
      const url = API_BASE_URL + '/categories';
      const requestOptions = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      };
      
      const response = await fetch(url, requestOptions);
      
      const isResponseOk = response.ok;
      if (isResponseOk === true) {
        const data = await response.json();
        console.log('✅ Categories received:', data.length);
        
        // Extract category names and add "All" at the beginning
        const categoryNames = ['All'];
        let categoryIndex = 0;
        while (categoryIndex < data.length) {
          const category = data[categoryIndex];
          const categoryName = category.name;
          categoryNames.push(categoryName);
          categoryIndex = categoryIndex + 1;
        }
        
        setCategories(categoryNames);
        console.log('✅ Categories set:', categoryNames);
      } else {
        console.log('⚠️ Failed to fetch categories, using defaults');
        // Fallback to basic categories
        setCategories(['All', 'Hair Salons', 'Spa & Wellness', 'Barber Shops', 'Beauty', 'Fitness']);
      }
    } catch (errorObject) {
      console.error('❌ Error fetching categories:', errorObject);
      // Fallback to basic categories
      setCategories(['All', 'Hair Salons', 'Spa & Wellness', 'Barber Shops', 'Beauty', 'Fitness']);
    } finally {
      setLoadingCategories(false);
    }
  }

  async function getUserLocation() {
    try {
      const permissionResult = await Location.requestForegroundPermissionsAsync();
      const permissionStatus = permissionResult.status;
      const isGranted = permissionStatus === 'granted';
      
      if (isGranted === true) {
        const locationOptions = {};
        const location = await Location.getCurrentPositionAsync(locationOptions);
        const latitude = location.coords.latitude;
        const longitude = location.coords.longitude;
        
        const locationObject = {
          lat: latitude,
          lng: longitude,
        };
        
        setUserLocation(locationObject);
      } else {
        const defaultLocation = {
          lat: 52.8408,
          lng: -6.9261,
        };
        setUserLocation(defaultLocation);
      }
    } catch (errorObject) {
      console.log('Location error:', errorObject);
      
      const defaultLocation = {
        lat: 52.8408,
        lng: -6.9261,
      };
      setUserLocation(defaultLocation);
    }
  }

  async function fetchBusinesses() {
    try {
      setError(null);
      
      const url = API_BASE_URL + '/businesses/approved';
      console.log('🔍 Fetching from:', url);
      
      const requestOptions = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      };
      
      const response = await fetch(url, requestOptions);
      const responseStatus = response.status;
      
      console.log('📡 Response status:', responseStatus);

      const isResponseOk = response.ok;
      if (isResponseOk === false) {
        const statusText = response.statusText;
        const errorMessage = 'HTTP ' + responseStatus.toString() + ': ' + statusText;
        const error = new Error(errorMessage);
        throw error;
      }

      const data = await response.json();
      const dataLength = data.length;
      console.log('✅ Businesses received:', dataLength);
      
      let businessesArray = data;
      const hasData = data !== null && data !== undefined;
      if (hasData === false) {
        businessesArray = [];
      }
      
      setBusinesses(businessesArray);
      setFilteredBusinesses(businessesArray);
      
      await fetchAllBusinessRatings(businessesArray);
      
    } catch (errorObject) {
      const errorMessage = errorObject.message;
      console.error('❌ Fetch error:', errorObject);
      setError(errorMessage);
      
      const emptyArray = [];
      setBusinesses(emptyArray);
      setFilteredBusinesses(emptyArray);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function fetchAllBusinessRatings(businessesArray) {
    const ratingsMap = {};
    
    let businessIndex = 0;
    while (businessIndex < businessesArray.length) {
      const business = businessesArray[businessIndex];
      const businessId = business.id;
      
      try {
        const businessIdString = businessId.toString();
        const url = API_BASE_URL + '/ratings/business/' + businessIdString + '/summary';
        
        const requestOptions = {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        };
        
        const response = await fetch(url, requestOptions);
        
        const isResponseOk = response.ok;
        if (isResponseOk === true) {
          const data = await response.json();
          ratingsMap[businessId] = data;
          console.log('✅ Rating for business', businessId, ':', data.averageRating);
        } else {
          ratingsMap[businessId] = null;
        }
      } catch (errorObject) {
        console.log('⚠️ Could not fetch rating for business', businessId);
        ratingsMap[businessId] = null;
      }
      
      businessIndex = businessIndex + 1;
    }
    
    setBusinessRatings(ratingsMap);
    console.log('✅ All ratings fetched');
  }

  function filterBusinesses() {
    const businessesCopy = [];
    let businessIndex = 0;
    while (businessIndex < businesses.length) {
      const business = businesses[businessIndex];
      businessesCopy.push(business);
      businessIndex = businessIndex + 1;
    }
    
    let filtered = businessesCopy;
    
    const isNotAllCategory = selectedCategory !== 'All';
    if (isNotAllCategory === true) {
      const newFiltered = [];
      let filterIndex = 0;
      
      while (filterIndex < filtered.length) {
        const business = filtered[filterIndex];
        const businessCategory = business.category;
        
        let categoryLower = '';
        const hasCategory = businessCategory !== null && businessCategory !== undefined;
        if (hasCategory === true) {
          categoryLower = businessCategory.toLowerCase();
        }
        
        const selectedCategoryLower = selectedCategory.toLowerCase();
        
        // ✅ FIXED: Exact match for category names
        const isCategoryMatch = categoryLower === selectedCategoryLower;
        
        if (isCategoryMatch === true) {
          newFiltered.push(business);
        }
        
        filterIndex = filterIndex + 1;
      }
      
      filtered = newFiltered;
    }
    
    const trimmedQuery = searchQuery.trim();
    const hasSearchQuery = trimmedQuery.length > 0;
    
    if (hasSearchQuery === true) {
      const queryLower = searchQuery.toLowerCase();
      const newFiltered = [];
      let searchIndex = 0;
      
      while (searchIndex < filtered.length) {
        const business = filtered[searchIndex];
        
        const businessName = business.businessName;
        let nameLower = '';
        const hasName = businessName !== null && businessName !== undefined;
        if (hasName === true) {
          nameLower = businessName.toLowerCase();
        }
        const nameIncludes = nameLower.includes(queryLower);
        
        const businessCategory = business.category;
        let categoryLower = '';
        const hasCategory = businessCategory !== null && businessCategory !== undefined;
        if (hasCategory === true) {
          categoryLower = businessCategory.toLowerCase();
        }
        const categoryIncludes = categoryLower.includes(queryLower);
        
        const businessLocation = business.location;
        let locationLower = '';
        const hasLocation = businessLocation !== null && businessLocation !== undefined;
        if (hasLocation === true) {
          locationLower = businessLocation.toLowerCase();
        }
        const locationIncludes = locationLower.includes(queryLower);
        
        const businessAddress = business.address;
        let addressLower = '';
        const hasAddress = businessAddress !== null && businessAddress !== undefined;
        if (hasAddress === true) {
          addressLower = businessAddress.toLowerCase();
        }
        const addressIncludes = addressLower.includes(queryLower);
        
        const isMatch = nameIncludes === true || categoryIncludes === true || locationIncludes === true || addressIncludes === true;
        
        if (isMatch === true) {
          newFiltered.push(business);
        }
        
        searchIndex = searchIndex + 1;
      }
      
      filtered = newFiltered;
    }
    
    setFilteredBusinesses(filtered);
  }

  function handleBusinessPress(business) {
    const businessId = business.id;
    const navigationParams = { 
      businessId: businessId,
      business: business 
    };
    navigation.navigate('BusinessDetails', navigationParams);
  }

  function onRefresh() {
    setRefreshing(true);
    fetchCategories(); // ✅ Refresh categories too
    fetchBusinesses();
  }

  function handleClearSearch() {
    setSearchQuery('');
  }

  function handleOpenFilterModal() {
    setShowFilterModal(true);
  }

  function handleCloseFilterModal() {
    setShowFilterModal(false);
  }

  function handleClearAllFilters() {
    setSearchQuery('');
    setSelectedCategory('All');
  }

  function handleSelectCategory(cat) {
    setSelectedCategory(cat);
    setShowFilterModal(false);
  }

  function handleResetAllFilters() {
    setSelectedCategory('All');
    setSearchQuery('');
    setShowFilterModal(false);
  }

  if (loading === true) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' }}>
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text style={{ marginTop: 16, color: '#6b7280', fontSize: 16 }}>Loading businesses...</Text>
      </View>
    );
  }

  let userName = 'Guest';
  const hasUser = user !== null && user !== undefined;
  if (hasUser === true) {
    const hasUserName = user.name !== null && user.name !== undefined;
    if (hasUserName === true) {
      userName = user.name;
    }
  }

  const filteredBusinessesLength = filteredBusinesses.length;
  const filteredBusinessesLengthString = filteredBusinessesLength.toString();
  
  const hasSearchQuery = searchQuery.length > 0;
  const hasError = error !== null && error !== undefined;
  const isNotAllCategory = selectedCategory !== 'All';
  const hasActiveFilter = isNotAllCategory === true || hasSearchQuery === true;

  function renderFlatListItem(renderProps) {
    const item = renderProps.item;
    const businessId = item.id;
    
    const ratingSummary = businessRatings[businessId];
    
    const businessWithRating = Object.assign({}, item);
    businessWithRating.ratingSummary = ratingSummary;
    
    function handlePress() {
      handleBusinessPress(item);
    }
    
    return (
      <BusinessCard
        business={businessWithRating}
        userLocation={userLocation}
        onPress={handlePress}
      />
    );
  }

  function extractKeyFromItem(item) {
    const itemId = item.id;
    const hasItemId = itemId !== null && itemId !== undefined;
    if (hasItemId === true) {
      const itemIdString = itemId.toString();
      return itemIdString;
    }
    const randomString = Math.random().toString();
    return randomString;
  }

  function renderEmptyComponent() {
    let emoji = '🏪';
    let title = 'No businesses found';
    let description = 'No businesses available yet';
    
    if (hasError === true) {
      emoji = '⚠️';
      title = 'Connection Failed';
      description = 'Unable to load businesses. Check your connection.';
    } else {
      const hasSearchOrFilter = hasSearchQuery === true || selectedCategory !== 'All';
      if (hasSearchOrFilter === true) {
        emoji = '🔍';
        description = 'Try adjusting your search or filter';
      }
    }
    
    const shouldShowRetry = hasError === true;
    
    return (
      <View style={{ alignItems: 'center', paddingVertical: 64 }}>
        <Text style={{ fontSize: 60, marginBottom: 16 }}>
          {emoji}
        </Text>
        <Text style={{ color: '#111827', fontWeight: '700', fontSize: 18, marginBottom: 4 }}>
          {title}
        </Text>
        <Text style={{ color: '#6b7280', fontSize: 14, textAlign: 'center', paddingHorizontal: 32, marginBottom: 16 }}>
          {description}
        </Text>
        {shouldShowRetry === true && (
          <TouchableOpacity 
            onPress={fetchBusinesses}
            style={{ backgroundColor: '#7c3aed', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 }}
          >
            <Text style={{ color: '#ffffff', fontWeight: '600' }}>
              Retry
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // ✅ UPDATED: Render dynamic category buttons
  function renderCategoryButtons() {
    const categoryButtons = [];
    let categoryIndex = 0;
    
    // ✅ Now uses dynamic categories from state
    while (categoryIndex < categories.length) {
      const cat = categories[categoryIndex];
      const isSelected = selectedCategory === cat;
      
      const containerStyle = {
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 2,
      };
      
      const textStyle = {
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
      };
      
      if (isSelected === true) {
        containerStyle.backgroundColor = '#7c3aed';
        containerStyle.borderColor = '#7c3aed';
        textStyle.color = '#ffffff';
      } else {
        containerStyle.backgroundColor = '#f9fafb';
        containerStyle.borderColor = '#e5e7eb';
        textStyle.color = '#374151';
      }
      
      function handleCategoryPress() {
        handleSelectCategory(cat);
      }
      
      const categoryButton = (
        <TouchableOpacity
          key={cat}
          onPress={handleCategoryPress}
          style={containerStyle}
        >
          <Text style={textStyle}>
            {cat}
          </Text>
        </TouchableOpacity>
      );
      
      categoryButtons.push(categoryButton);
      categoryIndex = categoryIndex + 1;
    }
    
    return categoryButtons;
  }

  const filterButtonEmoji = hasActiveFilter === true ? '🎯' : '☰';
  const filterButtonBackgroundColor = hasActiveFilter === true ? '#ffffff' : 'rgba(255, 255, 255, 0.2)';
  
  const maxModalHeight = SCREEN_HEIGHT * 0.7;

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {/* Fixed Header */}
      <View style={{ backgroundColor: '#7c3aed', paddingTop: 48, paddingBottom: 0 }}>
        {/* Top Bar with Greeting */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontSize: 24, fontWeight: '800', color: '#ffffff' }}>
              LocalBook
            </Text>
            <Text style={{ fontSize: 14, color: '#e9d5ff', marginTop: 2 }}>
              Hello, {userName}! 👋
            </Text>
          </View>
          
          <View style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 14, marginRight: 4 }}>📍</Text>
              <Text style={{ fontSize: 13, color: '#ffffff', fontWeight: '600' }}>Carlow</Text>
            </View>
          </View>
        </View>

        {/* Search and Filter Row */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 12, paddingHorizontal: 12, height: 44 }}>
            <Text style={{ marginRight: 8, fontSize: 16 }}>🔍</Text>
            <TextInput
              style={{ flex: 1, fontSize: 15 }}
              placeholder="Search businesses..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9ca3af"
            />
            {hasSearchQuery === true && (
              <TouchableOpacity onPress={handleClearSearch}>
                <Text style={{ color: '#9ca3af', fontSize: 18 }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity
            onPress={handleOpenFilterModal}
            style={{ 
              backgroundColor: filterButtonBackgroundColor,
              paddingHorizontal: 16,
              borderRadius: 12,
              height: 44,
              justifyContent: 'center',
              alignItems: 'center',
              minWidth: 44,
            }}
          >
            <Text style={{ fontSize: 20 }}>
              {filterButtonEmoji}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Results Bar */}
        <View style={{ 
          backgroundColor: '#ffffff', 
          paddingHorizontal: 20, 
          paddingVertical: 12,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        }}>
          <Text style={{ fontSize: 14, color: '#6b7280', fontWeight: '600' }}>
            {filteredBusinessesLengthString} businesses
          </Text>
          
          {hasActiveFilter === true && (
            <TouchableOpacity
              onPress={handleClearAllFilters}
              style={{ 
                backgroundColor: '#fef2f2',
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 8,
              }}
            >
              <Text style={{ fontSize: 12, color: '#ef4444', fontWeight: '600' }}>
                Clear filters
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Error Message */}
      {hasError === true && (
        <View style={{ marginHorizontal: 16, marginTop: 12, padding: 12, backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 12 }}>
          <Text style={{ color: '#b91c1c', fontSize: 14, fontWeight: '600' }}>
            ⚠️ Connection Error
          </Text>
          <Text style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>
            {error}
          </Text>
          <TouchableOpacity 
            onPress={fetchBusinesses}
            style={{ marginTop: 8, backgroundColor: '#ef4444', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 }}
          >
            <Text style={{ color: '#ffffff', textAlign: 'center', fontSize: 14, fontWeight: '600' }}>
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Business List */}
      <FlatList
        data={filteredBusinesses}
        renderItem={renderFlatListItem}
        keyExtractor={extractKeyFromItem}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
        onRefresh={onRefresh}
        refreshing={refreshing}
        ListEmptyComponent={renderEmptyComponent}
      />

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseFilterModal}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' }}>
          <View style={{ 
            backgroundColor: '#ffffff',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingTop: 20,
            paddingBottom: 40,
            maxHeight: maxModalHeight,
          }}>
            {/* Modal Header */}
            <View style={{ 
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 24,
              paddingBottom: 16,
              borderBottomWidth: 1,
              borderBottomColor: '#f3f4f6',
            }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827' }}>
                Filter by Category
              </Text>
              <TouchableOpacity onPress={handleCloseFilterModal}>
                <Text style={{ fontSize: 24, color: '#9ca3af' }}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* ✅ Categories Grid - Now shows loading state */}
            <View style={{ paddingHorizontal: 24, paddingTop: 20 }}>
              {loadingCategories === true ? (
                <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                  <ActivityIndicator size="large" color="#7c3aed" />
                  <Text style={{ marginTop: 12, color: '#6b7280' }}>Loading categories...</Text>
                </View>
              ) : (
                renderCategoryButtons()
              )}
            </View>

            {/* Reset Button */}
            <View style={{ paddingHorizontal: 24, paddingTop: 12 }}>
              <TouchableOpacity
                onPress={handleResetAllFilters}
                style={{
                  backgroundColor: '#fef2f2',
                  paddingVertical: 14,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#fecaca',
                }}
              >
                <Text style={{ 
                  fontSize: 15,
                  fontWeight: '600',
                  color: '#ef4444',
                  textAlign: 'center',
                }}>
                  Reset All Filters
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default ClientHomeScreen;