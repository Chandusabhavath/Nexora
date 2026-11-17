import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { apiRequestOtp, apiVerifyOtp, apiVerify2FALogin } from '../api/client.js';
import { EmailOtpAuth } from '../components/EmailOtpAuth.jsx';
import { Mail, Lock, Phone, ArrowRight, ArrowLeft, ShieldCheck, Sparkles, KeyRound, ShieldAlert, RefreshCw } from 'lucide-react';

export const LoginPage = () => {
  const { login, complete2FALogin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const initialMethod = searchParams.get('method') || 'email_otp';

  const [authMethod, setAuthMethod] = useState(initialMethod); // 'email_otp' | 'password' | 'otp'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Google Authenticator (TOTP 2FA) State
  const [twoFactorRequired, setTwoFactorRequired] = useState(
    () => !!sessionStorage.getItem('nexora_2fa_token')
  );
  const [twoFactorToken, setTwoFactorToken] = useState(
    () => sessionStorage.getItem('nexora_2fa_token') || ''
  );
  const [twoFactorUser, setTwoFactorUser] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('nexora_2fa_user')) || null;
    } catch {
      return null;
    }
  });
  const [totpDigits, setTotpDigits] = useState(['', '', '', '', '', '']);
  const totpInputRefs = useRef([]);
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [twoFactorError, setTwoFactorError] = useState('');
  
  // Phone OTP state
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [debugOtp, setDebugOtp] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    setError('');
    window.location.href = '/api/auth/google';
  };

  const handleAppleLogin = () => {
    setAppleLoading(true);
    setError('');
    window.location.href = '/api/auth/apple';
  };

  // Auto-focus first box when 2FA screen is displayed
  useEffect(() => {
    if (twoFactorRequired && totpInputRefs.current[0]) {
      setTimeout(() => {
        totpInputRefs.current[0]?.focus();
      }, 100);
    }
  }, [twoFactorRequired, useRecoveryCode]);

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await login(email, password);

      // Check if 2FA (Google Authenticator) is required
      if (res.twoFactorRequired) {
        setTwoFactorRequired(true);
        setTwoFactorToken(res.twoFactorToken);
        setTwoFactorUser(res.user);
        sessionStorage.setItem('nexora_2fa_token', res.twoFactorToken);
        sessionStorage.setItem('nexora_2fa_user', JSON.stringify(res.user));
        return;
      }

      if (res.success && res.user) {
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

  const handleVerify2FA = async (codeToVerify, isRecovery = false) => {
    const code = isRecovery ? recoveryCode.trim() : (codeToVerify || totpDigits.join(''));
    if (!code) {
      setTwoFactorError(isRecovery ? 'Please enter your recovery code.' : 'Please enter all 6 digits.');
      return;
    }

    if (!isRecovery && code.length !== 6) {
      setTwoFactorError('Please enter all 6 digits from Google Authenticator.');
      return;
    }

    setTwoFactorLoading(true);
    setTwoFactorError('');

    try {
      const res = await apiVerify2FALogin(twoFactorToken, code, isRecovery);
      if (res.success && res.token) {
        sessionStorage.removeItem('nexora_2fa_token');
        sessionStorage.removeItem('nexora_2fa_user');
        complete2FALogin(res);
        if (res.user.role === 'admin') navigate('/admin');
        else if (res.user.role === 'provider') navigate('/provider/dashboard');
        else navigate(redirect === 'booking' ? -1 : '/dashboard');
      } else {
        setTwoFactorError(res.message || 'Invalid authentication code.');
      }
    } catch (err) {
      setTwoFactorError(err.message || 'Verification failed. Please check the code and try again.');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const cancel2FA = () => {
    sessionStorage.removeItem('nexora_2fa_token');
    sessionStorage.removeItem('nexora_2fa_user');
    setTwoFactorRequired(false);
    setTwoFactorToken('');
    setTwoFactorUser(null);
    setTotpDigits(['', '', '', '', '', '']);
    setTwoFactorError('');
  };

  const handleTotpDigitChange = (index, value) => {
    const clean = value.replace(/\D/g, '');
    if (clean.length > 1) {
      const pasted = clean.slice(0, 6).split('');
      const newDigits = [...totpDigits];
      pasted.forEach((d, i) => { if (i < 6) newDigits[i] = d; });
      setTotpDigits(newDigits);
      const focusTarget = Math.min(pasted.length, 5);
      totpInputRefs.current[focusTarget]?.focus();
      if (pasted.length === 6) {
        handleVerify2FA(newDigits.join(''), false);
      }
      return;
    }

    const newDigits = [...totpDigits];
    newDigits[index] = clean;
    setTotpDigits(newDigits);
    setTwoFactorError('');

    if (clean && index < 5) {
      totpInputRefs.current[index + 1]?.focus();
    }

    if (newDigits.join('').length === 6) {
      handleVerify2FA(newDigits.join(''), false);
    }
  };

  const handleTotpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!totpDigits[index] && index > 0) {
        const newDigits = [...totpDigits];
        newDigits[index - 1] = '';
        setTotpDigits(newDigits);
        totpInputRefs.current[index - 1]?.focus();
      } else {
        const newDigits = [...totpDigits];
        newDigits[index] = '';
        setTotpDigits(newDigits);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      totpInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      totpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleTotpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const digits = pasted.split('');
    const newDigits = ['', '', '', '', '', ''];
    digits.forEach((d, i) => { newDigits[i] = d; });
    setTotpDigits(newDigits);
    totpInputRefs.current[Math.min(digits.length, 5)]?.focus();
    if (digits.length === 6) {
      handleVerify2FA(pasted, false);
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
        
        {twoFactorRequired ? (
          <div className="space-y-6 animate-fadeIn">
            {/* 2FA Header */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-emerald-50 text-forest-800 rounded-2xl flex items-center justify-center mx-auto border-2 border-forest-800 shadow-sm">
                <ShieldAlert className="w-7 h-7 text-forest-800" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Two-Factor Authentication</h2>
              <p className="text-xs text-gray-500 leading-relaxed">
                Enter the 6-digit verification code from your <strong className="text-gray-800">Google Authenticator</strong> app for <span className="font-semibold text-forest-900">{twoFactorUser?.email || email}</span>.
              </p>
            </div>

            {/* Error Message */}
            {twoFactorError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 animate-fadeIn font-medium">
                {twoFactorError}
              </div>
            )}

            {!useRecoveryCode ? (
              /* 6-Digit TOTP Input Boxes */
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold uppercase text-gray-700 tracking-wider">
                      6-Digit Authenticator Code
                    </label>
                    <span className="text-[11px] text-gray-400">30s time-step</span>
                  </div>

                  <div className="flex justify-between gap-2" onPaste={handleTotpPaste}>
                    {totpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => (totpInputRefs.current[idx] = el)}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        disabled={twoFactorLoading}
                        onChange={(e) => handleTotpDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleTotpKeyDown(idx, e)}
                        className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-black font-mono rounded-xl border-2 transition-all outline-none ${
                          twoFactorError
                            ? 'border-rose-400 bg-rose-50/40 text-rose-900 focus:border-rose-600 focus:ring-2 focus:ring-rose-200'
                            : digit
                            ? 'border-forest-800 bg-forest-50/20 text-forest-950 ring-1 ring-forest-800'
                            : 'border-surface-200 bg-white text-gray-900 focus:border-forest-800 focus:ring-2 focus:ring-forest-100'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={twoFactorLoading || totpDigits.join('').length < 6}
                  onClick={() => handleVerify2FA()}
                  className="w-full bg-forest-800 hover:bg-forest-900 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-xs transition-all shadow-md flex items-center justify-center space-x-2"
                >
                  {twoFactorLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying with Authenticator...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>Verify & Complete Login</span>
                    </>
                  )}
                </button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => { setUseRecoveryCode(true); setTwoFactorError(''); }}
                    className="text-xs text-forest-800 font-semibold hover:underline"
                  >
                    Lost device? Use a backup recovery code
                  </button>
                </div>
              </div>
            ) : (
              /* Recovery Code Alternative */
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 tracking-wider mb-1.5">
                    Backup Recovery Code
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={recoveryCode}
                    onChange={(e) => setRecoveryCode(e.target.value)}
                    placeholder="e.g. a1b2-c3d4"
                    className="w-full text-center text-sm font-mono tracking-widest py-3 px-4 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-forest-800"
                  />
                  <p className="text-[11px] text-gray-400 mt-1.5 text-center">
                    Enter one of your 8 single-use recovery codes generated when setting up 2FA.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={twoFactorLoading || !recoveryCode.trim()}
                  onClick={() => handleVerify2FA(recoveryCode, true)}
                  className="w-full bg-forest-800 hover:bg-forest-900 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-xs transition-all shadow-md flex items-center justify-center space-x-2"
                >
                  {twoFactorLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying Recovery Code...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Verify Backup Code</span>
                    </>
                  )}
                </button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => { setUseRecoveryCode(false); setTwoFactorError(''); }}
                    className="text-xs text-forest-800 font-semibold hover:underline"
                  >
                    Back to Google Authenticator 6-digit code
                  </button>
                </div>
              </div>
            )}

            <div className="border-t border-surface-100 pt-3 text-center">
              <button
                type="button"
                onClick={cancel2FA}
                className="inline-flex items-center space-x-1.5 text-xs text-gray-500 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Cancel and return to sign in</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Brand Header */}
            <div className="text-center space-y-1">
              <div className="w-12 h-12 bg-forest-800 text-white rounded-2xl flex items-center justify-center font-black text-2xl mx-auto shadow-md">
                N
              </div>
              <h2 className="text-2xl font-bold text-gray-900 pt-2">Welcome to NEXORA</h2>
              <p className="text-xs text-gray-500">Sign in to your account</p>
            </div>

        {/* Method Toggle: Email OTP vs Password vs Mobile OTP */}
        <div className="grid grid-cols-3 p-1 bg-surface-100 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setAuthMethod('email_otp'); setError(''); }}
            className={`py-2 rounded-lg transition-colors flex items-center justify-center space-x-1 ${
              authMethod === 'email_otp' ? 'bg-white text-forest-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Sparkles className="w-3 h-3 text-emerald-600 inline" />
            <span>Email OTP</span>
          </button>
          <button
            type="button"
            onClick={() => { setAuthMethod('password'); setError(''); }}
            className={`py-2 rounded-lg transition-colors ${
              authMethod === 'password' ? 'bg-white text-forest-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Password
          </button>
          <button
            type="button"
            onClick={() => { setAuthMethod('otp'); setError(''); }}
            className={`py-2 rounded-lg transition-colors ${
              authMethod === 'otp' ? 'bg-white text-forest-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Mobile SMS
          </button>
        </div>

        {error && authMethod !== 'email_otp' && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
            {error}
          </div>
        )}

        {/* Email OTP Authentication Flow (2-Step Verification) */}
        {authMethod === 'email_otp' && (
          <EmailOtpAuth redirectUrl={redirect === 'booking' ? -1 : '/dashboard'} />
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

            {/* 1-Click Demo Accounts Bar */}
            <div className="pt-3 border-t border-surface-100 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-gray-500 font-semibold">
                <span>⚡ 1-Click Test Accounts</span>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">Ready</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => { setEmail('admin@nexora.com'); setPassword('NexoraAdmin2026!'); }}
                  className="py-1.5 px-2 rounded-lg bg-surface-100 hover:bg-forest-100/70 hover:text-forest-900 border border-surface-200 text-[11px] font-semibold text-gray-700 transition-colors text-center"
                  title="Click to pre-fill Admin credentials"
                >
                  🛡️ Admin
                </button>
                <button
                  type="button"
                  onClick={() => { setEmail('rajesh.electric@example.com'); setPassword('ProviderPass123!'); }}
                  className="py-1.5 px-2 rounded-lg bg-surface-100 hover:bg-forest-100/70 hover:text-forest-900 border border-surface-200 text-[11px] font-semibold text-gray-700 transition-colors text-center"
                  title="Click to pre-fill Provider credentials"
                >
                  ⚡ Provider
                </button>
                <button
                  type="button"
                  onClick={() => { setEmail('aarav@example.com'); setPassword('CustomerPass123!'); }}
                  className="py-1.5 px-2 rounded-lg bg-surface-100 hover:bg-forest-100/70 hover:text-forest-900 border border-surface-200 text-[11px] font-semibold text-gray-700 transition-colors text-center"
                  title="Click to pre-fill Customer credentials"
                >
                  👤 Customer
                </button>
              </div>
            </div>
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
              disabled={googleLoading}
              onClick={handleGoogleLogin}
              className="flex items-center justify-center space-x-2 py-2.5 rounded-xl border border-surface-200 hover:bg-surface-50 text-xs font-semibold text-gray-700 transition-colors disabled:opacity-50 shadow-xs"
            >
              {googleLoading ? (
                <span className="text-gray-500 flex items-center space-x-1.5">
                  <span className="w-3.5 h-3.5 border-2 border-forest-800 border-t-transparent rounded-full animate-spin"></span>
                  <span>Connecting...</span>
                </span>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Google</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={appleLoading}
              onClick={handleAppleLogin}
              className="flex items-center justify-center space-x-2 py-2.5 rounded-xl border border-surface-200 hover:bg-surface-50 text-xs font-semibold text-gray-700 transition-colors disabled:opacity-50 shadow-xs"
            >
              {appleLoading ? (
                <span className="text-gray-500 flex items-center space-x-1.5">
                  <span className="w-3.5 h-3.5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></span>
                  <span>Connecting...</span>
                </span>
              ) : (
                <>
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.89c.64-.78 1.08-1.87.96-2.96-.93.04-2.07.62-2.73 1.4-.58.67-1.1 1.77-.96 2.83 1.05.08 2.09-.49 2.73-1.27z"/>
                  </svg>
                  <span>Apple</span>
                </>
              )}
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
          </>
        )}

      </div>
    </div>
  );
};
