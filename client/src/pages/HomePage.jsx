import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiGetServices, apiGetProviders } from '../api/client.js';
import { ServiceCard } from '../components/ServiceCard.jsx';
import { 
  Sparkles, 
  Search, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  Star, 
  Zap, 
  Wrench, 
  Sparkle, 
  Hammer, 
  Paintbrush, 
  Tv, 
  Trees, 
  Truck,
  ArrowRight
} from 'lucide-react';

export const HomePage = ({ onOpenAIModal, onSelectService }) => {
  const [featuredServices, setFeaturedServices] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [taskInput, setTaskInput] = useState('');
  const navigate = useNavigate();

  const categories = [
    { name: 'Electrical', icon: Zap, count: '14 Experts' },
    { name: 'Plumbing', icon: Wrench, count: '18 Experts' },
    { name: 'Home Cleaning', icon: Sparkle, count: '22 Experts' },
    { name: 'Carpentry', icon: Hammer, count: '11 Experts' },
    { name: 'Painting', icon: Paintbrush, count: '9 Experts' },
    { name: 'Appliance Repair', icon: Tv, count: '16 Experts' },
    { name: 'Gardening', icon: Trees, count: '8 Experts' },
    { name: 'Moving & Helpers', icon: Truck, count: '15 Experts' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [srvRes, provRes] = await Promise.all([
          apiGetServices(),
          apiGetProviders(),
        ]);
        if (srvRes.success) setFeaturedServices(srvRes.services || []);
        if (provRes.success) setProviders(provRes.providers || []);
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleHeroSearch = (e) => {
    e.preventDefault();
    if (taskInput.trim()) {
      navigate(`/search?search=${encodeURIComponent(taskInput.trim())}`);
    } else {
      navigate('/search');
    }
  };

  return (
    <div className="space-y-20 pb-16">
      
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-forest-900 via-forest-900 to-forest-950 text-white pt-16 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10B981_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center space-x-2 bg-forest-800/80 border border-forest-700/60 px-4 py-1.5 rounded-full text-xs font-semibold text-emerald-300 backdrop-blur-sm shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>AI-Assisted Hyperlocal Marketplace</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            Expert Local Services, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-forest-200 to-white">
              Intelligently Matched.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-forest-200 max-w-2xl mx-auto font-light leading-relaxed">
            Describe what you need in plain English. NEXORA connects you directly with verified electricians, plumbers, cleaners, and technicians within your neighborhood.
          </p>

          {/* Natural Language Hero Search Box */}
          <div className="pt-4 max-w-2xl mx-auto">
            <form
              onSubmit={handleHeroSearch}
              className="bg-white p-2 sm:p-2.5 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center border border-white/20 text-gray-900"
            >
              <div className="flex items-center flex-1 w-full px-3 py-2">
                <Search className="w-5 h-5 text-gray-400 mr-2.5 flex-shrink-0" />
                <input
                  type="text"
                  value={taskInput}
                  onChange={(e) => setTaskInput(e.target.value)}
                  placeholder="e.g. Electrician tomorrow morning for 2 hours..."
                  className="w-full text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto mt-2 sm:mt-0">
                <button
                  type="button"
                  onClick={onOpenAIModal}
                  className="w-full sm:w-auto flex items-center justify-center space-x-1.5 bg-forest-100 hover:bg-forest-200 text-forest-900 font-semibold text-xs px-3.5 py-3 rounded-xl transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-forest-700" />
                  <span>AI Match</span>
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-md transition-all flex items-center justify-center space-x-1"
                >
                  <span>Search</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>

            {/* Quick Filter Tags */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs text-forest-300">
              <span className="font-semibold text-forest-400">Popular:</span>
              {['AC Repair', 'Deep Cleaning', 'Emergency Plumber', 'Circuit Tripping'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => navigate(`/search?search=${encodeURIComponent(tag)}`)}
                  className="bg-forest-800/60 hover:bg-forest-800 text-forest-200 hover:text-white px-2.5 py-1 rounded-lg border border-forest-700/40 transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* 2. Popular Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-forest-700">Explore Neighborhood Services</span>
            <h2 className="text-2xl font-bold text-gray-900 mt-1">Verified Categories</h2>
          </div>
          <Link to="/search" className="text-xs font-bold text-forest-800 hover:text-forest-900 flex items-center space-x-1">
            <span>View All Categories</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.name}
                to={`/search?category=${encodeURIComponent(cat.name)}`}
                className="group bg-white p-4 rounded-2xl border border-surface-200 hover:border-forest-600 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col items-center text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-surface-100 group-hover:bg-forest-800 text-forest-800 group-hover:text-white flex items-center justify-center transition-colors mb-3">
                  <Icon className="w-6 h-6" />
                </div>
                <h4 className="text-xs font-bold text-gray-900 group-hover:text-forest-800 transition-colors leading-tight">
                  {cat.name}
                </h4>
                <span className="text-[10px] text-gray-400 mt-1">{cat.count}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 3. Featured Services Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-forest-700">Top-Rated Hyperlocal Offers</span>
            <h2 className="text-2xl font-bold text-gray-900 mt-1">Featured Local Services</h2>
          </div>
          <Link to="/search" className="text-xs font-bold text-forest-800 hover:text-forest-900 flex items-center space-x-1">
            <span>Browse All Services</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-72 bg-surface-200 animate-pulse rounded-2xl"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredServices.slice(0, 3).map((service) => (
              <ServiceCard
                key={service._id}
                service={service}
                onBookNow={onSelectService}
              />
            ))}
          </div>
        )}
      </section>

      {/* 4. How NEXORA Works */}
      <section className="bg-surface-100 py-16 border-y border-surface-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-forest-700">Simple & Trustworthy</span>
            <h2 className="text-3xl font-bold text-gray-900 mt-1">How NEXORA Works</h2>
            <p className="text-xs text-gray-600 mt-2">
              From natural-language request to job completion and direct settlement in 3 easy steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-surface-200 shadow-sm relative">
              <span className="text-3xl font-black text-forest-100 absolute top-4 right-4">01</span>
              <div className="w-10 h-10 rounded-xl bg-forest-50 text-forest-800 flex items-center justify-center font-bold mb-4">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Describe Your Task</h3>
              <p className="mt-2 text-xs text-gray-500 leading-relaxed">
                Tell us your task, date, budget, and location in plain English. No rigid filters required.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-surface-200 shadow-sm relative">
              <span className="text-3xl font-black text-forest-100 absolute top-4 right-4">02</span>
              <div className="w-10 h-10 rounded-xl bg-forest-50 text-forest-800 flex items-center justify-center font-bold mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Smart Hyperlocal Match</h3>
              <p className="mt-2 text-xs text-gray-500 leading-relaxed">
                Our algorithm scores verified experts in your neighborhood based on proximity, ratings, and availability.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-surface-200 shadow-sm relative">
              <span className="text-3xl font-black text-forest-100 absolute top-4 right-4">03</span>
              <div className="w-10 h-10 rounded-xl bg-forest-50 text-forest-800 flex items-center justify-center font-bold mb-4">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Service & Direct Pay</h3>
              <p className="mt-2 text-xs text-gray-500 leading-relaxed">
                The provider completes the job. Confirm satisfactory completion and pay directly via Cash or direct UPI.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Verified Providers Highlight Carousel */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-forest-700">Vetted Community Experts</span>
          <h2 className="text-2xl font-bold text-gray-900 mt-1">Verified Local Professionals</h2>
          <p className="text-xs text-gray-500 mt-1">Every provider undergoes government ID verification and background checks.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {providers.slice(0, 4).map((prof) => (
            <div
              key={prof._id}
              className="bg-white rounded-2xl border border-surface-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col items-center text-center"
            >
              <div className="relative mb-3">
                <img
                  src={prof.user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${prof.businessName}&backgroundColor=0F382C`}
                  alt={prof.businessName}
                  className="w-16 h-16 rounded-full object-cover border-2 border-forest-800"
                />
                <ShieldCheck className="w-5 h-5 text-emerald-600 bg-white rounded-full absolute -bottom-1 -right-1 shadow" />
              </div>
              <h4 className="font-bold text-sm text-gray-900">{prof.businessName}</h4>
              <span className="text-xs text-forest-700 font-medium">{prof.category} Specialist</span>
              <div className="flex items-center space-x-1.5 mt-2 text-xs">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                <span className="font-bold text-gray-900">{prof.rating}</span>
                <span className="text-gray-400">({prof.reviewCount} reviews)</span>
              </div>
              <p className="mt-2 text-[11px] text-gray-500 line-clamp-2 px-2">
                {prof.bio}
              </p>
              <div className="mt-4 pt-3 border-t border-surface-100 w-full flex items-center justify-between text-xs font-semibold">
                <span className="text-gray-500">Rate:</span>
                <span className="text-forest-900 font-bold">₹{prof.hourlyRate}/hr</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Become a Provider CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-forest-900 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden shadow-xl">
          <div className="max-w-xl space-y-4 relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
              Grow Your Local Business
            </span>
            <h2 className="text-3xl font-bold">Are you an electrician, plumber, or home specialist?</h2>
            <p className="text-xs sm:text-sm text-forest-200 leading-relaxed font-light">
              Join NEXORA’s verified provider network. Get bookings from your neighborhood, set your own working hours, and receive direct UPI or cash settlements with a fair, transparent 10% platform fee.
            </p>
            <div className="pt-2">
              <Link
                to="/register?role=provider"
                className="inline-flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-forest-950 font-bold text-xs px-6 py-3.5 rounded-xl transition-all shadow-md"
              >
                <span>Apply as a Service Provider</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
