import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import RatingStars from '../../Components/RatingStars';

const RateBusinessScreen = ({ route, navigation }) => {
  // ✅ LOG PARAMETERS IMMEDIATELY
  console.log('=== SCREEN MOUNTED ===');
  console.log('route.params:', JSON.stringify(route.params, null, 2));

  const businessId = route.params?.businessId;
  const businessName = route.params?.businessName;
  const appointmentId = route.params?.appointmentId;
  const userId = route.params?.userId;

  console.log('Extracted parameters:');
  console.log('  businessId:', businessId, 'type:', typeof businessId);
  console.log('  businessName:', businessName);
  console.log('  appointmentId:', appointmentId, 'type:', typeof appointmentId);
  console.log('  userId:', userId, 'type:', typeof userId);
  
  const ratingState = useState(0);
  const rating = ratingState[0];
  const setRating = ratingState[1];

  const reviewState = useState('');
  const review = reviewState[0];
  const setReview = reviewState[1];

  const loadingState = useState(false);
  const loading = loadingState[0];
  const setLoading = loadingState[1];

  const sentimentResultState = useState(null);
  const sentimentResult = sentimentResultState[0];
  const setSentimentResult = sentimentResultState[1];

  const API_BASE_URL = 'http://192.168.1.15:8080/api';

  function getRatingText() {
    if (rating === 0) {
      return 'Tap to rate';
    }
    if (rating === 1) {
      return 'Poor';
    }
    if (rating === 2) {
      return 'Fair';
    }
    if (rating === 3) {
      return 'Good';
    }
    if (rating === 4) {
      return 'Very Good';
    }
    if (rating === 5) {
      return 'Excellent!   ';
    }
  }

  function getSentimentBackgroundColor() {
    if (sentimentResult === null || sentimentResult === undefined) {
      return '#f3e8ff';
    }

    if (sentimentResult.sentiment === 'positive') {
      return '#dcfce7';
    } else if (sentimentResult.sentiment === 'negative') {
      return '#fee2e2';
    } else {
      return '#fef3c7';
    }
  }

  function getSentimentTextColor() {
    if (sentimentResult === null || sentimentResult === undefined) {
      return '#7c3aed';
    }

    if (sentimentResult.sentiment === 'positive') {
      return '#16a34a';
    } else if (sentimentResult.sentiment === 'negative') {
      return '#dc2626';
    } else {
      return '#b45309';
    }
  }

  function getSentimentEmoji() {
    if (sentimentResult === null || sentimentResult === undefined) {
      return '😐';
    }

    if (sentimentResult.sentiment === 'positive') {
      return '😊 Positive';
    } else if (sentimentResult.sentiment === 'negative') {
      return '😞 Negative';
    } else {
      return '😐 Neutral';
    }
  }

  async function handleSubmitRating() {
    // ✅ VALIDATION 1: Check if rating is selected
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating');
      return;
    }

    // ✅ VALIDATION 2: Check review length if provided
    if (review.trim().length > 0 && review.trim().length < 10) {
      Alert.alert('Review Too Short', 'Please write at least 10 characters or leave it empty');
      return;
    }

    setLoading(true);

    try {
      console.log('\n========== SUBMIT RATING ==========');
      console.log('Raw parameters from route:');
      console.log('  userId:', userId, 'type:', typeof userId, 'is null:', userId === null, 'is undefined:', userId === undefined);
      console.log('  businessId:', businessId, 'type:', typeof businessId);
      console.log('  appointmentId:', appointmentId, 'type:', typeof appointmentId);
      console.log('  rating:', rating, 'type:', typeof rating);
      console.log('  review:', review. trim());

      // ✅ STEP 1: Validate parameters exist
      if (userId === null || userId === undefined) {
        const errorMsg = 'userId is ' + (userId === null ? 'null' : 'undefined');
        console.error('❌ VALIDATION FAILED:', errorMsg);
        Alert. alert('Error', 'Missing userId');
        setLoading(false);
        return;
      }

      if (businessId === null || businessId === undefined) {
        console.error('❌ VALIDATION FAILED: businessId is missing');
        Alert.alert('Error', 'Missing businessId');
        setLoading(false);
        return;
      }

      if (appointmentId === null || appointmentId === undefined) {
        console.error('❌ VALIDATION FAILED: appointmentId is missing');
        Alert.alert('Error', 'Missing appointmentId');
        setLoading(false);
        return;
      }

      // ✅ STEP 2: Convert to numbers
      console.log('\n--- Converting to numbers ---');
      const userIdNum = Number(userId);
      const businessIdNum = Number(businessId);
      const appointmentIdNum = Number(appointmentId);
      const ratingNum = Number(rating);

      console.log('After Number() conversion:');
      console.log('  userIdNum:', userIdNum, 'isNaN:', isNaN(userIdNum));
      console.log('  businessIdNum:', businessIdNum, 'isNaN:', isNaN(businessIdNum));
      console.log('  appointmentIdNum:', appointmentIdNum, 'isNaN:', isNaN(appointmentIdNum));
      console.log('  ratingNum:', ratingNum, 'isNaN:', isNaN(ratingNum));

      // ✅ STEP 3: Validate conversions
      if (isNaN(userIdNum)) {
        console.error('❌ CONVERSION FAILED: userIdNum is NaN');
        Alert.alert('Error', 'userId cannot be converted to number');
        setLoading(false);
        return;
      }

      if (isNaN(businessIdNum)) {
        console.error('❌ CONVERSION FAILED: businessIdNum is NaN');
        Alert.alert('Error', 'businessId cannot be converted to number');
        setLoading(false);
        return;
      }

      if (isNaN(appointmentIdNum)) {
        console.error('❌ CONVERSION FAILED: appointmentIdNum is NaN');
        Alert.alert('Error', 'appointmentId cannot be converted to number');
        setLoading(false);
        return;
      }

      // ✅ STEP 4: Build URL
      console.log('\n--- Building URL ---');
      const reviewText = review.trim();
      let url = API_BASE_URL + '/ratings?userId=' + userIdNum + '&businessId=' + businessIdNum + '&appointmentId=' + appointmentIdNum + '&rating=' + ratingNum;

      if (reviewText.length > 0) {
        const encodedReview = encodeURIComponent(reviewText);
        url = url + '&review=' + encodedReview;
      }

      console.log('Final URL:', url);
      console.log('URL length:', url.length);

      // ✅ STEP 5: Make fetch request
      console.log('\n--- Sending POST request ---');
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Response received');
      console.log('  Status:', response.status);
      console.log('  OK:', response.ok);
      console.log('  Headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const responseText = await response.text();
        console.log('✅ SUCCESS - Response text:', responseText);

        let data = null;
        
        if (responseText.length > 0) {
          try {
            data = JSON.parse(responseText);
            console. log('✅ Parsed JSON:', JSON.stringify(data, null, 2));
          } catch (parseError) {
            console.log('⚠️ Could not parse response as JSON');
          }
        }

        if (data && data.sentiment) {
          const sentimentData = {
            sentiment: data. sentiment,
            score: data.sentimentScore,
            confidence: data.sentimentConfidence,
          };
          setSentimentResult(sentimentData);
          
          console.log('🤖 Sentiment detected:', sentimentData);
          
          setTimeout(function() {
            navigation.goBack();
          }, 2000);
          
          return;
        }

        Alert.alert(
          'Thank You!',
          'Your review has been submitted successfully.',
          [
            {
              text: 'OK',
              onPress: function() {
                navigation.goBack();
              },
            },
          ]
        );
      } else {
        const errorText = await response.text();
        console.error('❌ ERROR - Response not OK');
        console.error('  Status:', response.status);
        console.error('  Response text:', errorText);
        
        let errorMessage = 'Failed to submit rating';
        if (errorText && errorText.length > 0) {
          try {
            const errorData = JSON.parse(errorText);
            if (errorData.error) {
              errorMessage = errorData.error;
            } else if (errorData.message) {
              errorMessage = errorData.message;
            }
          } catch (parseError) {
            errorMessage = errorText;
          }
        }
        
        console.error('Final error message:', errorMessage);
        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      console.error('❌ EXCEPTION thrown:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      Alert.alert(
        'Error',
        'Network error: ' + error.message
      );
    } finally {
      setLoading(false);
      console.log('========== END SUBMIT ==========\n');
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 0 }}>
        {/* ========== DEBUG INFO ========== */}
        <View style={{
          backgroundColor: '#fee2e2',
          borderRadius: 12,
          padding: 12,
          marginTop: 12,
          marginBottom: 12,
          borderWidth: 2,
          borderColor: '#dc2626'
        }}>
          <Text style={{ fontSize: 12, color: '#991b1b', fontWeight: '700', marginBottom: 8 }}>
            🔴 PARAMETER DEBUG:
          </Text>
          <Text style={{ fontSize: 10, color: '#991b1b', fontFamily: 'monospace', marginBottom: 4 }}>
            userId: {userId === undefined ? '❌ undefined' : userId === null ? '❌ null' : userId}
          </Text>
          <Text style={{ fontSize: 10, color: '#991b1b', fontFamily: 'monospace', marginBottom: 4 }}>
            businessId: {businessId === undefined ? '❌ undefined' : businessId === null ? '❌ null' : businessId}
          </Text>
          <Text style={{ fontSize: 10, color: '#991b1b', fontFamily: 'monospace', marginBottom: 4 }}>
            appointmentId: {appointmentId === undefined ? '❌ undefined' : appointmentId === null ? '❌ null' : appointmentId}
          </Text>
          <Text style={{ fontSize: 10, color: '#991b1b', fontFamily: 'monospace' }}>
            businessName: {businessName === undefined ?  '❌ undefined' : businessName === null ? '❌ null' : businessName}
          </Text>
        </View>

        {/* Header */}
        <Text style={{
          fontSize: 28,
          fontWeight: '800',
          color: '#111827',
          textAlign: 'center',
          marginBottom: 8,
          marginTop: 40
        }}>
          Rate Your Experience
        </Text>
        <Text style={{
          fontSize: 16,
          color: '#9ca3af',
          textAlign: 'center',
          marginBottom: 32
        }}>
          {businessName || 'Business'}
        </Text>

        {/* Star Rating Section */}
        <View style={{
          backgroundColor: '#ffffff',
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3
        }}>
          <Text style={{
            fontSize: 15,
            fontWeight: '600',
            color: '#6b7280',
            marginBottom: 16
          }}>
            How was your experience?
          </Text>
          
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            {[1, 2, 3, 4, 5].map(function(star) {
              const isSelected = star <= rating;
              return (
                <TouchableOpacity
                  key={star}
                  onPress={function() { setRating(star); }}
                  style={{ padding: 4 }}
                >
                  <Text style={{ fontSize: 40 }}>
                    {isSelected ? '⭐' : '☆'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: '#7c3aed',
            marginTop: 8
          }}>
            {getRatingText()}
          </Text>
        </View>

        {/* Review Text Section */}
        <View style={{
          backgroundColor: '#ffffff',
          borderRadius: 16,
          padding: 16,
          marginBottom: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3
        }}>
          <Text style={{
            fontSize: 14,
            fontWeight: '600',
            color: '#6b7280',
            marginBottom: 12
          }}>
            Write a review (optional)
          </Text>
          
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: '#e5e7eb',
              borderRadius: 8,
              padding: 12,
              fontSize: 14,
              minHeight: 120,
              color: '#111827',
              textAlignVertical: 'top'
            }}
            placeholder="Share your experience..."
            placeholderTextColor="#d1d5db"
            multiline={true}
            numberOfLines={6}
            value={review}
            onChangeText={setReview}
            maxLength={500}
          />
          
          <Text style={{
            fontSize: 11,
            color: '#9ca3af',
            textAlign: 'right',
            marginTop: 8
          }}>
            {review.length}/500
          </Text>
        </View>

        {/* Sentiment Analysis Result */}
        {sentimentResult ?   (
          <View style={{
            backgroundColor: '#ffffff',
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3
          }}>
            <Text style={{
              fontSize: 14,
              fontWeight: '600',
              color: '#6b7280',
              marginBottom: 12
            }}>
              🤖 Sentiment Analysis
            </Text>
            
            <View style={{
              backgroundColor: getSentimentBackgroundColor(),
              borderRadius: 12,
              padding: 16,
              alignItems: 'center'
            }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '700',
                color: getSentimentTextColor(),
                marginBottom: 12
              }}>
                {getSentimentEmoji()}
              </Text>
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-around', width: '100%' }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{
                    fontSize: 11,
                    color: '#6b7280',
                    marginBottom: 4
                  }}>
                    Score
                  </Text>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '700',
                    color: getSentimentTextColor()
                  }}>
                    {Math.round(sentimentResult.score * 100)}%
                  </Text>
                </View>

                <View style={{ alignItems: 'center' }}>
                  <Text style={{
                    fontSize: 11,
                    color: '#6b7280',
                    marginBottom: 4
                  }}>
                    Confidence
                  </Text>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '700',
                    color: getSentimentTextColor()
                  }}>
                    {Math.round(sentimentResult.confidence * 100)}%
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ) : null}

        {/* Submit Button */}
        <TouchableOpacity
          style={{
            backgroundColor: '#7c3aed',
            borderRadius: 12,
            paddingVertical: 14,
            alignItems: 'center',
            marginBottom: 12,
            shadowColor: '#7c3aed',
            shadowOpacity: 0.3,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
            elevation: 5
          }}
          onPress={handleSubmitRating}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{
              color: '#ffffff',
              fontSize: 16,
              fontWeight: '700'
            }}>
              Submit Rating
            </Text>
          )}
        </TouchableOpacity>

        {/* Cancel Button */}
        <TouchableOpacity
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 12,
            paddingVertical: 14,
            alignItems: 'center',
            marginBottom: 32,
            borderWidth: 1,
            borderColor: '#e5e7eb'
          }}
          onPress={function() { navigation.goBack(); }}
          disabled={loading}
        >
          <Text style={{
            color: '#6b7280',
            fontSize: 16,
            fontWeight: '600'
          }}>
            Cancel
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default RateBusinessScreen;