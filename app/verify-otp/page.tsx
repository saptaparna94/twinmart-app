
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function VerifyOTPPage() {
  const router = useRouter();

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let mounted = true;

    async function checkPhone() {
      const { data } = await supabase.auth.getSession();

      if (!mounted) return;

      if (data.session) {
        router.replace('/');
        return;
      }

      const savedPhone = sessionStorage.getItem('twinmart_phone');

      if (!savedPhone) {
        router.replace('/login');
        return;
      }

      setPhone(savedPhone);
    }

    checkPhone();

    return () => {
      mounted = false;
    };
  }, [router]);

  const handleVerifyOTP = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!phone) {
      setError('Mobile number missing. Please login again.');
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setError('Please enter a valid 6-digit OTP.');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token: otp,
        type: 'sms',
      });

      if (error) throw error;

      if (!data.session) {
        throw new Error('Login session could not be created.');
      }

      sessionStorage.removeItem('twinmart_phone');
      router.replace('/');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'OTP verification failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!phone) return;

    setError('');
    setMessage('');
    setResending(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) throw error;

      setMessage('OTP request submitted successfully.');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to resend OTP.'
      );
    } finally {
      setResending(false);
    }
  };

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
            🔐
          </div>

          <p style={{
            color: '#ff3f6c',
            fontSize: '10px',
            fontWeight: 900,
            letterSpacing: '1.2px',
            margin: '0 0 8px',
            textTransform: 'uppercase',
          }}>
            Account Verification
          </p>

          <h2 style={{
            fontSize: '22px',
            fontWeight: 900,
            margin: '0 0 8px',
          }}>
            Verify your number
          </h2>

          <p style={{
            fontSize: '13px',
            lineHeight: 1.6,
            color: '#7e818c',
            margin: '0 0 26px',
          }}>
            Enter the 6-digit verification code for{' '}
            <strong style={{ color: '#282C3F' }}>{phone}</strong>.
          </p>

          <form onSubmit={handleVerifyOTP}>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: 700,
              marginBottom: '9px',
            }}>
              One-Time Password (OTP)
            </label>

            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
              }
              placeholder="Enter 6-digit OTP"
              maxLength={6}
              required
              style={{
                width: '100%',
                boxSizing: 'border-box',
                border: '1px solid #d4d5d9',
                borderRadius: '7px',
                padding: '15px',
                outline: 'none',
                fontSize: '18px',
                letterSpacing: '8px',
                textAlign: 'center',
                color: '#282C3F',
              }}
            />

            {error && (
              <p style={{
                color: '#d93025',
                fontSize: '12px',
                margin: '10px 0 0',
              }}>
                {error}
              </p>
            )}

            {message && (
              <p style={{
                color: '#03a685',
                fontSize: '12px',
                margin: '10px 0 0',
              }}>
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
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
                opacity: loading || otp.length !== 6 ? 0.65 : 1,
              }}
            >
              {loading ? 'VERIFYING...' : 'VERIFY OTP'}
            </button>

            <button
              type="button"
              onClick={handleResendOTP}
              disabled={resending || !phone}
              style={{
                width: '100%',
                marginTop: '16px',
                background: 'transparent',
                border: 'none',
                color: '#ff3f6c',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              {resending ? 'SENDING...' : 'RESEND OTP'}
            </button>

            <button
              type="button"
              onClick={() => {
                sessionStorage.removeItem('twinmart_phone');
                router.replace('/login');
              }}
              style={{
                width: '100%',
                marginTop: '12px',
                background: 'transparent',
                border: 'none',
                color: '#7e818c',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ← CHANGE MOBILE NUMBER
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
