import React from 'react';
import { Link } from 'react-router-dom';
import { Star, ShieldCheck, Clock, MapPin, ArrowRight } from 'lucide-react';

export const ServiceCard = ({ service, onBookNow }) => {
  const provider = service.provider || {};
  const user = provider.user || {};

  return (
    <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col group">
      
      {/* Service Image with Category & Price Badge */}
      <div className="relative h-48 w-full overflow-hidden bg-surface-100">
        <img
          src={service.images?.[0] || 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=600'}
          alt={service.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full text-[11px] font-semibold text-forest-800 shadow-sm">
          {service.category}
        </div>
        <div className="absolute top-3 right-3 bg-forest-900/90 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-sm">
          ₹{service.price} {service.priceType === 'hourly' ? '/ hr' : 'fixed'}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Provider Info Row */}
          <div className="flex items-center space-x-3 mb-3">
            <img
              src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${provider.businessName || 'Provider'}&backgroundColor=0F382C`}
              alt={provider.businessName}
              className="w-9 h-9 rounded-full object-cover border border-surface-200"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-semibold text-gray-900 truncate">
                  {provider.businessName || user.name || 'Verified Expert'}
                </span>
                {provider.verificationStatus === 'approved' && (
                  <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" title="Verified by NEXORA" />
                )}
              </div>
              <div className="flex items-center space-x-2 text-[11px] text-gray-500">
                <span className="flex items-center text-amber-600 font-semibold">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500 mr-1" />
                  {provider.rating || 5.0} ({provider.reviewCount || 12})
                </span>
                <span>•</span>
                <span className="flex items-center">
                  <Clock className="w-3 h-3 mr-0.5 text-gray-400" />
                  {service.durationMinutes} mins
                </span>
              </div>
            </div>
          </div>

          {/* Service Title */}
          <h3 className="font-semibold text-sm text-gray-900 line-clamp-1 group-hover:text-forest-800 transition-colors">
            {service.title}
          </h3>

          {/* Description */}
          <p className="mt-1 text-xs text-gray-500 line-clamp-2 leading-relaxed">
            {service.description}
          </p>

          {/* Service Area */}
          <div className="mt-3 flex items-center text-[11px] text-gray-500">
            <MapPin className="w-3.5 h-3.5 text-forest-700 mr-1 flex-shrink-0" />
            <span className="truncate">
              {provider.serviceArea?.localities?.slice(0, 2).join(', ') || 'Bandra, Khar'} ({provider.serviceArea?.city || 'Mumbai'})
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 pt-4 border-t border-surface-100 flex items-center space-x-2">
          <Link
            to={`/service/${service._id}`}
            className="flex-1 text-center py-2 px-3 rounded-lg border border-surface-200 hover:border-forest-700 text-xs font-semibold text-gray-700 hover:text-forest-800 transition-colors"
          >
            Details
          </Link>
          <button
            onClick={() => onBookNow ? onBookNow(service) : null}
            className="flex-1 flex items-center justify-center space-x-1 bg-forest-800 hover:bg-forest-900 text-white py-2 px-3 rounded-lg text-xs font-semibold transition-all shadow-sm"
          >
            <span>Book Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

    </div>
  );
};
