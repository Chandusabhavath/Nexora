import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { apiCreateBooking } from '../api/client.js';
import { Calendar, Clock, MapPin, X, Check, CreditCard, Banknote, ShieldCheck, QrCode } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PaymentModal } from './PaymentModal.jsx';

export const BookingModal = ({ isOpen, onClose, service, initialTask = '' }) => {
  const { user, isAuthenticated, currentLocality } = useAuth();
  const navigate = useNavigate();

  const [scheduledDate, setScheduledDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [scheduledTime, setScheduledTime] = useState('10:00');
  const [durationHours, setDurationHours] = useState(2);
  const [taskDescription, setTaskDescription] = useState(initialTask || '');
  const [paymentMethod, setPaymentMethod] = useState('online'); // 'online' | 'cash'
  const [locality, setLocality] = useState(currentLocality || 'Bandra West');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successBooking, setSuccessBooking] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  if (!isOpen || !service) return null;

  // Price calculations
  const priceType = service.priceType || 'hourly';
  const baseRate = service.price || 350;
  const subtotal = priceType === 'hourly' ? baseRate * durationHours : baseRate;
  const platformFee = Math.round(subtotal * 0.10);
  const totalAmount = subtotal + platformFee;

  const timeSlots = ['09:00', '10:30', '12:00', '14:00', '15:30', '17:00', '18:30'];

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login?redirect=booking');
      return;
    }

    if (!taskDescription.trim()) {
      setError('Please provide a brief description of the task requirements.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        providerId: service.providerId || service.provider?._id,
        serviceId: service._id,
        taskDescription: taskDescription.trim(),
        scheduledDate,
        scheduledTime,
        durationHours: Number(durationHours),
        serviceLocation: {
          street: '',
          locality,
          city: 'Mumbai',
          pincode: '400050',
          lat: 19.0596,
          lng: 72.8295,
        },
        paymentMethod: paymentMethod === 'online' ? 'online' : 'cash',
      };

      const res = await apiCreateBooking(payload);
      if (res.success && res.booking) {
        setSuccessBooking(res.booking);
        if (paymentMethod === 'online') {
          setShowPaymentModal(true);
        }
      } else {
        setError(res.message || 'Failed to submit booking request.');
      }
    } catch (err) {
      setError(err.message || 'Booking submission failed. Slot may be unavailable.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
        <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-surface-200 overflow-hidden flex flex-col max-h-[92vh]">
          
          {/* Header */}
          <div className="bg-forest-900 text-white p-5 relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-300 hover:text-white p-1 rounded-full hover:bg-forest-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              Booking Request Snapshot
            </span>
            <h3 className="text-lg font-bold truncate pr-6">{service.title}</h3>
            <p className="text-xs text-forest-200">
              by {service.provider?.businessName || 'Verified Local Professional'}
            </p>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1 space-y-5">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {error}
              </div>
            )}

            {successBooking ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-bold text-gray-900">Booking Request Placed!</h4>
                <p className="text-xs text-gray-600 max-w-sm mx-auto">
                  Your request has been sent to the provider. Reference:{' '}
                  <span className="font-bold text-forest-800 font-mono">#{successBooking.bookingReference}</span>.
                </p>

                {successBooking.paymentStatus === 'paid' ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl max-w-sm mx-auto">
                    Payment Verified & Escrowed (₹{successBooking.agreedPriceSnapshot?.totalAmount})
                  </div>
                ) : (
                  <div className="p-3 bg-surface-50 border border-surface-200 text-xs rounded-xl max-w-sm mx-auto flex items-center justify-between">
                    <span className="text-gray-600">Total Payable: <strong>₹{successBooking.agreedPriceSnapshot?.totalAmount}</strong></span>
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="flex items-center space-x-1.5 bg-forest-800 hover:bg-forest-900 text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow-sm"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Pay via Dynamic QR</span>
                    </button>
                  </div>
                )}

                <div className="pt-4 flex justify-center space-x-3">
                  <button
                    onClick={() => {
                      onClose();
                      navigate('/dashboard');
                    }}
                    className="bg-forest-800 hover:bg-forest-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md"
                  >
                    View in Customer Dashboard
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="space-y-4">
                
                {/* Task Details */}
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                    Describe Your Task Requirements *
                  </label>
                  <textarea
                    required
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    placeholder="e.g. Master bedroom switchboard is loose and tripping the main breaker. Need urgent diagnosis."
                    rows={2}
                    className="w-full text-xs p-3 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-forest-800"
                  />
                </div>

                {/* Date & Time Slot */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-700 mb-1 flex items-center">
                      <Calendar className="w-3.5 h-3.5 mr-1 text-forest-700" /> Date
                    </label>
                    <input
                      type="date"
                      required
                      value={scheduledDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-forest-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-700 mb-1 flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1 text-forest-700" /> Start Time
                    </label>
                    <select
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-forest-800"
                    >
                      {timeSlots.map((slot) => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Duration & Locality */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {priceType === 'hourly' && (
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                        Expected Duration
                      </label>
                      <select
                        value={durationHours}
                        onChange={(e) => setDurationHours(Number(e.target.value))}
                        className="w-full text-xs p-2.5 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-forest-800"
                      >
                        <option value={1}>1 Hour</option>
                        <option value={2}>2 Hours (Recommended)</option>
                        <option value={3}>3 Hours</option>
                        <option value={4}>4 Hours</option>
                        <option value={6}>6 Hours (Half Day)</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-700 mb-1 flex items-center">
                      <MapPin className="w-3.5 h-3.5 mr-1 text-forest-700" /> Locality
                    </label>
                    <input
                      type="text"
                      required
                      value={locality}
                      onChange={(e) => setLocality(e.target.value)}
                      placeholder="e.g. Bandra West"
                      className="w-full text-xs p-2.5 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-forest-800"
                    />
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('online')}
                      className={`flex items-start space-x-2.5 p-3 rounded-xl border text-left transition-colors ${
                        paymentMethod === 'online' ? 'border-forest-800 bg-forest-50/70 font-semibold ring-1 ring-forest-800' : 'border-surface-200 hover:bg-surface-50'
                      }`}
                    >
                      <QrCode className="w-4 h-4 text-emerald-700 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="flex items-center space-x-1">
                          <p className="text-xs text-gray-900 font-bold">Online UPI QR</p>
                          <span className="bg-emerald-100 text-emerald-800 text-[9px] px-1.5 py-0.2 rounded font-bold">RECOMMENDED</span>
                        </div>
                        <p className="text-[10px] text-gray-500">Escrow protected split payment</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cash')}
                      className={`flex items-start space-x-2.5 p-3 rounded-xl border text-left transition-colors ${
                        paymentMethod === 'cash' ? 'border-forest-800 bg-forest-50/70 font-semibold ring-1 ring-forest-800' : 'border-surface-200 hover:bg-surface-50'
                      }`}
                    >
                      <Banknote className="w-4 h-4 text-forest-700 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-900 font-bold">Direct Cash</p>
                        <p className="text-[10px] text-gray-500">Pay cash upon job completion</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Price Breakdown Snapshot */}
                <div className="bg-surface-100 p-4 rounded-2xl border border-surface-200 space-y-2 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Base Rate ({priceType === 'hourly' ? `₹${baseRate} × ${durationHours} hrs` : 'Fixed'})</span>
                    <span className="font-medium text-gray-900">₹{subtotal}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span className="flex items-center">
                      <span>NEXORA Protection & Platform (10%)</span>
                      <ShieldCheck className="w-3.5 h-3.5 ml-1 text-emerald-600" />
                    </span>
                    <span className="font-medium text-gray-900">₹{platformFee}</span>
                  </div>
                  <div className="pt-2 border-t border-surface-200 flex justify-between text-sm font-bold text-forest-900">
                    <span>Total Payable</span>
                    <span>₹{totalAmount}</span>
                  </div>
                </div>

                {/* Submit CTA */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-forest-800 hover:bg-forest-900 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <span>Securing slot & booking...</span>
                  ) : (
                    <span>Confirm Booking (₹{totalAmount})</span>
                  )}
                </button>

                {!isAuthenticated && (
                  <p className="text-[11px] text-center text-amber-700">
                    Note: You will be redirected to sign in or register before completing the request.
                  </p>
                )}

              </form>
            )}
          </div>

        </div>
      </div>

      {/* Dynamic Payment Modal */}
      {showPaymentModal && successBooking && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          booking={successBooking}
          onPaymentSuccess={(payment) => {
            setSuccessBooking((prev) => prev ? { ...prev, paymentStatus: 'paid' } : null);
          }}
        />
      )}
    </>
  );
};
