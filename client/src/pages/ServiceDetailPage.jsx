import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiGetServiceById } from '../api/client.js';
import { 
  ShieldCheck, 
  Star, 
  Clock, 
  MapPin, 
  Check, 
  X as XIcon, 
  ArrowLeft, 
  Calendar,
  Lock,
  ThumbsUp
} from 'lucide-react';

export const ServiceDetailPage = ({ onBookService }) => {
  const { id } = useParams();
  const [service, setService] = useState(null);
  const [provider, setProvider] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await apiGetServiceById(id);
        if (res.success && res.service) {
          setService(res.service);
          setProvider(res.provider);
          setReviews(res.reviews || []);
        } else {
          setError('Service not found.');
        }
      } catch (err) {
        setError(err.message || 'Failed to load service details.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-8 h-8 border-4 border-forest-800 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs text-gray-500">Loading service specifications...</p>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <h3 className="text-lg font-bold text-gray-900">{error || 'Service not found'}</h3>
        <Link to="/search" className="text-xs font-bold text-forest-800 hover:underline">
          Return to Service Listings
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Back button */}
      <Link
        to="/search"
        className="inline-flex items-center space-x-1.5 text-xs font-bold text-gray-600 hover:text-forest-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Services</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Details, Provider Bio, Included/Excluded, Reviews */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Main Photo Banner */}
          <div className="rounded-3xl overflow-hidden border border-surface-200 bg-surface-100 shadow-sm relative h-80 sm:h-96">
            <img
              src={service.images?.[0] || 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&q=80&w=1000'}
              alt={service.title}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&q=80&w=1000';
              }}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-3.5 py-1.5 rounded-full text-xs font-bold text-forest-800 shadow-sm">
              {service.category}
            </div>
          </div>

          {/* Title & Stats */}
          <div className="space-y-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
              {service.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
              <span className="flex items-center text-amber-600 font-bold">
                <Star className="w-4 h-4 fill-amber-400 text-amber-500 mr-1" />
                {provider?.rating || 5.0} ({provider?.reviewCount || 0} verified reviews)
              </span>
              <span>•</span>
              <span className="flex items-center">
                <Clock className="w-4 h-4 mr-1 text-gray-400" />
                Est. Duration: {service.durationMinutes} mins
              </span>
              <span>•</span>
              <span className="flex items-center">
                <MapPin className="w-4 h-4 mr-1 text-forest-700" />
                {provider?.serviceArea?.city || 'Mumbai'} Hyperlocal
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white p-6 rounded-2xl border border-surface-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">Service Description</h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed whitespace-pre-line">
              {service.description}
            </p>
          </div>

          {/* Included / Excluded Checklist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-surface-200 shadow-xs space-y-3">
              <h4 className="text-xs font-bold uppercase text-emerald-800 flex items-center">
                <Check className="w-4 h-4 mr-1 text-emerald-600" /> What's Included
              </h4>
              <ul className="text-xs text-gray-600 space-y-2">
                {(service.includedItems?.length ? service.includedItems : ['Diagnostic inspection', 'Standard hand tools & testing', 'Labor & safety execution']).map((item, i) => (
                  <li key={i} className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-surface-200 shadow-xs space-y-3">
              <h4 className="text-xs font-bold uppercase text-rose-800 flex items-center">
                <XIcon className="w-4 h-4 mr-1 text-rose-600" /> What's Excluded
              </h4>
              <ul className="text-xs text-gray-600 space-y-2">
                {(service.excludedItems?.length ? service.excludedItems : ['Cost of replacement hardware or parts', 'Major structural alteration']).map((item, i) => (
                  <li key={i} className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Provider Profile Summary */}
          {provider && (
            <div className="bg-surface-100 p-6 rounded-2xl border border-surface-200 space-y-4">
              <span className="text-[10px] uppercase font-bold tracking-wider text-forest-800">
                Service Provider
              </span>
              <div className="flex items-center space-x-4">
                <img
                  src={provider.user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${provider.businessName}&backgroundColor=0F382C`}
                  alt={provider.businessName}
                  className="w-14 h-14 rounded-full object-cover border-2 border-forest-800 shadow-sm"
                />
                <div>
                  <div className="flex items-center space-x-1.5">
                    <h3 className="font-bold text-base text-gray-900">{provider.businessName}</h3>
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {provider.experienceYears}+ years experience • {provider.completedBookingsCount || 0} completed bookings
                  </p>
                </div>
              </div>

              <p className="text-xs text-gray-600 leading-relaxed">
                {provider.bio}
              </p>

              {provider.skills?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {provider.skills.map((skill, i) => (
                    <span key={i} className="text-[10px] bg-white border border-surface-200 px-2.5 py-1 rounded-md text-gray-700 font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Verified Customer Reviews */}
          <div className="bg-white p-6 rounded-2xl border border-surface-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-surface-200 pb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">Customer Reviews</h3>
                <p className="text-xs text-gray-500 mt-0.5">Verified bookings only</p>
              </div>
              <div className="flex items-center space-x-1 text-sm font-bold text-gray-900">
                <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                <span>{provider?.rating || 5.0}</span>
                <span className="text-xs text-gray-400">({reviews.length} reviews)</span>
              </div>
            </div>

            {reviews.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">
                No reviews yet. Be the first customer to book and rate this service!
              </p>
            ) : (
              <div className="space-y-4">
                {reviews.map((rev) => (
                  <div key={rev._id} className="border-b border-surface-100 pb-4 last:border-0 last:pb-0 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-xs text-gray-900">
                          {rev.customer?.name || 'Verified Customer'}
                        </span>
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                          Verified
                        </span>
                      </div>
                      <div className="flex items-center text-amber-500">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{rev.comment}</p>
                    {rev.providerReply?.comment && (
                      <div className="bg-surface-50 p-3 rounded-xl border border-surface-200 text-xs text-gray-600 mt-2">
                        <span className="font-bold text-forest-800 block text-[11px] mb-0.5">Provider Response:</span>
                        {rev.providerReply.comment}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Sticky Booking Box */}
        <div className="space-y-6">
          <div className="sticky top-28 bg-white p-6 rounded-3xl border border-surface-200 shadow-xl space-y-5">
            
            <div className="border-b border-surface-200 pb-4">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Rate Snapshot</span>
              <div className="flex items-baseline space-x-1 mt-1">
                <span className="text-3xl font-extrabold text-forest-900">₹{service.price}</span>
                <span className="text-xs text-gray-500 font-medium">
                  {service.priceType === 'hourly' ? '/ hour' : 'fixed total'}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs text-gray-600">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>NEXORA 100% Service Quality Guarantee</span>
              </div>
              <div className="flex items-center space-x-2">
                <Lock className="w-4 h-4 text-emerald-600" />
                <span>Direct Cash or UPI settlement upon completion</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>Free cancellation up to 2 hours before scheduled slot</span>
              </div>
            </div>

            <button
              onClick={() => onBookService(service)}
              className="w-full bg-forest-800 hover:bg-forest-900 text-white font-bold py-3.5 px-4 rounded-xl text-sm shadow-md transition-all flex items-center justify-center space-x-2"
            >
              <Calendar className="w-4 h-4" />
              <span>Book Appointment</span>
            </button>

            <p className="text-[11px] text-gray-400 text-center">
              No advance payment required. Pay directly to the provider once satisfied.
            </p>

          </div>
        </div>

      </div>

    </div>
  );
};
