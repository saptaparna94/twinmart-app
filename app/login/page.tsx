
'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const cleanEmail = email.trim().toLowerCase();

    if (mode === 'signup') {
      if (!name.trim()) {
        setError('Please enter your name.');
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      if (password.length < 6) {
        setError('Password must contain at least 6 characters.');
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name: name.trim(),
            },
          },
        });

        if (error) throw error;

        if (data.session) {
          router.replace('/');
        } else {
          setMessage(
            'Account created. Please check your email if confirmation is required.'
          );
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) throw error;

        router.replace('/');
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again.'
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
            {mode === 'login' ? 'Login to your account' : 'Create your account'}
          </h2>

          <p style={{
            fontSize: '13px',
            lineHeight: 1.6,
            color: '#7e818c',
            margin: '0 0 22px',
          }}>
            {mode === 'login'
              ? 'Enter your email and password to continue shopping.'
              : 'Sign up with your email to start shopping with TwinMart.'}
          </p>

          <form onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 700,
                  marginBottom: '9px',
                }}>
                  Full Name
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  autoComplete="name"
                  required
                  style={inputStyle}
                />
              </>
            )}

            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: 700,
              marginBottom: '9px',
            }}>
              Email Address
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              autoComplete="email"
              required
              style={inputStyle}
            />

            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: 700,
              margin: '17px 0 9px',
            }}>
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete={
                mode === 'login' ? 'current-password' : 'new-password'
              }
              required
              style={inputStyle}
            />

            {mode === 'signup' && (
              <>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 700,
                  margin: '17px 0 9px',
                }}>
                  Confirm Password
                </label>

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  required
                  style={inputStyle}
                />
              </>
            )}

            {error && (
              <p style={{
                color: '#d93025',
                fontSize: '12px',
                margin: '12px 0 0',
              }}>
                {error}
              </p>
            )}

            {message && (
              <p style={{
                color: '#16803c',
                fontSize: '12px',
                margin: '12px 0 0',
              }}>
                {message}
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
              {loading
                ? 'PLEASE WAIT...'
                : mode === 'login'
                  ? 'LOGIN'
                  : 'CREATE ACCOUNT'}
            </button>
          </form>

          <div style={{
            textAlign: 'center',
            marginTop: '22px',
            fontSize: '12px',
            color: '#7e818c',
          }}>
            {mode === 'login'
              ? "Don't have an account? "
              : 'Already have an account? '}

            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setError('');
                setMessage('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#ff3f6c',
                fontWeight: 900,
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              {mode === 'login' ? 'Sign Up' : 'Login'}
            </button>
          </div>

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

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  border: '1px solid #d4d5d9',
  borderRadius: '7px',
  padding: '13px',
  fontSize: '13px',
  color: '#282C3F',
  outline: 'none',
  background: '#ffffff',
};
