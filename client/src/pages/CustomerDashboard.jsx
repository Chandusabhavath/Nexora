import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { apiGetBookings, apiUpdateBookingStatus, apiConfirmPayment } from '../api/client.js';
import { ChatDrawer } from '../components/ChatDrawer.jsx';
import { ReviewModal } from '../components/ReviewModal.jsx';
import { PaymentModal } from '../components/PaymentModal.jsx';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  MessageSquare, 
  Star, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  CreditCard,
  Banknote,
  RotateCcw,
  QrCode,
  FileCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const CustomerDashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  // Interactive drawers/modals state
  const [activeChatBooking, setActiveChatBooking] = useState(null);
  const [activeReviewBooking, setActiveReviewBooking] = useState(null);
  const [activePaymentBooking, setActivePaymentBooking] = useState(null);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await apiGetBookings();
      if (res.success && res.bookings) {
        setBookings(res.bookings);
      }
    } catch (err) {
      console.error('Failed to fetch customer bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancel = async (bookingId) => {
    const reason = prompt('Please specify cancellation reason:');
    if (!reason) return;

    try {
      const res = await apiUpdateBookingStatus(bookingId, {
        status: 'cancelled',
        cancellationReason: reason,
      });
      if (res.success) {
        fetchBookings();
      }
    } catch (err) {
      alert(err.message || 'Failed to cancel booking.');
    }
  };

  const handleConfirmPayment = async (bookingId) => {
    try {
      const res = await apiConfirmPayment(bookingId);
      if (res.success) {
        alert('Payment confirmed successfully. Thank you!');
        fetchBookings();
      }
    } catch (err) {
      alert(err.message || 'Payment confirmation failed.');
    }
  };

  const filteredBookings = filterStatus === 'all'
    ? bookings
    : bookings.filter((b) => b.status === filterStatus);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="bg-amber-100 text-amber-800 font-bold px-2.5 py-1 rounded-full text-xs">Awaiting Confirmation</span>;
      case 'accepted':
        return <span className="bg-blue-100 text-blue-800 font-bold px-2.5 py-1 rounded-full text-xs">Confirmed & Scheduled</span>;
      case 'in_progress':
        return <span className="bg-purple-100 text-purple-800 font-bold px-2.5 py-1 rounded-full text-xs animate-pulse">Service In Progress</span>;
      case 'completed':
        return <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full text-xs">Completed</span>;
      case 'cancelled':
        return <span className="bg-rose-100 text-rose-800 font-bold px-2.5 py-1 rounded-full text-xs">Cancelled</span>;
      case 'rejected':
        return <span className="bg-gray-200 text-gray-700 font-bold px-2.5 py-1 rounded-full text-xs">Declined</span>;
      default:
        return <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full text-xs">{status}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Welcome Bar */}
      <div className="bg-white p-6 rounded-3xl border border-surface-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <img
            src={user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name}&backgroundColor=0F382C`}
            alt={user?.name}
            className="w-14 h-14 rounded-2xl object-cover border-2 border-forest-800 shadow-sm"
          />
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-forest-700">Customer Dashboard</span>
            <h1 className="text-xl font-bold text-gray-900">Hello, {user?.name}</h1>
            <p className="text-xs text-gray-500">{user?.email} • Locality: {user?.address?.locality || 'Bandra West'}</p>
          </div>
        </div>

        <Link
          to="/search"
          className="bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all"
        >
          Book Another Service
        </Link>
      </div>

      {/* Bookings Section */}
      <div className="space-y-4">
        
        {/* Filter Tabs */}
        <div className="flex items-center justify-between border-b border-surface-200 pb-2">
          <div className="flex space-x-2">
            {[
              { id: 'all', label: 'All Bookings' },
              { id: 'pending', label: 'Pending' },
              { id: 'accepted', label: 'Active' },
              { id: 'completed', label: 'Completed' },
              { id: 'cancelled', label: 'Cancelled' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`text-xs px-3.5 py-1.5 rounded-xl font-semibold transition-colors ${
                  filterStatus === tab.id
                    ? 'bg-forest-800 text-white'
                    : 'text-gray-600 hover:bg-surface-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={fetchBookings}
            className="text-xs text-forest-800 hover:underline flex items-center space-x-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        {/* List of Bookings */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 bg-surface-200 animate-pulse rounded-2xl"></div>
            ))}
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-surface-200 p-8 space-y-3">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto" />
            <h4 className="text-base font-bold text-gray-900">No bookings in this tab</h4>
            <p className="text-xs text-gray-500">Need emergency repairs or deep cleaning? Find a verified expert nearby.</p>
            <Link
              to="/search"
              className="inline-block mt-2 bg-forest-800 text-white text-xs font-bold px-4 py-2 rounded-xl"
            >
              Browse Services
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((b) => (
              <div
                key={b._id}
                className="bg-white rounded-2xl border border-surface-200 p-5 shadow-xs hover:shadow-md transition-all space-y-4"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-100 pb-3">
                  <div>
                    <span className="text-[10px] text-gray-400 font-mono font-bold">
                      Ref: #{b.bookingReference}
                    </span>
                    <h3 className="text-base font-bold text-gray-900">
                      {b.service?.title || 'Hyperlocal Service'}
                    </h3>
                    <p className="text-xs text-forest-700 font-medium">
                      Provider: {b.provider?.businessName || 'Verified Expert'}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    {getStatusBadge(b.status)}
                    <span className="text-sm font-bold text-forest-900">
                      ₹{b.agreedPriceSnapshot?.totalAmount}
                    </span>
                  </div>
                </div>

                {/* Details row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-600 bg-surface-50 p-3 rounded-xl border border-surface-100">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-forest-700" />
                    <span>Scheduled: {b.scheduledDate} at {b.scheduledTime}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-forest-700" />
                    <span>Duration: {b.durationHours} Hours</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-forest-700" />
                    <span>{b.serviceLocation?.locality || 'Bandra West'}</span>
                  </div>
                </div>

                {/* Task requirements snippet */}
                <p className="text-xs text-gray-600 bg-white p-3 rounded-xl border border-surface-200">
                  <strong className="text-gray-900">Task Notes:</strong> {b.taskDescription}
                </p>

                {/* Payment Status Bar */}
                {b.paymentStatus === 'paid' ? (
                  <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs text-emerald-800">
                      <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>
                        Paid & Escrow Protected (₹{b.agreedPriceSnapshot?.totalAmount}). Payout scheduled upon completion.
                      </span>
                    </div>
                    <button
                      onClick={() => setActivePaymentBooking(b)}
                      className="text-xs font-bold text-emerald-800 hover:underline flex items-center space-x-1"
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>View Receipt</span>
                    </button>
                  </div>
                ) : b.paymentStatus === 'provider_reported' ? (
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs text-amber-900">
                      <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0" />
                      <span>
                        Provider reported payment collection of ₹{b.paymentDetails?.reportedAmount || b.agreedPriceSnapshot?.totalAmount} via {b.paymentMethod?.toUpperCase()}.
                      </span>
                    </div>
                    <button
                      onClick={() => handleConfirmPayment(b._id)}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm"
                    >
                      Confirm Payment
                    </button>
                  </div>
                ) : (
                  <div className="bg-surface-50 border border-surface-200 p-3 rounded-xl flex items-center justify-between">
                    <span className="text-xs text-gray-600">
                      Payment pending: <strong className="text-gray-900">₹{b.agreedPriceSnapshot?.totalAmount}</strong>
                    </span>
                    <button
                      onClick={() => setActivePaymentBooking(b)}
                      className="flex items-center space-x-1.5 bg-forest-800 hover:bg-forest-900 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-sm"
                    >
                      <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Pay Online via UPI QR</span>
                    </button>
                  </div>
                )}

                {/* Action Buttons Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  
                  {/* Left: Chat Button */}
                  <button
                    onClick={() => setActiveChatBooking(b)}
                    className="flex items-center space-x-1.5 text-xs font-bold text-forest-800 hover:bg-forest-50 px-3 py-1.5 rounded-lg border border-forest-200 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Message Provider</span>
                  </button>

                  {/* Right Action buttons */}
                  <div className="flex items-center space-x-2">
                    {/* Cancellation allowed for pending or accepted */}
                    {['pending', 'accepted'].includes(b.status) && (
                      <button
                        onClick={() => handleCancel(b._id)}
                        className="text-xs text-rose-600 hover:bg-rose-50 font-semibold px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Cancel Request
                      </button>
                    )}

                    {/* Review Button for completed bookings */}
                    {b.status === 'completed' && !b.hasReview && (
                      <button
                        onClick={() => setActiveReviewBooking(b)}
                        className="flex items-center space-x-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-sm transition-all"
                      >
                        <Star className="w-3.5 h-3.5 fill-white" />
                        <span>Leave Review</span>
                      </button>
                    )}

                    {b.status === 'completed' && b.hasReview && (
                      <span className="text-[11px] text-gray-500 font-semibold flex items-center space-x-1">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Reviewed</span>
                      </span>
                    )}
                  </div>

                </div>

              </div>
            ))}
          </div>
        )}

      </div>

      {/* Real-time Chat Drawer */}
      <ChatDrawer
        isOpen={!!activeChatBooking}
        onClose={() => setActiveChatBooking(null)}
        booking={activeChatBooking}
      />

      {/* Review Modal */}
      <ReviewModal
        isOpen={!!activeReviewBooking}
        onClose={() => setActiveReviewBooking(null)}
        booking={activeReviewBooking}
        onReviewSubmitted={fetchBookings}
      />

      {/* Dynamic UPI Payment Modal */}
      {activePaymentBooking && (
        <PaymentModal
          isOpen={!!activePaymentBooking}
          onClose={() => setActivePaymentBooking(null)}
          booking={activePaymentBooking}
          onPaymentSuccess={() => {
            fetchBookings();
          }}
        />
      )}

    </div>
  );
};
