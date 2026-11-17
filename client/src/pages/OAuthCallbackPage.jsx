import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { CheckCircle2, AlertCircle, RefreshCw, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';

export const OAuthCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const token = searchParams.get('token');
  const error = searchParams.get('error');
  const message = searchParams.get('message');
  const provider = searchParams.get('provider') || 'google';
  const providerLabel = provider === 'apple' ? 'Apple' : 'Google';

  const [status, setStatus] = useState('processing'); // 'processing' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleAuth = async () => {
      if (token) {
        try {
          localStorage.setItem('nexora_token', token);
          if (refreshUser) {
            await refreshUser();
          }
          setStatus('success');
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 1200);
        } catch (err) {
          console.error('[OAuthCallback] Failed to initialize session:', err);
          setStatus('error');
          setErrorMessage('Failed to initialize session from received token.');
        }
      } else if (error) {
        setStatus('error');
        setErrorMessage(decodeURIComponent(message || error));
      } else {
        setStatus('error');
        setErrorMessage('No authentication token or authorization code found in callback.');
      }
    };

    handleAuth();
  }, [token, error, message, navigate, refreshUser]);

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white w-full max-w-md rounded-3xl border border-surface-200 shadow-xl p-8 text-center space-y-6 animate-fadeIn">
        
        {/* Brand Icon */}
        <div className="w-12 h-12 bg-forest-800 text-white rounded-2xl flex items-center justify-center font-black text-2xl mx-auto shadow-md">
          N
        </div>

        {/* Status: Processing */}
        {status === 'processing' && (
          <div className="space-y-4">
            <RefreshCw className="w-10 h-10 text-forest-700 animate-spin mx-auto" />
            <h2 className="text-xl font-bold text-gray-900">Verifying {providerLabel} Authentication</h2>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">
              Exchanging authorization credentials and finalizing your secure session...
            </p>
          </div>
        )}

        {/* Status: Success */}
        {status === 'success' && (
          <div className="space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">{providerLabel} Sign-In Successful!</h2>
            <p className="text-xs text-emerald-700 font-medium">
              Welcome to NEXORA. Redirecting you to your dashboard...
            </p>
            <div className="pt-2">
              <Link
                to="/dashboard"
                className="inline-flex items-center space-x-2 text-xs font-bold text-forest-800 hover:underline"
              >
                <span>Click here if not redirected automatically</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Status: Error */}
        {status === 'error' && (
          <div className="space-y-5">
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Authentication Failed</h2>
              <p className="text-xs text-rose-700 mt-2 p-3 bg-rose-50 border border-rose-200 rounded-xl leading-relaxed">
                {errorMessage}
              </p>
            </div>

            {error === 'missing_google_client_id' && (
              <div className="p-3.5 rounded-xl bg-surface-100 border border-surface-200 text-left text-[11px] text-gray-600 space-y-1.5">
                <span className="font-bold text-gray-800 block flex items-center">
                  <ShieldCheck className="w-3.5 h-3.5 text-forest-700 mr-1" />
                  Google Cloud Console Setup Reminder
                </span>
                <p>
                  To enable live Google Sign-In, add <code className="bg-surface-200 px-1 py-0.5 rounded text-gray-800">GOOGLE_CLIENT_ID</code> and <code className="bg-surface-200 px-1 py-0.5 rounded text-gray-800">GOOGLE_CLIENT_SECRET</code> to your Vercel Environment Variables.
                </p>
              </div>
            )}

            <div className="pt-2 flex flex-col space-y-2">
              <Link
                to="/login"
                className="w-full bg-forest-800 hover:bg-forest-900 text-white font-bold py-3 rounded-xl text-xs transition-all shadow-md inline-block text-center"
              >
                Return to Sign In
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default OAuthCallbackPage;
