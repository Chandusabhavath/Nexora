import React, { useState } from 'react';
import { apiAIMatch } from '../api/client.js';
import { Sparkles, X, ArrowRight, ShieldCheck, Star, Clock, CheckCircle } from 'lucide-react';

export const AIModal = ({ isOpen, onClose, onSelectService }) => {
  const [taskQuery, setTaskQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleMatch = async (e) => {
    e.preventDefault();
    if (!taskQuery.trim()) return;

    setLoading(true);
    setError('');
    setAiResponse(null);

    try {
      const res = await apiAIMatch(taskQuery, 'Bandra');
      if (res.success && res.data) {
        setAiResponse(res.data);
      } else {
        setError('Could not parse task intent. Please describe with more details.');
      }
    } catch (err) {
      setError(err.message || 'AI Matching engine currently offline. Please try normal search.');
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    'Need an electrician tomorrow morning for 2 hours in Bandra',
    'Deep cleaning for kitchen grease and balcony',
    'Emergency plumber to fix leaky sink pipe',
    'Carpenter to fix squeaky doors and assemble Ikea shelf',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-surface-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-forest-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-gray-300 hover:text-white p-1 rounded-full hover:bg-forest-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2 text-forest-300 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>NEXORA Intelligent Task Matching</span>
          </div>
          <h2 className="text-xl font-bold">Describe what you need in plain English</h2>
          <p className="text-xs text-forest-200 mt-1">
            Our hyperlocal AI extracts category, timing, budget, and automatically pairs you with verified local experts.
          </p>
        </div>

        {/* Input Form */}
        <div className="p-6 border-b border-surface-200 bg-surface-50">
          <form onSubmit={handleMatch} className="space-y-3">
            <div className="relative">
              <textarea
                value={taskQuery}
                onChange={(e) => setTaskQuery(e.target.value)}
                placeholder="e.g., I need a master electrician tomorrow morning around 10am to diagnose a tripping MCB circuit in Bandra West..."
                rows={3}
                className="w-full rounded-xl border border-surface-200 p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-800 bg-white shadow-sm"
              />
              <button
                type="submit"
                disabled={loading || !taskQuery.trim()}
                className="mt-2 w-full flex items-center justify-center space-x-2 bg-forest-800 hover:bg-forest-900 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-semibold shadow-md transition-all"
              >
                {loading ? (
                  <span className="flex items-center space-x-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Analyzing constraints & matching providers...</span>
                  </span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Run Smart Match</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Sample Prompts */}
          {!aiResponse && (
            <div className="mt-4">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Try an example:</span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {samplePrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => setTaskQuery(prompt)}
                    className="text-[11px] bg-white border border-surface-200 hover:border-forest-700 text-gray-700 px-2.5 py-1 rounded-lg transition-colors text-left"
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {error}
            </div>
          )}

          {aiResponse && (
            <div className="space-y-4">
              {/* Intent breakdown badge card */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-emerald-900 flex items-center space-x-1">
                    <CheckCircle className="w-4 h-4 text-emerald-600 mr-1" />
                    Intent Extracted ({Math.round(aiResponse.parsedIntent.confidence * 100)}% Confidence)
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800">
                    {aiResponse.parsedIntent.detectedCategory}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-emerald-900">
                  <div><span className="text-emerald-600 block text-[10px] uppercase font-bold">Timing</span> {aiResponse.parsedIntent.requestedTiming}</div>
                  <div><span className="text-emerald-600 block text-[10px] uppercase font-bold">Location</span> {aiResponse.parsedIntent.locality}</div>
                  <div><span className="text-emerald-600 block text-[10px] uppercase font-bold">Est Duration</span> {aiResponse.parsedIntent.estimatedHours} Hours</div>
                  <div><span className="text-emerald-600 block text-[10px] uppercase font-bold">Target Budget</span> {aiResponse.parsedIntent.maxBudget ? `₹${aiResponse.parsedIntent.maxBudget}` : 'Flexible'}</div>
                </div>
              </div>

              {/* Matched Providers List */}
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Top Matched Professionals ({aiResponse.matches.length})
              </h4>

              <div className="space-y-3">
                {aiResponse.matches.slice(0, 3).map((match) => (
                  <div
                    key={match.providerId}
                    className="border border-surface-200 rounded-2xl p-4 bg-white hover:border-forest-600 transition-colors shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <img
                            src={match.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${match.businessName}&backgroundColor=0F382C`}
                            alt={match.businessName}
                            className="w-11 h-11 rounded-full object-cover border border-surface-200"
                          />
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <h5 className="font-bold text-sm text-gray-900">{match.businessName}</h5>
                              <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            </div>
                            <div className="flex items-center space-x-2 text-xs text-gray-500 mt-0.5">
                              <span className="flex items-center text-amber-600 font-bold">
                                <Star className="w-3 h-3 fill-amber-500 mr-1" />
                                {match.rating} ({match.reviewCount})
                              </span>
                              <span>•</span>
                              <span>₹{match.hourlyRate}/hr</span>
                            </div>
                          </div>
                        </div>

                        {/* Match Score Badge */}
                        <div className="text-right">
                          <div className="inline-block bg-forest-800 text-white font-extrabold text-xs px-2.5 py-1 rounded-lg">
                            {match.matchScore}% Match
                          </div>
                        </div>
                      </div>

                      {/* Explanation bullets */}
                      <div className="mt-3 bg-surface-50 p-2.5 rounded-xl border border-surface-100">
                        <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Why this matches:</span>
                        <ul className="text-xs text-gray-700 space-y-1">
                          {match.matchReasons.map((reason, idx) => (
                            <li key={idx} className="flex items-center space-x-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-forest-700"></span>
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Book Top Service of this Provider */}
                    {match.recommendedServices?.[0] && (
                      <div className="mt-4 pt-3 border-t border-surface-100 flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-800 truncate mr-2">
                          Service: {match.recommendedServices[0].title}
                        </span>
                        <button
                          onClick={() => {
                            onClose();
                            onSelectService(match.recommendedServices[0]);
                          }}
                          className="flex items-center space-x-1 bg-forest-800 hover:bg-forest-900 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all flex-shrink-0"
                        >
                          <span>Select & Book</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                  </div>
                ))}
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
};
