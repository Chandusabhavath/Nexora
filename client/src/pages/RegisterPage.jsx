import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { User, Mail, Lock, Phone, MapPin, Briefcase, ShieldCheck } from 'lucide-react';

export const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'provider' ? 'provider' : 'customer';

  const [role, setRole] = useState(initialRole);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [locality, setLocality] = useState('Bandra West');
  
  // Provider specific fields
  const [category, setCategory] = useState('Electrical');
  const [hourlyRate, setHourlyRate] = useState(350);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim(),
        role,
        locality,
        city: 'Mumbai',
        ...(role === 'provider' ? { category, hourlyRate: Number(hourlyRate) } : {}),
      };

      const res = await register(payload);
      if (res.success) {
        if (role === 'provider') {
          navigate('/provider/dashboard');
        } else {
          navigate('/dashboard');
        }
      } else {
        setError(res.message || 'Registration failed.');
      }
    } catch (err) {
      setError(err.message || 'An account with this email may already exist.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white w-full max-w-lg rounded-3xl border border-surface-200 shadow-xl p-8 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 bg-forest-800 text-white rounded-2xl flex items-center justify-center font-black text-2xl mx-auto shadow-md">
            N
          </div>
          <h2 className="text-2xl font-bold text-gray-900 pt-2">Join NEXORA</h2>
          <p className="text-xs text-gray-500">Create your verified account in minutes</p>
        </div>

        {/* Role Toggle Selector */}
        <div className="grid grid-cols-2 p-1.5 bg-surface-100 rounded-2xl text-xs font-bold gap-1">
          <button
            type="button"
            onClick={() => setRole('customer')}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
              role === 'customer'
                ? 'bg-white text-forest-900 shadow-sm border border-surface-200'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <User className="w-4 h-4 text-forest-700" />
            <span>Customer Account</span>
          </button>

          <button
            type="button"
            onClick={() => setRole('provider')}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
              role === 'provider'
                ? 'bg-forest-800 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Service Provider</span>
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Full Legal Name *</label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Aarav Mehta"
                className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-forest-800"
              />
            </div>
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Email Address *</label>
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
              <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Phone Number *</label>
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
            </div>
          </div>

          {/* Password & Locality */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Password (min 8 chars) *</label>
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

            <div>
              <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Locality (Mumbai) *</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  required
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  placeholder="Bandra West"
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-forest-800"
                />
              </div>
            </div>
          </div>

          {/* Provider Specific Options */}
          {role === 'provider' && (
            <div className="bg-forest-50 p-4 rounded-2xl border border-forest-200 space-y-3 animate-fadeIn">
              <span className="text-[10px] font-bold uppercase text-forest-800 tracking-wider">
                Provider Business Setup
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Primary Trade</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border border-surface-200 bg-white"
                  >
                    {['Electrical', 'Plumbing', 'Home Cleaning', 'Carpentry', 'Painting', 'Appliance Repair', 'Gardening', 'Moving & Helpers'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Base Hourly Rate (₹)</label>
                  <input
                    type="number"
                    min="100"
                    max="5000"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border border-surface-200 bg-white"
                  />
                </div>
              </div>
              <p className="text-[10px] text-forest-700">
                You can upload government verification credentials inside your Provider Dashboard after signup.
              </p>
            </div>
          )}

          <div className="flex items-center space-x-2 text-xs text-gray-600 pt-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>I agree to NEXORA Terms of Service, Privacy Policy, and 10% Platform Guidelines.</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-forest-800 hover:bg-forest-900 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-xs transition-all shadow-md flex items-center justify-center space-x-2"
          >
            {loading ? 'Creating account...' : `Register as ${role === 'provider' ? 'Service Provider' : 'Customer'}`}
          </button>

        </form>

        <p className="text-center text-xs text-gray-500 pt-2">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-forest-800 hover:underline">
            Sign In here
          </Link>
        </p>

      </div>
    </div>
  );
};
