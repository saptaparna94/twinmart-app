
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();

  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      const { data } = await supabase.auth.getSession();

      if (!mounted) return;

      if (data.session) {
        router.replace('/');
      } else {
        setChecking(false);
      }
    }

    checkSession();

    return () => {
      mounted = false;
    };
  }, [router]);

  const handleSendOTP = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setError('');

    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    const fullPhone = `+91${phone}`;
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: fullPhone,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) throw error;

      sessionStorage.setItem('twinmart_phone', fullPhone);
      router.push('/verify-otp');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to send OTP. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <main style={{
        minHeight: '100vh',
        background: '#F5F6F8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#282C3F',
        fontFamily: 'sans-serif',
        fontWeight: 700,
      }}>
        Loading TwinMart...
      </main>
    );
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: '#F5F6F8',
      color: '#282C3F',
      fontFamily: 'sans-serif',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <header style={{
        background: '#ffffff',
        padding: '18px 24px',
        borderBottom: '1px solid #eaeaec',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
      }}>
        <h1 style={{
          fontSize: '22px',
          fontWeight: 900,
          margin: 0,
          letterSpacing: '-0.5px',
          textTransform: 'uppercase',
        }}>
          Twin<span style={{ color: '#ff3f6c' }}>Mart</span>
        </h1>
        <p style={{
          fontSize: '8px',
          fontWeight: 700,
          color: '#9496a2',
          letterSpacing: '1px',
          margin: '3px 0 0',
          textTransform: 'uppercase',
        }}>
          Shop Smart, Live Better
        </p>
      </header>

      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '28px 16px',
      }}>
        <div style={{
          width: '100%',
          maxWidth: '420px',
          background: '#ffffff',
          border: '1px solid #eaeaec',
          borderRadius: '12px',
          padding: '28px 24px',
          boxSizing: 'border-box',
          boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
        }}>
          <div style={{
            background: '#fff0f3',
            width: '52px',
            height: '52px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '25px',
            marginBottom: '22px',
          }}>
            🛍️
          </div>

          <p style={{
            color: '#ff3f6c',
            fontSize: '10px',
            fontWeight: 900,
            letterSpacing: '1.2px',
            margin: '0 0 8px',
            textTransform: 'uppercase',
          }}>
            Welcome to TwinMart
          </p>

          <h2 style={{
            fontSize: '22px',
            fontWeight: 900,
            margin: '0 0 8px',
          }}>
            Login or Signup
          </h2>

          <p style={{
            fontSize: '13px',
            lineHeight: 1.6,
            color: '#7e818c',
            margin: '0 0 26px',
          }}>
            Enter your mobile number to access your account and continue shopping.
          </p>

          <form onSubmit={handleSendOTP}>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: 700,
              marginBottom: '9px',
            }}>
              Mobile Number
            </label>

            <div style={{
              display: 'flex',
              border: '1px solid #d4d5d9',
              borderRadius: '7px',
              overflow: 'hidden',
              background: '#ffffff',
            }}>
              <span style={{
                padding: '13px 14px',
                background: '#f5f5f6',
                borderRight: '1px solid #eaeaec',
                fontSize: '13px',
                fontWeight: 700,
              }}>
                +91
              </span>

              <input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
                }
                placeholder="Enter mobile number"
                maxLength={10}
                required
                style={{
                  flex: 1,
                  minWidth: 0,
                  border: 'none',
                  outline: 'none',
                  padding: '13px',
                  fontSize: '13px',
                  color: '#282C3F',
                }}
              />
            </div>

            {error && (
              <p style={{
                color: '#d93025',
                fontSize: '12px',
                margin: '10px 0 0',
              }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                marginTop: '22px',
                background: '#ff3f6c',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '15px',
                fontSize: '13px',
                fontWeight: 900,
                letterSpacing: '0.5px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.65 : 1,
              }}
            >
              {loading ? 'SENDING OTP...' : 'CONTINUE'}
            </button>
          </form>

          <div style={{
            borderTop: '1px solid #f0f0f0',
            marginTop: '24px',
            paddingTop: '18px',
          }}>
            <p style={{
              fontSize: '11px',
              lineHeight: 1.6,
              color: '#9496a2',
              textAlign: 'center',
              margin: 0,
            }}>
              By continuing, you agree to TwinMart's Terms of Use and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
