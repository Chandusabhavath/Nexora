import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  apiGetMyProviderProfile, 
  apiGetBookings, 
  apiUpdateBookingStatus, 
  apiReportPayment, 
  apiSubmitVerification, 
  apiCreateService,
  apiGetBankDetails,
  apiUpdateBankDetails,
  apiVerifyBankDetails,
  apiGetProviderFinance,
  apiProviderRequestPayout
} from '../api/client.js';
import { ChatDrawer } from '../components/ChatDrawer.jsx';
import { 
  Briefcase, 
  IndianRupee, 
  Star, 
  ShieldCheck, 
  Check, 
  X, 
  Clock, 
  Calendar, 
  MapPin, 
  Plus, 
  AlertCircle,
  MessageSquare,
  CheckCircle2,
  FileText,
  Landmark,
  Wallet,
  ArrowUpRight,
  Download,
  Building,
  CreditCard,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';

export const ProviderDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('pipeline'); // 'pipeline' | 'finance' | 'bank' | 'services' | 'verification'
  
  const [profileData, setProfileData] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [bankData, setBankData] = useState(null);
  const [financeData, setFinanceData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Bank Form State
  const [bankForm, setBankForm] = useState({
    accountHolderName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifsc: '',
    bankName: '',
    upiId: '',
    businessType: 'individual',
  });
  const [savingBank, setSavingBank] = useState(false);
  const [verifyingBank, setVerifyingBank] = useState(false);
  const [bankFeedback, setBankFeedback] = useState({ type: '', text: '' });

  // Payout Request State
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutNotes, setPayoutNotes] = useState('');
  const [requestingPayout, setRequestingPayout] = useState(false);

  // Verification submission state
  const [docType, setDocType] = useState('Trade License');
  const [docNumber, setDocNumber] = useState('');
  const [verifying, setVerifying] = useState(false);

  // New Service Modal state
  const [showAddService, setShowAddService] = useState(false);
  const [srvTitle, setSrvTitle] = useState('');
  const [srvCategory, setSrvCategory] = useState('Electrical');
  const [srvPrice, setSrvPrice] = useState(400);
  const [srvPriceType, setSrvPriceType] = useState('hourly');
  const [srvDuration, setSrvDuration] = useState(60);
  const [srvDesc, setSrvDesc] = useState('');
  const [creatingService, setCreatingService] = useState(false);

  // Payment Recording Modal state
  const [activePaymentBooking, setActivePaymentBooking] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [upiRef, setUpiRef] = useState('');
  const [reportingPayment, setReportingPayment] = useState(false);

  // Chat Drawer state
  const [activeChatBooking, setActiveChatBooking] = useState(null);

  const fetchProviderData = async () => {
    setLoading(true);
    try {
      const [profRes, bkgRes, bnkRes, finRes] = await Promise.all([
        apiGetMyProviderProfile().catch(() => ({})),
        apiGetBookings().catch(() => ({})),
        apiGetBankDetails().catch(() => ({})),
        apiGetProviderFinance().catch(() => ({})),
      ]);

      if (profRes.success) setProfileData(profRes);
      if (bkgRes.success) setBookings(bkgRes.bookings || []);
      if (bnkRes.success && bnkRes.bankAccount) {
        setBankData(bnkRes);
        setBankForm((prev) => ({
          ...prev,
          accountHolderName: bnkRes.bankAccount.accountHolderName || '',
          accountNumber: bnkRes.bankAccount.accountNumberMasked || '',
          confirmAccountNumber: bnkRes.bankAccount.accountNumberMasked || '',
          ifsc: bnkRes.bankAccount.ifsc || '',
          bankName: bnkRes.bankAccount.bankName || '',
          upiId: bnkRes.bankAccount.upiId || '',
          businessType: bnkRes.bankAccount.businessType || 'individual',
        }));
      }
      if (finRes.success) setFinanceData(finRes);
    } catch (err) {
      console.error('Failed to load provider dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviderData();
  }, []);

  const handleBookingAction = async (bookingId, status) => {
    try {
      const res = await apiUpdateBookingStatus(bookingId, { status });
      if (res.success) {
        fetchProviderData();
      }
    } catch (err) {
      alert(err.message || 'Action failed.');
    }
  };

  const handleSaveBankDetails = async (e) => {
    e.preventDefault();
    setBankFeedback({ type: '', text: '' });

    if (!bankForm.accountNumber || bankForm.accountNumber.includes('•')) {
      if (!bankData?.bankAccount?.accountNumberMasked) {
        setBankFeedback({ type: 'error', text: 'Please enter a valid bank account number.' });
        return;
      }
    } else if (bankForm.accountNumber !== bankForm.confirmAccountNumber) {
      setBankFeedback({ type: 'error', text: 'Bank account number and confirm account number must match exactly.' });
      return;
    }

    setSavingBank(true);
    try {
      const res = await apiUpdateBankDetails(bankForm);
      if (res.success) {
        setBankFeedback({ type: 'success', text: 'Bank details saved successfully. Ready for gateway verification.' });
        fetchProviderData();
      } else {
        setBankFeedback({ type: 'error', text: res.message || 'Failed to save bank details.' });
      }
    } catch (err) {
      setBankFeedback({ type: 'error', text: err.message || 'Error updating bank details.' });
    } finally {
      setSavingBank(false);
    }
  };

  const handleVerifyBankDetails = async () => {
    setBankFeedback({ type: '', text: '' });
    setVerifyingBank(true);
    try {
      const res = await apiVerifyBankDetails();
      if (res.success) {
        setBankFeedback({ type: 'success', text: `Gateway onboarding successful! Vendor ID: ${res.gatewayVendorId}. Your account is verified for instant payouts.` });
        fetchProviderData();
      } else {
        setBankFeedback({ type: 'error', text: res.message || 'Bank verification failed with gateway.' });
      }
    } catch (err) {
      setBankFeedback({ type: 'error', text: err.message || 'Gateway verification error.' });
    } finally {
      setVerifyingBank(false);
    }
  };

  const handleRequestPayout = async (e) => {
    e.preventDefault();
    const amount = Number(payoutAmount);
    if (!amount || amount <= 0) {
      alert('Please enter a valid payout amount.');
      return;
    }

    setRequestingPayout(true);
    try {
      const res = await apiProviderRequestPayout(amount, payoutNotes);
      if (res.success) {
        alert(`Payout of ₹${amount} initiated successfully via Cashfree! Reference: ${res.payout?.transferId || 'TXN_SUCCESS'}`);
        setShowPayoutModal(false);
        setPayoutAmount('');
        setPayoutNotes('');
        fetchProviderData();
      } else {
        alert(res.message || 'Payout transfer failed.');
      }
    } catch (err) {
      alert(err.message || 'Payout transfer error.');
    } finally {
      setRequestingPayout(false);
    }
  };

  const handleDownloadCsvStatement = () => {
    const token = localStorage.getItem('nexora_token');
    const url = `/api/providers/statement/download`;
    
    // Trigger download using an anchor tag with auth header fetch
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.blob())
      .then((blob) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `NEXORA_Provider_Statement_${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch((err) => alert('Failed to download statement: ' + err.message));
  };

  const handleSubmitVerification = async (e) => {
    e.preventDefault();
    if (!docNumber.trim()) return;

    setVerifying(true);
    try {
      const res = await apiSubmitVerification({ docType, docNumber: docNumber.trim() });
      if (res.success) {
        alert('Verification submitted! An administrator will review your documents shortly.');
        setDocNumber('');
        fetchProviderData();
      }
    } catch (err) {
      alert(err.message || 'Verification submission failed.');
    } finally {
      setVerifying(false);
    }
  };

  const handleCreateService = async (e) => {
    e.preventDefault();
    if (!srvTitle.trim() || !srvDesc.trim()) return;

    setCreatingService(true);
    try {
      const res = await apiCreateService({
        title: srvTitle.trim(),
        category: srvCategory,
        description: srvDesc.trim(),
        price: Number(srvPrice),
        priceType: srvPriceType,
        durationMinutes: Number(srvDuration),
      });

      if (res.success) {
        setShowAddService(false);
        setSrvTitle('');
        setSrvDesc('');
        fetchProviderData();
      }
    } catch (err) {
      alert(err.message || 'Failed to create service.');
    } finally {
      setCreatingService(false);
    }
  };

  const handleRecordPaymentSubmit = async (e) => {
    e.preventDefault();
    if (!activePaymentBooking) return;

    setReportingPayment(true);
    try {
      const res = await apiReportPayment(activePaymentBooking._id, {
        amount: Number(paymentAmount) || activePaymentBooking.agreedPriceSnapshot.totalAmount,
        paymentMethod,
        upiTransactionId: upiRef.trim(),
      });

      if (res.success) {
        alert('Payment collection reported. Customer will receive a confirmation prompt.');
        setActivePaymentBooking(null);
        fetchProviderData();
      }
    } catch (err) {
      alert(err.message || 'Payment reporting failed.');
    } finally {
      setReportingPayment(false);
    }
  };

  const profile = profileData?.profile || {};
  const metrics = profileData?.metrics || {};
  const services = profileData?.services || [];
  const balances = bankData?.balances || financeData?.balances || {
    totalEarnings: 0,
    availableBalance: 0,
    pendingBalance: 0,
    paidAmount: 0,
  };
  const payoutStatus = bankData?.payoutStatus || 'not_submitted';

  const getPayoutStatusBadge = (status) => {
    switch (status) {
      case 'verified':
        return <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full flex items-center"><CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Payouts Verified</span>;
      case 'verification_pending':
        return <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full flex items-center"><Clock className="w-3.5 h-3.5 mr-1 text-amber-600" /> Verification Pending</span>;
      case 'rejected':
        return <span className="bg-rose-100 text-rose-800 text-xs font-bold px-2.5 py-1 rounded-full flex items-center"><X className="w-3.5 h-3.5 mr-1 text-rose-600" /> Rejected</span>;
      case 'suspended':
        return <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2.5 py-1 rounded-full">Suspended</span>;
      default:
        return <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2.5 py-1 rounded-full">Not Submitted</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Bar */}
      <div className="bg-white p-6 rounded-3xl border border-surface-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <img
            src={user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${profile.businessName || 'Provider'}&backgroundColor=0F382C`}
            alt="Provider"
            className="w-16 h-16 rounded-2xl object-cover border-2 border-forest-800 shadow-sm"
          />
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-gray-900">{profile.businessName || user?.name}</h1>
              {profile.verificationStatus === 'approved' ? (
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Verified
                </span>
              ) : (
                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  KYC: {profile.verificationStatus || 'Unsubmitted'}
                </span>
              )}
              {getPayoutStatusBadge(payoutStatus)}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Trade: <strong className="text-forest-800">{profile.category}</strong> • Base Rate: ₹{profile.hourlyRate}/hr
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowPayoutModal(true)}
            disabled={payoutStatus !== 'verified' || balances.availableBalance <= 0}
            className="flex items-center space-x-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all"
          >
            <Wallet className="w-4 h-4" />
            <span>Withdraw Balance (₹{balances.availableBalance})</span>
          </button>

          <button
            onClick={() => setShowAddService(true)}
            className="flex items-center space-x-1.5 bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Service</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-surface-200 pb-2">
        {[
          { id: 'pipeline', label: `Job Pipeline (${bookings.length})`, icon: Briefcase },
          { id: 'finance', label: 'Earnings & Financials', icon: IndianRupee },
          { id: 'bank', label: 'Bank Details & Payout Settings', icon: Landmark },
          { id: 'services', label: `My Services (${services.length})`, icon: Clock },
          { id: 'verification', label: 'Identity Verification', icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 text-xs px-4 py-2 rounded-xl font-bold transition-colors ${
                activeTab === tab.id
                  ? 'bg-forest-800 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-surface-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: JOB PIPELINE */}
      {activeTab === 'pipeline' && (
        <div className="space-y-6">
          
          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-surface-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Available to Withdraw</span>
              <div className="text-2xl font-black text-emerald-700 mt-1">₹{balances.availableBalance}</div>
              <span className="text-[10px] text-gray-400">Ready for instant bank transfer</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-surface-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Pending in Escrow</span>
              <div className="text-2xl font-black text-amber-600 mt-1">₹{balances.pendingBalance}</div>
              <span className="text-[10px] text-gray-400">Releases upon job completion</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-surface-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Lifetime Earnings</span>
              <div className="text-2xl font-black text-forest-900 mt-1">₹{balances.totalEarnings}</div>
              <span className="text-[10px] text-gray-400">{metrics.completedCount || 0} completed bookings</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-surface-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Payouts Received</span>
              <div className="text-2xl font-black text-blue-700 mt-1">₹{balances.paidAmount}</div>
              <span className="text-[10px] text-gray-400">Disbursed to bank account</span>
            </div>
          </div>

          {/* Bookings List */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Incoming Bookings & Workflow</h2>

            {bookings.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-surface-200 text-xs text-gray-500">
                No booking requests yet. When customers book your services, requests will appear here.
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((b) => (
                  <div
                    key={b._id}
                    className="bg-white rounded-2xl border border-surface-200 p-5 shadow-xs space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-100 pb-3">
                      <div>
                        <span className="text-[10px] text-gray-400 font-mono font-bold">
                          Ref: #{b.bookingReference}
                        </span>
                        <h4 className="text-base font-bold text-gray-900">{b.service?.title}</h4>
                        <p className="text-xs text-gray-600">
                          Customer: <strong className="text-gray-900">{b.customer?.name}</strong> • Phone: {b.customer?.phone || '+91 98XXX XXXXX'}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-base font-black text-forest-900 block">
                          ₹{b.agreedPriceSnapshot?.totalAmount}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          Your Net Share: <strong className="text-emerald-700">₹{b.agreedPriceSnapshot?.providerShare || Math.round(b.agreedPriceSnapshot?.totalAmount * 0.9)}</strong> (after 10% fee)
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-600 bg-surface-50 p-3 rounded-xl">
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="w-3.5 h-3.5 text-forest-700" />
                        <span>{b.scheduledDate} at {b.scheduledTime}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <Clock className="w-3.5 h-3.5 text-forest-700" />
                        <span>{b.durationHours} Hours</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <MapPin className="w-3.5 h-3.5 text-forest-700" />
                        <span>{b.serviceLocation?.locality || 'Bandra'}</span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-600 bg-white p-3 rounded-xl border border-surface-200">
                      <strong className="text-gray-900">Task Notes:</strong> {b.taskDescription}
                    </p>

                    {/* Escrow Status Banner */}
                    {b.paymentStatus === 'paid' && (
                      <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl flex items-center justify-between text-xs text-emerald-900">
                        <div className="flex items-center space-x-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>
                            <strong>Online Payment Received & Escrowed:</strong> ₹{b.agreedPriceSnapshot?.providerShare || Math.round(b.agreedPriceSnapshot?.totalAmount * 0.9)} will automatically transfer to your Available Balance when you mark this job completed.
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Actions Row */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <button
                        onClick={() => setActiveChatBooking(b)}
                        className="flex items-center space-x-1.5 text-xs font-bold text-forest-800 hover:bg-forest-50 px-3 py-1.5 rounded-lg border border-forest-200 transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Message Customer</span>
                      </button>

                      <div className="flex items-center space-x-2">
                        {b.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleBookingAction(b._id, 'rejected')}
                              className="text-xs text-rose-600 hover:bg-rose-50 font-bold px-3 py-1.5 rounded-lg transition-colors"
                            >
                              Decline
                            </button>
                            <button
                              onClick={() => handleBookingAction(b._id, 'accepted')}
                              className="flex items-center space-x-1 bg-forest-800 hover:bg-forest-900 text-white text-xs font-bold px-4 py-1.5 rounded-lg shadow-sm"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Accept Booking</span>
                            </button>
                          </>
                        )}

                        {b.status === 'accepted' && (
                          <button
                            onClick={() => handleBookingAction(b._id, 'in_progress')}
                            className="bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold px-4 py-1.5 rounded-lg shadow-sm"
                          >
                            Start Job (In Progress)
                          </button>
                        )}

                        {b.status === 'in_progress' && (
                          <button
                            onClick={() => handleBookingAction(b._id, 'completed')}
                            className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-1.5 rounded-lg shadow-sm flex items-center space-x-1"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Mark Completed & Release Escrow</span>
                          </button>
                        )}

                        {b.status === 'completed' && b.paymentStatus !== 'paid' && (
                          <button
                            onClick={() => {
                              setActivePaymentBooking(b);
                              setPaymentAmount(b.agreedPriceSnapshot?.totalAmount);
                            }}
                            className="flex items-center space-x-1 bg-forest-800 hover:bg-forest-900 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-sm"
                          >
                            <IndianRupee className="w-3.5 h-3.5" />
                            <span>Record Direct Cash/UPI Received</span>
                          </button>
                        )}

                        {b.status === 'completed' && b.paymentStatus === 'paid' && (
                          <span className="text-xs font-bold text-emerald-700 flex items-center">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Completed & Credited
                          </span>
                        )}
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: EARNINGS & FINANCIAL DASHBOARD (MODULE 6) */}
      {activeTab === 'finance' && (
        <div className="space-y-6">
          
          {/* Detailed Financial Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-surface-200">
              <span className="text-[10px] font-bold uppercase text-gray-400">Total Net Earnings</span>
              <div className="text-2xl font-black text-gray-900 mt-1">₹{financeData?.summary?.totalEarnings || balances.totalEarnings}</div>
              <span className="text-[10px] text-gray-500">Gross: ₹{financeData?.summary?.totalGrossRevenue || balances.totalEarnings}</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-surface-200">
              <span className="text-[10px] font-bold uppercase text-gray-400">Today's Earnings</span>
              <div className="text-2xl font-black text-forest-800 mt-1">₹{financeData?.summary?.todayEarnings || 0}</div>
              <span className="text-[10px] text-gray-500">Weekly: ₹{financeData?.summary?.weeklyEarnings || 0}</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-surface-200">
              <span className="text-[10px] font-bold uppercase text-gray-400">Available Balance</span>
              <div className="text-2xl font-black text-emerald-700 mt-1">₹{balances.availableBalance}</div>
              <button
                onClick={() => setShowPayoutModal(true)}
                disabled={payoutStatus !== 'verified' || balances.availableBalance <= 0}
                className="mt-2 text-[11px] font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 px-3 py-1 rounded-lg w-full transition-colors"
              >
                Request Payout
              </button>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-surface-200">
              <span className="text-[10px] font-bold uppercase text-gray-400">Commission Deducted</span>
              <div className="text-2xl font-black text-amber-700 mt-1">₹{financeData?.summary?.totalCommissionDeducted || 0}</div>
              <span className="text-[10px] text-gray-500">Monthly: ₹{financeData?.summary?.monthlyEarnings || 0}</span>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between bg-surface-50 p-4 rounded-2xl border border-surface-200">
            <div>
              <h3 className="font-bold text-sm text-gray-900">Financial Ledger & Statement</h3>
              <p className="text-xs text-gray-500">Export audited transaction breakdown and payout history for tax filing.</p>
            </div>
            <button
              onClick={handleDownloadCsvStatement}
              className="flex items-center space-x-1.5 bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-sm transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Download Statement (CSV)</span>
            </button>
          </div>

          {/* Transaction History Table */}
          <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-surface-200">
              <h4 className="font-bold text-sm text-gray-900">Marketplace Transactions & Settlement Log</h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="bg-surface-50 text-[10px] font-bold uppercase text-gray-500 border-b border-surface-200">
                  <tr>
                    <th className="p-3.5">Booking Ref</th>
                    <th className="p-3.5">Customer</th>
                    <th className="p-3.5">Service</th>
                    <th className="p-3.5">Gross Amount</th>
                    <th className="p-3.5">Commission</th>
                    <th className="p-3.5">Net Payout</th>
                    <th className="p-3.5">Payment Mode</th>
                    <th className="p-3.5">Payout Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {(!financeData?.transactions || financeData.transactions.length === 0) ? (
                    <tr>
                      <td colSpan="8" className="text-center p-8 text-gray-400">
                        No transactions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    financeData.transactions.map((txn) => (
                      <tr key={txn.id} className="hover:bg-surface-50/70 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-forest-900">#{txn.bookingRef}</td>
                        <td className="p-3.5 text-gray-900">{txn.customer}</td>
                        <td className="p-3.5">{txn.service}</td>
                        <td className="p-3.5 font-bold text-gray-900">₹{txn.grossAmount}</td>
                        <td className="p-3.5 text-amber-700">₹{txn.commissionAmount} ({txn.commissionRate}%)</td>
                        <td className="p-3.5 font-bold text-emerald-800">₹{txn.providerShare}</td>
                        <td className="p-3.5 font-mono uppercase text-[10px]">{txn.paymentMethod}</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            txn.payoutStatus === 'completed'
                              ? 'bg-blue-100 text-blue-800'
                              : txn.payoutStatus === 'available'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {txn.payoutStatus}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BANK DETAILS & PAYOUT SETTINGS (MODULE 2) */}
      {activeTab === 'bank' && (
        <div className="space-y-6">
          
          {/* Status Header */}
          <div className="bg-white p-6 rounded-3xl border border-surface-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-forest-700">Vendor Payout Onboarding</span>
              <h3 className="text-lg font-bold text-gray-900">Bank Account & Cashfree Easy Split Status</h3>
              <p className="text-xs text-gray-500">
                To receive automated direct deposits for online customer payments, your bank account must be verified.
              </p>
            </div>
            <div>
              {getPayoutStatusBadge(payoutStatus)}
            </div>
          </div>

          {bankFeedback.text && (
            <div className={`p-4 rounded-2xl border text-xs flex items-center space-x-2 ${
              bankFeedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              {bankFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />}
              <span>{bankFeedback.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Form Column */}
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-surface-200 shadow-xs space-y-5">
              <h4 className="font-bold text-sm text-gray-900 border-b border-surface-100 pb-3">
                Indian Bank Account Details (NEFT / RTGS / IMPS / UPI)
              </h4>

              <form onSubmit={handleSaveBankDetails} className="space-y-4">
                
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Account Holder Name *</label>
                  <input
                    type="text"
                    required
                    value={bankForm.accountHolderName}
                    onChange={(e) => setBankForm({ ...bankForm, accountHolderName: e.target.value })}
                    placeholder="As printed on bank passbook / cheque"
                    className="w-full text-xs p-2.5 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-forest-800"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Bank Account Number *</label>
                    <input
                      type="text"
                      required
                      value={bankForm.accountNumber}
                      onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                      placeholder="e.g. 918237461928"
                      className="w-full text-xs p-2.5 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-forest-800 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Confirm Account Number *</label>
                    <input
                      type="text"
                      required
                      value={bankForm.confirmAccountNumber}
                      onChange={(e) => setBankForm({ ...bankForm, confirmAccountNumber: e.target.value })}
                      placeholder="Re-enter bank account number"
                      className="w-full text-xs p-2.5 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-forest-800 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">IFSC Code *</label>
                    <input
                      type="text"
                      required
                      value={bankForm.ifsc}
                      onChange={(e) => setBankForm({ ...bankForm, ifsc: e.target.value.toUpperCase() })}
                      placeholder="e.g. HDFC0001234"
                      maxLength={11}
                      className="w-full text-xs p-2.5 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-forest-800 font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={bankForm.bankName}
                      onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                      placeholder="e.g. HDFC Bank, Bandra West Branch"
                      className="w-full text-xs p-2.5 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-forest-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Virtual Payment Address (UPI ID)</label>
                    <input
                      type="text"
                      value={bankForm.upiId}
                      onChange={(e) => setBankForm({ ...bankForm, upiId: e.target.value })}
                      placeholder="e.g. rajesh@okhdfcbank"
                      className="w-full text-xs p-2.5 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-forest-800 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Business Entity Type</label>
                    <select
                      value={bankForm.businessType}
                      onChange={(e) => setBankForm({ ...bankForm, businessType: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-xl border border-surface-200 bg-white"
                    >
                      <option value="individual">Individual / Sole Proprietor</option>
                      <option value="partnership">Partnership Firm</option>
                      <option value="llp">Limited Liability Partnership (LLP)</option>
                      <option value="pvt_ltd">Private Limited Company</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-3">
                  <button
                    type="submit"
                    disabled={savingBank}
                    className="flex-1 bg-forest-800 hover:bg-forest-900 disabled:opacity-50 text-white font-bold text-xs py-2.5 rounded-xl shadow-md transition-colors"
                  >
                    {savingBank ? 'Saving...' : 'Save Bank Details'}
                  </button>

                  <button
                    type="button"
                    onClick={handleVerifyBankDetails}
                    disabled={verifyingBank || !bankForm.ifsc}
                    className="flex-1 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs py-2.5 rounded-xl shadow-md transition-colors flex items-center justify-center space-x-1.5"
                  >
                    {verifyingBank ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Verifying with Cashfree...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 text-emerald-300" />
                        <span>Verify with Gateway (Cashfree)</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            </div>

            {/* Info / Balances Column */}
            <div className="space-y-4">
              <div className="bg-forest-900 text-white p-5 rounded-3xl shadow-sm space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  Payout Readiness
                </span>
                <div className="text-xl font-bold">
                  {payoutStatus === 'verified' ? 'Eligible for Payouts' : 'Action Required'}
                </div>
                <p className="text-xs text-forest-200 leading-relaxed">
                  Marketplace funds are disbursed directly to your registered bank account upon job completion.
                </p>
                <div className="pt-2 border-t border-forest-800 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-forest-300">Gateway Vendor ID:</span>
                    <span className="font-mono text-emerald-400">{bankData?.bankAccount?.gatewayVendorId || 'Not Linked'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-forest-300">Available Balance:</span>
                    <span className="font-bold text-white">₹{balances.availableBalance}</span>
                  </div>
                </div>
              </div>

              <div className="bg-surface-50 p-4 rounded-2xl border border-surface-200 text-xs text-gray-600 space-y-2">
                <div className="font-bold text-gray-900 flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Security & Gateway Compliance</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  NEXORA never stores your full plain-text bank credentials in public tables. Accounts are linked via Cashfree's PCI-DSS Level 1 compliant vendor payout APIs.
                </p>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 4: MY SERVICES */}
      {activeTab === 'services' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Published Hyperlocal Services ({services.length})</h2>
            <button
              onClick={() => setShowAddService(true)}
              className="text-xs font-bold text-forest-800 hover:underline flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Service</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((srv) => (
              <div key={srv._id} className="bg-white p-4 rounded-2xl border border-surface-200 shadow-xs space-y-2">
                <span className="text-[10px] font-bold uppercase text-forest-800 bg-forest-50 px-2 py-0.5 rounded-full">
                  {srv.category}
                </span>
                <h4 className="font-bold text-sm text-gray-900 line-clamp-1">{srv.title}</h4>
                <p className="text-xs text-gray-500 line-clamp-2">{srv.description}</p>
                <div className="pt-2 border-t border-surface-100 flex items-center justify-between text-xs font-bold">
                  <span className="text-forest-900">₹{srv.price} {srv.priceType === 'hourly' ? '/hr' : 'fixed'}</span>
                  <span className="text-[11px] text-emerald-700">Active</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: IDENTITY VERIFICATION */}
      {activeTab === 'verification' && (
        <div className="bg-white p-6 rounded-3xl border border-surface-200 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-base text-gray-900 flex items-center">
                <ShieldCheck className="w-5 h-5 text-emerald-600 mr-2" />
                Provider Trust & KYC Verification
              </h3>
              <p className="text-xs text-gray-600 mt-1 max-w-xl">
                Verified badge boosts your profile ranking and unlocks customer trust across Mumbai neighborhoods.
              </p>
            </div>
            <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${
              profile.verificationStatus === 'approved'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}>
              {profile.verificationStatus || 'Unsubmitted'}
            </span>
          </div>

          <form onSubmit={handleSubmitVerification} className="flex flex-col sm:flex-row items-center gap-3 pt-3">
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full sm:w-48 text-xs p-2.5 rounded-xl border border-surface-200 bg-white"
            >
              <option value="Trade License">Trade License</option>
              <option value="Aadhaar">Aadhaar Card</option>
              <option value="PAN">PAN Card</option>
              <option value="Passport">Passport</option>
            </select>

            <input
              type="text"
              required
              value={docNumber}
              onChange={(e) => setDocNumber(e.target.value)}
              placeholder="Enter Document / License ID Number"
              className="flex-1 w-full text-xs p-2.5 rounded-xl border border-surface-200 bg-white focus:outline-none"
            />

            <button
              type="submit"
              disabled={verifying}
              className="w-full sm:w-auto bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm transition-all"
            >
              {verifying ? 'Submitting...' : 'Submit Documents'}
            </button>
          </form>
        </div>
      )}

      {/* Payout Request Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-surface-200 space-y-4">
            <div className="flex justify-between items-center border-b border-surface-200 pb-3">
              <h3 className="font-bold text-base text-gray-900 flex items-center">
                <Wallet className="w-5 h-5 text-emerald-600 mr-2" />
                Disburse Payout to Bank
              </h3>
              <button onClick={() => setShowPayoutModal(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRequestPayout} className="space-y-4">
              <div className="bg-surface-50 p-3 rounded-2xl border border-surface-200 text-xs space-y-1">
                <div className="flex justify-between text-gray-600">
                  <span>Available Balance:</span>
                  <strong className="text-emerald-700">₹{balances.availableBalance}</strong>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Target Account:</span>
                  <span className="font-mono">{bankData?.bankAccount?.accountNumberMasked || 'Verified Account'}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Withdrawal Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={balances.availableBalance}
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  placeholder={`Max ₹${balances.availableBalance}`}
                  className="w-full text-xs p-2.5 rounded-xl border border-surface-200 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-forest-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Transfer Note / Memo</label>
                <input
                  type="text"
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  placeholder="e.g. Weekly settlement withdrawal"
                  className="w-full text-xs p-2.5 rounded-xl border border-surface-200 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={requestingPayout || Number(payoutAmount) > balances.availableBalance || Number(payoutAmount) <= 0}
                className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs py-3 rounded-xl shadow-md transition-colors"
              >
                {requestingPayout ? 'Transferring via Cashfree...' : `Confirm Transfer of ₹${payoutAmount || 0}`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add New Service Modal */}
      {showAddService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-surface-200 space-y-4">
            <div className="flex justify-between items-center border-b border-surface-200 pb-3">
              <h3 className="font-bold text-base text-gray-900">Publish New Service</h3>
              <button onClick={() => setShowAddService(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateService} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Service Title *</label>
                <input
                  type="text"
                  required
                  value={srvTitle}
                  onChange={(e) => setSrvTitle(e.target.value)}
                  placeholder="e.g. Master Bedroom Inverter Cable & Battery Setup"
                  className="w-full text-xs p-2.5 rounded-xl border border-surface-200 focus:outline-none focus:ring-2 focus:ring-forest-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Category</label>
                  <select
                    value={srvCategory}
                    onChange={(e) => setSrvCategory(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-surface-200 bg-white"
                  >
                    {['Electrical', 'Plumbing', 'Home Cleaning', 'Carpentry', 'Painting', 'Appliance Repair', 'Gardening', 'Moving & Helpers'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={srvPrice}
                    onChange={(e) => setSrvPrice(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-surface-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Service Details *</label>
                <textarea
                  required
                  rows={3}
                  value={srvDesc}
                  onChange={(e) => setSrvDesc(e.target.value)}
                  placeholder="Describe your equipment, diagnostic process and guarantees..."
                  className="w-full text-xs p-2.5 rounded-xl border border-surface-200 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={creatingService}
                className="w-full bg-forest-800 hover:bg-forest-900 disabled:opacity-50 text-white font-bold text-xs py-3 rounded-xl shadow-md transition-colors"
              >
                {creatingService ? 'Publishing...' : 'Publish Service to Marketplace'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {activePaymentBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-surface-200 space-y-4">
            <div className="flex justify-between items-center border-b border-surface-200 pb-3">
              <h3 className="font-bold text-base text-gray-900">Record Direct Payment</h3>
              <button onClick={() => setActivePaymentBooking(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Amount Collected (₹)</label>
                <input
                  type="number"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-surface-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Collection Mode</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-surface-200 bg-white"
                >
                  <option value="upi">Direct UPI (PhonePe / GPay / Paytm)</option>
                  <option value="cash">Direct Cash Handover</option>
                </select>
              </div>

              {paymentMethod === 'upi' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">UPI Transaction Reference</label>
                  <input
                    type="text"
                    value={upiRef}
                    onChange={(e) => setUpiRef(e.target.value)}
                    placeholder="e.g. 408271829102"
                    className="w-full text-xs p-2.5 rounded-xl border border-surface-200 font-mono"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={reportingPayment}
                className="w-full bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs py-3 rounded-xl shadow-md transition-colors"
              >
                {reportingPayment ? 'Submitting...' : 'Submit Payment Report'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Chat Drawer */}
      <ChatDrawer
        isOpen={!!activeChatBooking}
        onClose={() => setActiveChatBooking(null)}
        booking={activeChatBooking}
      />

    </div>
  );
};
