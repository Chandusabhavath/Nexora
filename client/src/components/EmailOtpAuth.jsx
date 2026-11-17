import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { apiRequestEmailOtp, apiVerifyEmailOtp, apiResendEmailOtp } from '../api/client.js';
import { Mail, ArrowRight, ArrowLeft, RefreshCw, AlertCircle, CheckCircle2, ShieldCheck, KeyRound } from 'lucide-react';

export const EmailOtpAuth = ({ onSuccess, redirectUrl = '/dashboard', compact = false }) => {
  const { loginWithEmailOtp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || redirectUrl;

  // Step 1: 'email' | Step 2: 'otp'
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  
  // 6-digit OTP input boxes state
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);

  // Timers & States
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [remainingAttempts, setRemainingAttempts] = useState(null);
  const [debugCode, setDebugCode] = useState('');
  const [isVerifiedSuccess, setIsVerifiedSuccess] = useState(false);

  // Active countdown timer for Step 2
  useEffect(() => {
    let timer = null;
    if (step === 'otp' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step, countdown]);

  // Auto-focus first OTP box upon transitioning to Step 2
  useEffect(() => {
    if (step === 'otp' && inputRefs.current[0]) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 150);
    }
  }, [step]);

  // Step 1: Submit email to request OTP
  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail || !/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      setError('Please provide a valid email address (e.g., name@example.com).');
      return;
    }

    setLoading(true);

    try {
      const res = await apiRequestEmailOtp(cleanEmail);
      if (res.success) {
        setStep('otp');
        setCountdown(60);
        setCanResend(false);
        setOtpValues(['', '', '', '', '', '']);
        setSuccessMsg(`Verification code sent to ${cleanEmail}`);
        if (res.debugOtp) setDebugCode(res.debugOtp);
      } else {
        setError(res.message || 'Failed to dispatch verification code.');
      }
    } catch (err) {
      setError(err.message || 'Service temporarily unreachable. Please check your network.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (!canResend || resending) return;
    setError('');
    setSuccessMsg('');
    setResending(true);

    try {
      const res = await apiResendEmailOtp(email.toLowerCase().trim());
      if (res.success) {
        setCountdown(60);
        setCanResend(false);
        setOtpValues(['', '', '', '', '', '']);
        setRemainingAttempts(null);
        setSuccessMsg('A fresh verification code has been dispatched to your inbox.');
        if (res.debugOtp) setDebugCode(res.debugOtp);
        inputRefs.current[0]?.focus();
      } else {
        setError(res.message || 'Unable to resend verification code right now.');
      }
    } catch (err) {
      setError(err.message || 'Failed to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  // Handle individual OTP box typing
  const handleOtpChange = (index, value) => {
    // Only accept numeric input
    const cleanVal = value.replace(/\D/g, '');

    // Handle full 6-digit paste into any box
    if (cleanVal.length > 1) {
      const pastedDigits = cleanVal.slice(0, 6).split('');
      const newOtp = [...otpValues];
      pastedDigits.forEach((digit, i) => {
        if (i < 6) newOtp[i] = digit;
      });
      setOtpValues(newOtp);
      const focusTarget = Math.min(pastedDigits.length, 5);
      inputRefs.current[focusTarget]?.focus();

      // If full 6 digits were pasted, trigger auto-submit
      if (pastedDigits.length === 6) {
        triggerVerification(newOtp.join(''));
      }
      return;
    }

    // Single digit input
    const newOtp = [...otpValues];
    newOtp[index] = cleanVal;
    setOtpValues(newOtp);
    setError('');

    // Advance focus to next input
    if (cleanVal && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify if all 6 boxes are filled
    const fullCode = newOtp.join('');
    if (fullCode.length === 6 && !newOtp.includes('')) {
      triggerVerification(fullCode);
    }
  };

  // Handle backspace navigation
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otpValues[index] && index > 0) {
        // Current box is empty, move back and clear previous
        const newOtp = [...otpValues];
        newOtp[index - 1] = '';
        setOtpValues(newOtp);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newOtp = [...otpValues];
        newOtp[index] = '';
        setOtpValues(newOtp);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle paste event directly on input
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const digits = pastedData.split('');
    const newOtp = ['', '', '', '', '', ''];
    digits.forEach((d, i) => {
      newOtp[i] = d;
    });
    setOtpValues(newOtp);

    const targetIdx = Math.min(digits.length, 5);
    inputRefs.current[targetIdx]?.focus();

    if (digits.length === 6) {
      triggerVerification(pastedData);
    }
  };

  // Step 2: Trigger Verification
  const triggerVerification = async (codeToVerify) => {
    const code = codeToVerify || otpValues.join('');
    if (code.length < 6) {
      setError('Please enter all 6 digits of your verification code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await loginWithEmailOtp(email.toLowerCase().trim(), code);
      if (res.success) {
        setIsVerifiedSuccess(true);
        setSuccessMsg('Authentication successful! Welcome to NEXORA.');

        if (onSuccess) {
          onSuccess(res);
        }

        setTimeout(() => {
          if (res.user?.role === 'admin') navigate('/admin');
          else if (res.user?.role === 'provider') navigate('/provider/dashboard');
          else navigate(redirectTarget === 'booking' ? -1 : redirectTarget);
        }, 600);
      } else {
        setError(res.message || 'Invalid or expired verification code.');
        if (res.remainingAttempts !== undefined) {
          setRemainingAttempts(res.remainingAttempts);
        }
      }
    } catch (err) {
      setError(err.message || 'Verification failed. Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = (e) => {
    e.preventDefault();
    triggerVerification();
  };

  return (
    <div className={`w-full ${compact ? '' : 'space-y-6'}`}>
      
      {/* Inline Feedback Alerts */}
      {error && (
        <div className="flex items-start space-x-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block">{error}</span>
            {remainingAttempts !== null && remainingAttempts > 0 && (
              <span className="text-[11px] text-rose-600 mt-0.5 block">
                {remainingAttempts} attempt{remainingAttempts === 1 ? '' : 's'} remaining before this code is invalidated.
              </span>
            )}
          </div>
        </div>
      )}

      {successMsg && !error && (
        <div className="flex items-center space-x-2.5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {/* ================= STEP 1: Email Form ================= */}
      {step === 'email' && (
        <form onSubmit={handleRequestOtp} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-700 tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full text-xs pl-10 pr-3.5 py-3 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-forest-800 focus:border-forest-800 transition-all bg-white"
              />
            </div>
            <p className="text-[11px] text-gray-500 mt-1.5 flex items-center">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 mr-1 inline" />
              Passwordless login — we'll send a 6-digit verification code to your email.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full bg-forest-800 hover:bg-forest-900 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Sending 6-Digit Code...</span>
              </>
            ) : (
              <>
                <span>Continue with Email OTP</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      {/* ================= STEP 2: 6-Digit OTP Form ================= */}
      {step === 'otp' && (
        <form onSubmit={handleVerifySubmit} className="space-y-5 animate-fadeIn">
          
          {/* Header & Change Email */}
          <div className="flex items-center justify-between text-xs pb-1">
            <button
              type="button"
              onClick={() => {
                setStep('email');
                setError('');
                setSuccessMsg('');
              }}
              className="flex items-center space-x-1 text-gray-500 hover:text-forest-900 font-semibold transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <div className="text-right">
              <span className="text-gray-400 text-[11px]">Sent to: </span>
              <span className="font-bold text-gray-900 text-xs truncate max-w-[170px] inline-block align-bottom" title={email}>
                {email}
              </span>
            </div>
          </div>

          {/* 6 Individual Code Boxes */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold uppercase text-gray-700 tracking-wider">
                Enter 6-Digit Code
              </label>
              <span className="text-[11px] text-gray-400">Expires in 5 mins</span>
            </div>

            <div className="flex justify-between gap-2 sm:gap-2.5" onPaste={handlePaste}>
              {otpValues.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  disabled={loading || isVerifiedSuccess}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-black font-mono rounded-xl border-2 transition-all outline-none ${
                    error
                      ? 'border-rose-400 bg-rose-50/40 text-rose-900 focus:border-rose-600 focus:ring-2 focus:ring-rose-200'
                      : digit
                      ? 'border-forest-800 bg-forest-50/20 text-forest-950 ring-1 ring-forest-800'
                      : 'border-surface-200 bg-white text-gray-900 focus:border-forest-800 focus:ring-2 focus:ring-forest-100'
                  }`}
                />
              ))}
            </div>

            {/* Development Mode Quick Autofill Pill */}
            {debugCode && (
              <div className="mt-2.5 p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-center">
                <span className="text-[11px] text-emerald-800">
                  Development Code: <strong className="font-mono text-emerald-950 font-bold">{debugCode}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const digits = debugCode.split('');
                    setOtpValues(digits);
                    triggerVerification(debugCode);
                  }}
                  className="ml-2 text-[10px] font-bold uppercase bg-emerald-700 hover:bg-emerald-800 text-white px-2 py-0.5 rounded-md transition-colors shadow-xs"
                >
                  Auto-Fill
                </button>
              </div>
            )}
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={loading || isVerifiedSuccess || otpValues.join('').length < 6}
            className="w-full bg-forest-800 hover:bg-forest-900 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Verifying Code...</span>
              </>
            ) : isVerifiedSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Authenticated! Redirecting...</span>
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>Verify & Sign In</span>
              </>
            )}
          </button>

          {/* Countdown & Resend Option */}
          <div className="text-center pt-1 border-t border-surface-100">
            {countdown > 0 ? (
              <p className="text-xs text-gray-500">
                Resend code available in{' '}
                <span className="font-mono font-bold text-forest-900">
                  00:{countdown < 10 ? `0${countdown}` : countdown}
                </span>
              </p>
            ) : (
              <div className="flex items-center justify-center space-x-1.5 text-xs">
                <span className="text-gray-500">Didn't receive the email?</span>
                <button
                  type="button"
                  disabled={resending}
                  onClick={handleResendOtp}
                  className="font-bold text-forest-800 hover:text-forest-950 hover:underline transition-colors flex items-center space-x-1 disabled:opacity-50"
                >
                  {resending && <RefreshCw className="w-3 h-3 animate-spin mr-1" />}
                  <span>Resend Code</span>
                </button>
              </div>
            )}
          </div>

        </form>
      )}

    </div>
  );
};

export default EmailOtpAuth;
