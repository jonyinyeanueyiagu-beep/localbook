import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../common/LoadingSpinner';

function BusinessRatingsScreen() {
  const authContext = useAuth();
  const user = authContext.user;
  const token = authContext.token;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ratings, setRatings] = useState([]);
  const [stats, setStats] = useState({
    averageRating: 0,
    totalRatings: 0,
  });

  const API_BASE_URL = 'http://192.168.1.15:8080/api';

  useEffect(function() {
    fetchRatings();
  }, []);

  async function fetchRatings() {
    try {
      console.log('=== FETCHING RATINGS ===');
      console.log('User:', user);
      console.log('Token:', token);

      if (!user) {
        console.error('No user found');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      let businessId = null;
      if (user.businessId) {
        businessId = user.businessId;
      } else if (user.id && user.role === 'BUSINESS_OWNER') {
        businessId = user.id;
      }

      console.log('Business ID:', businessId);

      if (! businessId) {
        console. error('No business ID found');
        Alert.alert('Error', 'No business found for this account');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const endpoints = [
        API_BASE_URL + '/ratings/business/' + businessId,
        API_BASE_URL + '/businesses/' + businessId + '/ratings',
        API_BASE_URL + '/reviews/business/' + businessId,
      ];

      let success = false;
      
      for (let i = 0; i < endpoints. length; i++) {
        const url = endpoints[i];
        console.log('Trying endpoint:', url);

        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Authorization': 'Bearer ' + token,
              'Content-Type': 'application/json',
            },
          });

          console.log('Response status:', response. status);

          if (response.ok) {
            const data = await response.json();
            console.log('Response data:', data);

            let ratingsData = [];
            let avgRating = 0;
            let totalCount = 0;

            if (data.ratings) {
              ratingsData = data.ratings;
              avgRating = data.averageRating || 0;
              totalCount = data.totalRatings || ratingsData.length;
            }
            else if (Array.isArray(data)) {
              ratingsData = data;
              totalCount = data.length;
              
              if (data.length > 0) {
                const sum = data.reduce(function(acc, r) {
                  return acc + (r.rating || 0);
                }, 0);
                avgRating = sum / data.length;
              }
            }
            else if (data.data) {
              ratingsData = data.data;
              totalCount = data.data.length;
              
              if (data.data.length > 0) {
                const sum = data.data. reduce(function(acc, r) {
                  return acc + (r.rating || 0);
                }, 0);
                avgRating = sum / data.data.length;
              }
            }

            console.log('Processed ratings:', ratingsData);
            console.log('Average rating:', avgRating);
            console.log('Total count:', totalCount);

            setRatings(ratingsData);
            setStats({
              averageRating: avgRating,
              totalRatings: totalCount,
            });

            success = true;
            break;
          } else {
            const errorText = await response.text();
            console.error('Endpoint failed:', url, 'Error:', errorText);
          }
        } catch (endpointError) {
          console.error('Error with endpoint:', url, endpointError);
        }
      }

      if (!success) {
        console.warn('All endpoints failed, using empty state');
        setRatings([]);
        setStats({
          averageRating: 0,
          totalRatings: 0,
        });
      }

    } catch (error) {
      console.error('Error fetching ratings:', error);
      Alert.alert('Error', 'Failed to load ratings.  Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function onRefresh() {
    setRefreshing(true);
    fetchRatings();
  }

  function renderStars(rating) {
    const stars = [];
    const roundedRating = Math.round(rating);
    
    let i = 1;
    while (i <= 5) {
      if (i <= roundedRating) {
        stars.push(
          <Text key={i} style={{ fontSize: 24 }}>⭐</Text>
        );
      } else {
        stars.push(
          <Text key={i} style={{ fontSize: 24, color: '#d1d5db' }}>☆</Text>
        );
      }
      i = i + 1;
    }
    
    return stars;
  }

  function renderSentimentBadge(sentiment) {
    if (sentiment === null || sentiment === undefined) {
      return null;
    }

    let backgroundColor = '#fef3c7';
    let textColor = '#b45309';
    let emoji = '😐';
    let label = 'Neutral';

    if (sentiment === 'positive') {
      backgroundColor = '#dcfce7';
      textColor = '#16a34a';
      emoji = '😊';
      label = 'Positive';
    } else if (sentiment === 'negative') {
      backgroundColor = '#fee2e2';
      textColor = '#dc2626';
      emoji = '😞';
      label = 'Negative';
    }

    return (
      <View style={{
        backgroundColor: backgroundColor,
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 4,
        marginTop: 8,
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
      }}>
        <Text style={{ marginRight: 4, fontSize: 14 }}>
          {emoji}
        </Text>
        <Text style={{
          fontSize: 11,
          fontWeight: '700',
          color: textColor,
        }}>
          {label}
        </Text>
      </View>
    );
  }

  function renderEmotionBreakdown(rating) {
    const hasEmotionData = rating.emotionJoy !== null && 
                          rating.emotionJoy !== undefined;
    
    if (hasEmotionData === false) {
      return null;
    }

    return (
      <View style={{
        marginTop: 12,
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        padding: 12,
      }}>
        <Text style={{
          fontSize: 12,
          color: '#6b7280',
          marginBottom: 12,
          fontWeight: '700',
        }}>
          📊 Emotions Detected
        </Text>

        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}>
          {/* JOY */}
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={{ fontSize: 24, marginBottom: 4 }}>😊</Text>
            <Text style={{
              fontSize: 12,
              fontWeight: '700',
              color: '#10b981',
              marginBottom: 2,
            }}>
              {Math.round(rating.emotionJoy * 100)}%
            </Text>
            <Text style={{
              fontSize: 10,
              color: '#6b7280',
              textAlign: 'center',
            }}>
              Joy
            </Text>
          </View>

          {/* SADNESS */}
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={{ fontSize: 24, marginBottom: 4 }}>😢</Text>
            <Text style={{
              fontSize: 12,
              fontWeight: '700',
              color: '#3b82f6',
              marginBottom: 2,
            }}>
              {Math.round(rating.emotionSadness * 100)}%
            </Text>
            <Text style={{
              fontSize: 10,
              color: '#6b7280',
              textAlign: 'center',
            }}>
              Sadness
            </Text>
          </View>

          {/* ANGER */}
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={{ fontSize: 24, marginBottom: 4 }}>😠</Text>
            <Text style={{
              fontSize: 12,
              fontWeight: '700',
              color: '#ef4444',
              marginBottom: 2,
            }}>
              {Math.round(rating. emotionAnger * 100)}%
            </Text>
            <Text style={{
              fontSize: 10,
              color: '#6b7280',
              textAlign: 'center',
            }}>
              Anger
            </Text>
          </View>

          {/* FEAR */}
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={{ fontSize: 24, marginBottom: 4 }}>😨</Text>
            <Text style={{
              fontSize: 12,
              fontWeight: '700',
              color: '#f97316',
              marginBottom: 2,
            }}>
              {Math.round(rating.emotionFear * 100)}%
            </Text>
            <Text style={{
              fontSize: 10,
              color: '#6b7280',
              textAlign: 'center',
            }}>
              Fear
            </Text>
          </View>

          {/* DISGUST */}
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={{ fontSize: 24, marginBottom: 4 }}>🤢</Text>
            <Text style={{
              fontSize: 12,
              fontWeight: '700',
              color: '#8b5cf6',
              marginBottom: 2,
            }}>
              {Math.round(rating.emotionDisgust * 100)}%
            </Text>
            <Text style={{
              fontSize: 10,
              color: '#6b7280',
              textAlign: 'center',
            }}>
              Disgust
            </Text>
          </View>
        </View>
      </View>
    );
  }

  function renderSentimentMetrics(rating) {
    const hasSentimentScore = rating.sentimentScore !== null && 
                             rating.sentimentScore !== undefined;
    
    if (hasSentimentScore === false) {
      return null;
    }

    return (
      <View style={{
        marginTop: 12,
        flexDirection: 'row',
        gap: 8,
      }}>
        {/* SCORE */}
        <View style={{
          flex: 1,
          backgroundColor: '#ffffff',
          borderRadius: 8,
          paddingHorizontal: 8,
          paddingVertical: 8,
          borderWidth: 1,
          borderColor: '#e5e7eb',
        }}>
          <Text style={{
            fontSize: 11,
            color: '#6b7280',
            fontWeight: '700',
          }}>
            Score
          </Text>
          <Text style={{
            fontSize: 12,
            fontWeight: '700',
            color: '#7c3aed',
            marginTop: 4,
          }}>
            {Math.round(rating.sentimentScore * 100)}%
          </Text>
        </View>

        {/* CONFIDENCE */}
        <View style={{
          flex: 1,
          backgroundColor: '#ffffff',
          borderRadius: 8,
          paddingHorizontal: 8,
          paddingVertical: 8,
          borderWidth: 1,
          borderColor: '#e5e7eb',
        }}>
          <Text style={{
            fontSize: 11,
            color: '#6b7280',
            fontWeight: '700',
          }}>
            Confidence
          </Text>
          <Text style={{
            fontSize: 12,
            fontWeight: '700',
            color: '#a855f7',
            marginTop: 4,
          }}>
            {Math.round(rating. sentimentConfidence * 100)}%
          </Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return <LoadingSpinner fullScreen={true} text="Loading ratings..." />;
  }

  return (
    <ScrollView 
      style={{ flex: 1, backgroundColor: '#f9fafb' }}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh}
          tintColor="#7c3aed"
          colors={['#7c3aed']}
        />
      }
    >
      {/* ========== HEADER ========== */}
      <View style={{ 
        backgroundColor: '#7c3aed', 
        paddingTop: 56, 
        paddingBottom: 24, 
        paddingHorizontal: 20 
      }}>
        <Text style={{ 
          color: '#ffffff', 
          fontSize: 24, 
          fontWeight: '700', 
          marginBottom: 4 
        }}>
          ⭐ Customer Ratings
        </Text>
        <Text style={{ color: '#e9d5ff', fontSize: 16 }}>
          See what your customers are saying
        </Text>
      </View>

      {/* ========== STATS CARD ========== */}
      <View style={{ 
        paddingHorizontal: 20, 
        marginTop: -20, 
        marginBottom: 16 
      }}>
        <View style={{ 
          backgroundColor: '#ffffff', 
          borderRadius: 16, 
          padding: 20, 
          shadowColor: '#000', 
          shadowOpacity: 0.1,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 }
        }}>
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <Text style={{ 
              fontSize: 56, 
              fontWeight: '700', 
              color: '#a855f7', 
              marginRight: 16 
            }}>
              {stats.averageRating.toFixed(1)}
            </Text>
            <View>
              <View style={{ 
                flexDirection: 'row', 
                gap: 4, 
                marginBottom: 8 
              }}>
                {renderStars(stats.averageRating)}
              </View>
              <Text style={{ 
                fontSize: 14, 
                color: '#6b7280', 
                textAlign: 'center' 
              }}>
                {stats. totalRatings} {stats.totalRatings === 1 ? 'rating' : 'ratings'}
              </Text>
            </View>
          </View>

          {stats.totalRatings > 0 && (
            <View style={{ 
              marginTop: 16, 
              paddingTop: 16, 
              borderTopWidth: 1, 
              borderTopColor: '#f3f4f6' 
            }}>
              <Text style={{ 
                fontSize: 12, 
                color: '#9ca3af', 
                textAlign: 'center' 
              }}>
                Based on {stats.totalRatings} customer {stats.totalRatings === 1 ? 'review' : 'reviews'}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* ========== RATINGS LIST ========== */}
      <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
        <Text style={{ 
          fontSize: 18, 
          fontWeight: '700', 
          color: '#111827', 
          marginBottom: 12 
        }}>
          All Reviews
        </Text>

        {ratings.length === 0 ? (
          <View style={{ 
            backgroundColor: '#ffffff', 
            borderRadius: 16, 
            padding: 32, 
            alignItems: 'center',
            shadowColor: '#000',
            shadowOpacity: 0.05,
            shadowRadius: 4
          }}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>📝</Text>
            <Text style={{ 
              color: '#6b7280', 
              fontWeight: '600', 
              textAlign: 'center',
              fontSize: 16,
              marginBottom: 8
            }}>
              No ratings yet
            </Text>
            <Text style={{ 
              color: '#9ca3af', 
              fontSize: 14, 
              textAlign: 'center',
              lineHeight: 20
            }}>
              Ratings will appear here after customers review your services
            </Text>
          </View>
        ) : (
          ratings.map(function(rating, index) {
            let userName = 'Anonymous';
            if (rating.userName) {
              userName = rating. userName;
            } else if (rating.user && rating.user.name) {
              userName = rating.user.name;
            } else if (rating.clientName) {
              userName = rating.clientName;
            }

            let ratingValue = rating.rating || rating.stars || 0;
            let reviewText = rating.review || rating.comment || rating.feedback || '';
            let dateText = '';
            
            if (rating.createdAt) {
              const date = new Date(rating.createdAt);
              dateText = date.toLocaleDateString('en-IE', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              });
            }

            return (
              <View 
                key={rating.id || index}
                style={{ 
                  backgroundColor: '#ffffff', 
                  borderRadius: 16, 
                  padding: 16, 
                  shadowColor: '#000', 
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  shadowOffset: { width: 0, height: 2 },
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: '#f3f4f6'
                }}
              >
                {/* ========== HEADER ========== */}
                <View style={{ 
                  flexDirection: 'row', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginBottom: 12
                }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ 
                      fontSize: 16, 
                      fontWeight: '700', 
                      color: '#111827' 
                    }}>
                      {userName}
                    </Text>
                    {dateText && (
                      <Text style={{ 
                        fontSize: 12, 
                        color: '#9ca3af', 
                        marginTop: 2 
                      }}>
                        {dateText}
                      </Text>
                    )}
                  </View>

                  {/* RATING STARS */}
                  <View style={{ 
                    flexDirection: 'row', 
                    alignItems: 'center',
                    backgroundColor: '#faf5ff',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 20
                  }}>
                    <Text style={{ 
                      fontSize: 18, 
                      fontWeight: '700', 
                      color: '#a855f7', 
                      marginRight: 4 
                    }}>
                      {ratingValue}
                    </Text>
                    <Text style={{ fontSize: 16 }}>⭐</Text>
                  </View>
                </View>

                {/* ========== REVIEW TEXT ========== */}
                {reviewText && (
                  <View style={{ 
                    backgroundColor: '#f9fafb',
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 12
                  }}>
                    <Text style={{ 
                      fontSize: 14, 
                      color: '#4b5563',
                      lineHeight: 20
                    }}>
                      "{reviewText}"
                    </Text>
                  </View>
                )}

                {/* ========== SENTIMENT BADGE ========== */}
                {rating.sentiment && (
                  <View style={{ marginBottom: 12 }}>
                    {renderSentimentBadge(rating.sentiment)}
                  </View>
                )}

                {/* ========== SENTIMENT METRICS ========== */}
                {renderSentimentMetrics(rating)}

                {/* ========== EMOTION BREAKDOWN ========== */}
                {renderEmotionBreakdown(rating)}

                {/* ========== SERVICE NAME ========== */}
                {rating.serviceName && (
                  <View style={{ 
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginTop: 12,
                    paddingTop: 12,
                    borderTopWidth: 1,
                    borderTopColor: '#e5e7eb'
                  }}>
                    <Text style={{ fontSize: 14, marginRight: 8 }}>📋</Text>
                    <Text style={{ 
                      fontSize: 13, 
                      color: '#6b7280',
                      fontWeight: '600'
                    }}>
                      {rating. serviceName}
                    </Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </View>

      {/* ========== DEBUG INFO ========== */}
      {__DEV__ && (
        <View style={{ 
          paddingHorizontal: 20, 
          marginBottom: 24 
        }}>
          <View style={{ 
            backgroundColor: '#fef3c7',
            borderRadius: 8,
            padding: 12,
            borderWidth: 1,
            borderColor: '#fbbf24'
          }}>
            <Text style={{ 
              fontSize: 12, 
              color: '#92400e',
              fontWeight: '600',
              marginBottom: 4
            }}>
              Debug Info:
            </Text>
            <Text style={{ fontSize: 11, color: '#92400e' }}>
              User ID: {user ?  user.id : 'none'}
            </Text>
            <Text style={{ fontSize: 11, color: '#92400e' }}>
              Business ID: {user ? (user.businessId || user.id) : 'none'}
            </Text>
            <Text style={{ fontSize: 11, color: '#92400e' }}>
              Ratings count: {ratings.length}
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

export default BusinessRatingsScreen;