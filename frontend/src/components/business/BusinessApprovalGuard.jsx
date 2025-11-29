import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

function BusinessApprovalGuard(props) {
  const children = props.children;
  const authContext = useAuth();
  const user = authContext.user;
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [businessStatus, setBusinessStatus] = useState(null);

  useEffect(function() {
    checkBusinessStatus();
  }, []);

  async function checkBusinessStatus() {
    try {
      const hasUser = user !== null && user !== undefined;
      if (hasUser === false) {
        console.log('No user found');
        setLoading(false);
        return;
      }

      const userId = user.id;
      const userIdString = userId.toString();
      const url = '/businesses/owner/' + userIdString + '/status';
      
      console.log('🔍 Checking business status:', url);
      
      const response = await api.get(url);
      const data = response.data;
      
      console.log('✅ Business status:', data);
      
      setBusinessStatus(data);
      setLoading(false);
      
    } catch (error) {
      console.error('❌ Error checking business status:', error);
      setLoading(false);
    }
  }

  if (loading === true) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{
          textAlign: 'center'
        }}>
          <div style={{
            width: 64,
            height: 64,
            border: '4px solid #7c3aed',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{
            color: '#6b7280',
            fontSize: 16
          }}>
            Checking business status...
          </p>
        </div>
      </div>
    );
  }

  const hasStatus = businessStatus !== null && businessStatus !== undefined;
  if (hasStatus === false) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#f9fafb',
        padding: 32
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: 16,
          padding: 48,
          maxWidth: 600,
          textAlign: 'center',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            fontSize: 60,
            marginBottom: 16
          }}>⚠️</div>
          <h2 style={{
            fontSize: 24,
            fontWeight: '700',
            color: '#111827',
            marginBottom: 16
          }}>
            Unable to Load Business Status
          </h2>
          <p style={{
            color: '#6b7280',
            marginBottom: 24
          }}>
            Please try refreshing the page or contact support if the problem persists.
          </p>
          <button
            onClick={function() {
              window.location.reload();
            }}
            style={{
              backgroundColor: '#7c3aed',
              color: '#ffffff',
              padding: '12px 24px',
              borderRadius: 8,
              border: 'none',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  const hasBusinesses = businessStatus.hasBusinesses;
  const isApproved = businessStatus.isApproved;
  const status = businessStatus.status;
  const businessName = businessStatus.businessName;
  const message = businessStatus.message;

  // No business registered
  if (hasBusinesses === false) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#f9fafb',
        padding: 32
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: 16,
          padding: 48,
          maxWidth: 600,
          textAlign: 'center',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            fontSize: 60,
            marginBottom: 16
          }}>🏢</div>
          <h2 style={{
            fontSize: 24,
            fontWeight: '700',
            color: '#111827',
            marginBottom: 16
          }}>
            No Business Registered
          </h2>
          <p style={{
            color: '#6b7280',
            marginBottom: 24
          }}>
            You need to register your business before you can access the dashboard.
          </p>
          <button
            onClick={function() {
              navigate('/business/register');
            }}
            style={{
              backgroundColor: '#7c3aed',
              color: '#ffffff',
              padding: '12px 24px',
              borderRadius: 8,
              border: 'none',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: 16
            }}
          >
            Register Your Business
          </button>
        </div>
      </div>
    );
  }

  // Business pending approval
  if (isApproved === false) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#f9fafb',
        padding: 32
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: 16,
          padding: 48,
          maxWidth: 600,
          textAlign: 'center',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            fontSize: 60,
            marginBottom: 16
          }}>⏳</div>
          <h2 style={{
            fontSize: 24,
            fontWeight: '700',
            color: '#111827',
            marginBottom: 16
          }}>
            Business Pending Approval
          </h2>
          <div style={{
            backgroundColor: '#fef3c7',
            border: '1px solid #fcd34d',
            borderRadius: 12,
            padding: 16,
            marginBottom: 24
          }}>
            <p style={{
              fontWeight: '600',
              color: '#92400e',
              marginBottom: 8
            }}>
              {businessName}
            </p>
            <p style={{
              color: '#b45309',
              fontSize: 14
            }}>
              {message}
            </p>
          </div>
          <p style={{
            color: '#6b7280',
            marginBottom: 8
          }}>
            Your business registration is being reviewed by our admin team.
          </p>
          <p style={{
            color: '#6b7280',
            fontSize: 14,
            marginBottom: 24
          }}>
            You will receive an email notification once your business is approved.
            This usually takes 1-2 business days.
          </p>
          <div style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'center'
          }}>
            <button
              onClick={function() {
                checkBusinessStatus();
              }}
              style={{
                backgroundColor: '#7c3aed',
                color: '#ffffff',
                padding: '12px 24px',
                borderRadius: 8,
                border: 'none',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: 16
              }}
            >
              Check Status
            </button>
            <button
              onClick={function() {
                navigate('/');
              }}
              style={{
                backgroundColor: '#e5e7eb',
                color: '#374151',
                padding: '12px 24px',
                borderRadius: 8,
                border: 'none',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: 16
              }}
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Business approved - show content
  return children;
}

export default BusinessApprovalGuard;