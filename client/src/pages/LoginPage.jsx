import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { apiRequestOtp, apiVerifyOtp } from '../api/client.js';
import { Mail, Lock, Phone, ArrowRight, ShieldCheck } from 'lucide-react';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const [authMethod, setAuthMethod] = useState('password'); // 'password' | 'otp'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Phone OTP state
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [debugOtp, setDebugOtp] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await login(email, password);
      if (res.success) {
        if (res.user.role === 'admin') navigate('/admin');
        else if (res.user.role === 'provider') navigate('/provider/dashboard');
        else navigate(redirect === 'booking' ? -1 : '/dashboard');
      } else {
        setError(res.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await apiRequestOtp(phone);
      if (res.success) {
        setOtpSent(true);
        if (res.debugOtp) setDebugOtp(res.debugOtp);
      } else {
        setError(res.message || 'Failed to send OTP.');
      }
    } catch (err) {
      setError(err.message || 'SMS service error.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await apiVerifyOtp(phone, otp);
      if (res.success && res.token) {
        localStorage.setItem('nexora_token', res.token);
        window.location.href = '/dashboard';
      } else {
        setError(res.message || 'Invalid verification code.');
      }
    } catch (err) {
      setError(err.message || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white w-full max-w-md rounded-3xl border border-surface-200 shadow-xl p-8 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 bg-forest-800 text-white rounded-2xl flex items-center justify-center font-black text-2xl mx-auto shadow-md">
            N
          </div>
          <h2 className="text-2xl font-bold text-gray-900 pt-2">Welcome to NEXORA</h2>
          <p className="text-xs text-gray-500">Sign in to your account</p>
        </div>

        {/* Method Toggle: Email vs Phone OTP */}
        <div className="grid grid-cols-2 p-1 bg-surface-100 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setAuthMethod('password'); setError(''); }}
            className={`py-2 rounded-lg transition-colors ${
              authMethod === 'password' ? 'bg-white text-forest-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Email & Password
          </button>
          <button
            type="button"
            onClick={() => { setAuthMethod('otp'); setError(''); }}
            className={`py-2 rounded-lg transition-colors ${
              authMethod === 'otp' ? 'bg-white text-forest-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Mobile OTP
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
            {error}
          </div>
        )}

        {/* Email & Password Form */}
        {authMethod === 'password' && (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-forest-800"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold uppercase text-gray-700">Password</label>
                <span className="text-[11px] text-forest-700 font-semibold cursor-pointer hover:underline">
                  Forgot?
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-forest-800"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-forest-800 hover:bg-forest-900 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-xs transition-all shadow-md flex items-center justify-center space-x-2"
            >
              {loading ? <span>Signing in...</span> : <span>Sign In to NEXORA</span>}
            </button>
          </form>
        )}

        {/* Mobile Phone OTP Form */}
        {authMethod === 'otp' && (
          <div className="space-y-4">
            {!otpSent ? (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Mobile Phone Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98200 12345"
                      className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-forest-800"
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">We will send a 6-digit verification code via SMS.</p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-forest-800 hover:bg-forest-900 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-xs transition-all shadow-md"
                >
                  {loading ? 'Sending code...' : 'Send SMS Verification Code'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold uppercase text-gray-700">Enter 6-Digit Code</label>
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="text-[11px] text-forest-700 font-semibold hover:underline"
                    >
                      Change Number
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    className="w-full text-center tracking-widest font-mono text-base py-2.5 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-forest-800"
                  />
                  {debugOtp && (
                    <p className="text-[11px] text-emerald-700 mt-1 font-semibold text-center">
                      Development Test Code: <span className="font-mono">{debugOtp}</span>
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="w-full bg-forest-800 hover:bg-forest-900 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-xs transition-all shadow-md"
                >
                  {loading ? 'Verifying...' : 'Verify & Continue'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Social Logins */}
        <div className="space-y-3 pt-2">
          <div className="relative flex items-center justify-center">
            <div className="border-t border-surface-200 w-full"></div>
            <span className="bg-white px-2 text-[10px] uppercase font-bold text-gray-400">or continue with</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setError('Google Identity verification configured. Click to connect account.')}
              className="flex items-center justify-center space-x-2 py-2.5 rounded-xl border border-surface-200 hover:bg-surface-50 text-xs font-semibold text-gray-700 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Google</span>
            </button>

            <button
              type="button"
              onClick={() => setError('Apple Identity validation configured. Click to connect account.')}
              className="flex items-center justify-center space-x-2 py-2.5 rounded-xl border border-surface-200 hover:bg-surface-50 text-xs font-semibold text-gray-700 transition-colors"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.89c.64-.78 1.08-1.87.96-2.96-.93.04-2.07.62-2.73 1.4-.58.67-1.1 1.77-.96 2.83 1.05.08 2.09-.49 2.73-1.27z"/>
              </svg>
              <span>Apple</span>
            </button>
          </div>
        </div>

        {/* Footer Link */}
        <p className="text-center text-xs text-gray-500 pt-2">
          Don't have an account yet?{' '}
          <Link to="/register" className="font-bold text-forest-800 hover:underline">
            Register here
          </Link>
        </p>

      </div>
    </div>
  );
};
