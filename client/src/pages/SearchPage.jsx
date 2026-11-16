import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiGetServices } from '../api/client.js';
import { ServiceCard } from '../components/ServiceCard.jsx';
import { Search, Filter, Sparkles, SlidersHorizontal, Star, X } from 'lucide-react';

export const SearchPage = ({ onOpenAIModal, onSelectService }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'All';
  const initialSearch = searchParams.get('search') || '';

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [maxPrice, setMaxPrice] = useState(1500);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState('relevance');

  const categories = [
    'All',
    'Electrical',
    'Plumbing',
    'Home Cleaning',
    'Carpentry',
    'Painting',
    'Appliance Repair',
    'Gardening',
    'Moving & Helpers',
  ];

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      try {
        let query = `?maxPrice=${maxPrice}`;
        if (category !== 'All') query += `&category=${encodeURIComponent(category)}`;
        if (searchQuery.trim()) query += `&search=${encodeURIComponent(searchQuery.trim())}`;

        const res = await apiGetServices(query);
        if (res.success && res.services) {
          let list = res.services;

          // Filter rating
          if (minRating > 0) {
            list = list.filter((s) => (s.provider?.rating || 5.0) >= minRating);
          }

          // Sort
          if (sortBy === 'price_asc') {
            list.sort((a, b) => a.price - b.price);
          } else if (sortBy === 'price_desc') {
            list.sort((a, b) => b.price - a.price);
          } else if (sortBy === 'rating') {
            list.sort((a, b) => (b.provider?.rating || 0) - (a.provider?.rating || 0));
          }

          setServices(list);
        }
      } catch (err) {
        console.error('Failed to load services:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [category, searchQuery, maxPrice, minRating, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-surface-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search services by keyword, repair type, or skill..."
            className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-forest-800"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sort & AI Prompt */}
        <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
          <div className="flex items-center space-x-1.5 text-xs text-gray-600">
            <span className="font-semibold">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs font-semibold p-2 rounded-xl border border-surface-200 bg-surface-50 focus:outline-none"
            >
              <option value="relevance">Relevance</option>
              <option value="rating">Highest Rated</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>

          <button
            onClick={onOpenAIModal}
            className="flex items-center space-x-1.5 bg-forest-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm hover:bg-forest-900 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>AI Match</span>
          </button>
        </div>

      </div>

      {/* Main Grid: Sidebar + Listings */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Filter Sidebar */}
        <div className="space-y-6 bg-white p-5 rounded-2xl border border-surface-200 shadow-xs h-fit">
          <div className="flex items-center justify-between border-b border-surface-200 pb-3">
            <div className="flex items-center space-x-2 text-forest-800 font-bold text-sm">
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filter Results</span>
            </div>
            {(category !== 'All' || minRating > 0 || maxPrice < 1500) && (
              <button
                onClick={() => {
                  setCategory('All');
                  setMinRating(0);
                  setMaxPrice(1500);
                }}
                className="text-[11px] font-semibold text-rose-600 hover:underline"
              >
                Reset
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Category</label>
            <div className="space-y-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`w-full text-left text-xs px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
                    category === cat ? 'bg-forest-800 text-white font-semibold' : 'text-gray-700 hover:bg-surface-100'
                  }`}
                >
                  <span>{cat}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Slider */}
          <div className="pt-2 border-t border-surface-200">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Max Budget</label>
              <span className="text-xs font-bold text-forest-900">₹{maxPrice}</span>
            </div>
            <input
              type="range"
              min="200"
              max="2000"
              step="50"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-forest-800 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>₹200</span>
              <span>₹2000+</span>
            </div>
          </div>

          {/* Rating Filter */}
          <div className="pt-2 border-t border-surface-200">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Minimum Rating</label>
            <div className="space-y-1.5 text-xs">
              {[4.5, 4.0, 3.5, 0].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setMinRating(rating)}
                  className={`w-full text-left px-3 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                    minRating === rating ? 'bg-forest-100 text-forest-900 font-bold' : 'text-gray-600 hover:bg-surface-100'
                  }`}
                >
                  <span className="flex items-center">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500 mr-1.5" />
                    {rating === 0 ? 'All Ratings' : `${rating} & above`}
                  </span>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Right Listings Results */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Showing <strong className="text-gray-900">{services.length}</strong> verified services</span>
            {category !== 'All' && (
              <span className="bg-forest-50 text-forest-800 font-semibold px-2.5 py-1 rounded-full border border-forest-200">
                Filtered: {category}
              </span>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-72 bg-surface-200 animate-pulse rounded-2xl"></div>
              ))}
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-surface-200 p-8 space-y-3">
              <Search className="w-12 h-12 text-gray-300 mx-auto" />
              <h4 className="text-base font-bold text-gray-900">No services match your filters</h4>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Try widening your price range, clearing specific filters, or use our AI Assistant to describe your task.
              </p>
              <button
                onClick={onOpenAIModal}
                className="bg-forest-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm hover:bg-forest-900 transition-colors inline-flex items-center space-x-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Launch AI Matcher</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {services.map((service) => (
                <ServiceCard
                  key={service._id}
                  service={service}
                  onBookNow={onSelectService}
                />
              ))}
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
