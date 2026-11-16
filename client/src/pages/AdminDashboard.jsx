import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  apiGetAdminStats, 
  apiGetAdminCustomers,
  apiGetAdminProviders,
  apiGetAdminServices,
  apiGetAdminBookings,
  apiGetAdminPayments,
  apiGetAdminPayouts,
  apiInitiateAdminPayout,
  apiGetCommissionSettings,
  apiUpdateCommissionSettings,
  apiGetFinancialReports,
  apiProcessRefund,
  apiReviewVerification, 
  apiToggleUserStatus,
  apiGetAuditLogs 
} from '../api/client.js';
import { 
  LayoutDashboard,
  Users, 
  UserCheck,
  Briefcase, 
  Calendar,
  CreditCard,
  Wallet,
  Percent,
  BarChart3,
  Settings,
  LogOut,
  IndianRupee, 
  ShieldCheck, 
  AlertTriangle, 
  Check, 
  X, 
  Search, 
  RefreshCw,
  Lock,
  Unlock,
  History,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  RotateCcw,
  Menu,
  ChevronRight,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';

export const AdminDashboard = () => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  // Navigation State (11 views)
  const [activeNav, setActiveNav] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data States
  const [stats, setStats] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [providers, setProviders] = useState([]);
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [commissionSettings, setCommissionSettings] = useState(null);
  const [reports, setReports] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals & Action States
  const [selectedBookingRefund, setSelectedBookingRefund] = useState(null);
  const [refundReason, setRefundReason] = useState('');
  const [processingRefund, setProcessingRefund] = useState(false);

  const [selectedPayoutProvider, setSelectedPayoutProvider] = useState(null);
  const [adminPayoutAmount, setAdminPayoutAmount] = useState('');
  const [initiatingPayout, setInitiatingPayout] = useState(false);

  if (!isAdmin) {
    return <Navigate to="/login" replace />;
  }

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      const [sRes, cRes, pRes, srvRes, bRes, payRes, outRes, commRes, repRes, audRes] = await Promise.all([
        apiGetAdminStats().catch(() => ({})),
        apiGetAdminCustomers().catch(() => ({})),
        apiGetAdminProviders().catch(() => ({})),
        apiGetAdminServices().catch(() => ({})),
        apiGetAdminBookings().catch(() => ({})),
        apiGetAdminPayments().catch(() => ({})),
        apiGetAdminPayouts().catch(() => ({})),
        apiGetCommissionSettings().catch(() => ({})),
        apiGetFinancialReports().catch(() => ({})),
        apiGetAuditLogs().catch(() => ({})),
      ]);

      if (sRes.success) setStats(sRes.stats);
      if (cRes.success) setCustomers(cRes.customers || []);
      if (pRes.success) setProviders(pRes.providers || []);
      if (srvRes.success) setServices(srvRes.services || []);
      if (bRes.success) setBookings(bRes.bookings || []);
      if (payRes.success) setPayments(payRes.payments || []);
      if (outRes.success) setPayouts(outRes.payouts || []);
      if (commRes.success) setCommissionSettings(commRes.settings);
      if (repRes.success) setReports(repRes.reports);
      if (audRes.success) setAuditLogs(audRes.logs || []);
    } catch (err) {
      console.error('Failed to load admin portal:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllAdminData();
  }, []);

  // Handlers
  const handleToggleUserStatus = async (userId) => {
    try {
      const res = await apiToggleUserStatus(userId);
      if (res.success) {
        loadAllAdminData();
      }
    } catch (err) {
      alert(err.message || 'Failed to toggle account status.');
    }
  };

  const handleReviewProvider = async (providerId, action) => {
    const feedback = action === 'reject' ? prompt('Reason for rejection:') : 'Documents verified by administrator.';
    if (action === 'reject' && !feedback) return;

    try {
      const res = await apiReviewVerification(providerId, action, feedback);
      if (res.success) {
        alert(`Provider marked as ${action}d.`);
        loadAllAdminData();
      }
    } catch (err) {
      alert(err.message || 'Verification update failed.');
    }
  };

  const handleUpdateCommissionSettings = async (e) => {
    e.preventDefault();
    try {
      const res = await apiUpdateCommissionSettings(commissionSettings);
      if (res.success) {
        alert('Platform commission rules updated successfully!');
        loadAllAdminData();
      }
    } catch (err) {
      alert(err.message || 'Failed to update commission settings.');
    }
  };

  const handleProcessRefund = async (e) => {
    e.preventDefault();
    if (!selectedBookingRefund || !refundReason.trim()) return;

    setProcessingRefund(true);
    try {
      const res = await apiProcessRefund({
        bookingId: selectedBookingRefund._id,
        reason: refundReason.trim(),
      });
      if (res.success) {
        alert(`Refund of ₹${res.refund?.amount} processed successfully! Compensating ledger entries created.`);
        setSelectedBookingRefund(null);
        setRefundReason('');
        loadAllAdminData();
      } else {
        alert(res.message || 'Refund processing failed.');
      }
    } catch (err) {
      alert(err.message || 'Refund error.');
    } finally {
      setProcessingRefund(false);
    }
  };

  const handleInitiateAdminPayout = async (e) => {
    e.preventDefault();
    if (!selectedPayoutProvider || !adminPayoutAmount) return;

    setInitiatingPayout(true);
    try {
      const res = await apiInitiateAdminPayout({
        providerId: selectedPayoutProvider.providerId || selectedPayoutProvider._id,
        amount: Number(adminPayoutAmount),
        notes: 'Admin manual settlement payout',
      });
      if (res.success) {
        alert(`Disbursement of ₹${adminPayoutAmount} completed! Transfer ID: ${res.payout?.transferId}`);
        setSelectedPayoutProvider(null);
        setAdminPayoutAmount('');
        loadAllAdminData();
      } else {
        alert(res.message || 'Payout disbursement failed.');
      }
    } catch (err) {
      alert(err.message || 'Payout error.');
    } finally {
      setInitiatingPayout(false);
    }
  };

  const handleExportCsv = (type) => {
    const token = localStorage.getItem('nexora_token');
    const url = `/api/admin/reports/export?type=${type}`;
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.blob())
      .then((blob) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `NEXORA_${type.toUpperCase()}_EXPORT_${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch((err) => alert('Export failed: ' + err.message));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Nav Items config
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'providers', label: 'Service Providers', icon: UserCheck },
    { id: 'services', label: 'Services', icon: Briefcase },
    { id: 'bookings', label: 'Bookings', icon: Calendar },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'payouts', label: 'Provider Payouts', icon: Wallet },
    { id: 'commissions', label: 'Commission Settings', icon: Percent },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Admin Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col md:flex-row">
      
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-forest-950 text-white p-4 flex items-center justify-between border-b border-forest-800">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-black">N</div>
          <span className="font-bold tracking-wider">NEXORA ADMIN</span>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-forest-950 text-white flex flex-col justify-between transition-transform duration-200
        md:static md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div>
          {/* Logo Brand */}
          <div className="p-6 border-b border-forest-900 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center font-black text-white text-lg shadow-sm">
                N
              </div>
              <div>
                <h2 className="text-base font-bold tracking-wider">NEXORA</h2>
                <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-semibold block">Marketplace Ops</span>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveNav(item.id);
                    setSidebarOpen(false);
                    setSearchTerm('');
                  }}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-forest-800 text-white shadow-sm ring-1 ring-forest-700 font-bold'
                      : 'text-forest-200 hover:bg-forest-900 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-forest-300'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-forest-900 space-y-3">
          <div className="flex items-center space-x-3 px-2">
            <img
              src={user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=Admin&backgroundColor=0F382C`}
              alt="Admin"
              className="w-8 h-8 rounded-lg border border-emerald-500"
            />
            <div className="overflow-hidden">
              <p className="text-xs font-bold truncate">{user?.name || 'Site Owner'}</p>
              <p className="text-[10px] text-emerald-400 truncate">Super Administrator</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-300 hover:bg-rose-950/40 hover:text-rose-200 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto space-y-6">
        
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-surface-200 shadow-xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-forest-700">Enterprise Administration</span>
            <h1 className="text-xl font-bold text-gray-900 capitalize">
              {navItems.find((n) => n.id === activeNav)?.label || activeNav}
            </h1>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={loadAllAdminData}
              className="flex items-center space-x-1.5 text-xs text-forest-800 hover:bg-surface-100 px-3 py-2 rounded-xl border border-surface-200 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync Live Data</span>
            </button>
          </div>
        </div>

        {/* VIEW 1: DASHBOARD (MODULE 1: 12 REQUIRED METRICS & RECENT TRANSACTIONS) */}
        {activeNav === 'dashboard' && (
          <div className="space-y-6">
            
            {/* 12 KPI Metric Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              
              {/* 1. Total Registered Customers */}
              <div className="bg-white p-4 rounded-2xl border border-surface-200 shadow-xs">
                <span className="text-[10px] font-bold uppercase text-gray-400">1. Customers</span>
                <div className="text-2xl font-black text-gray-900 mt-1">{stats?.totalCustomers || 0}</div>
                <span className="text-[10px] text-gray-500">Registered platform buyers</span>
              </div>

              {/* 2. Total Registered Service Providers */}
              <div className="bg-white p-4 rounded-2xl border border-surface-200 shadow-xs">
                <span className="text-[10px] font-bold uppercase text-gray-400">2. Service Providers</span>
                <div className="text-2xl font-black text-forest-800 mt-1">{stats?.totalProviders || 0}</div>
                <span className="text-[10px] text-gray-500">{stats?.activeProviders || 0} active & approved</span>
              </div>

              {/* 3. Total Bookings */}
              <div className="bg-white p-4 rounded-2xl border border-surface-200 shadow-xs">
                <span className="text-[10px] font-bold uppercase text-gray-400">3. Total Bookings</span>
                <div className="text-2xl font-black text-gray-900 mt-1">{stats?.totalBookings || 0}</div>
                <span className="text-[10px] text-gray-500">Lifetime marketplace orders</span>
              </div>

              {/* 4. Completed Bookings */}
              <div className="bg-white p-4 rounded-2xl border border-surface-200 shadow-xs">
                <span className="text-[10px] font-bold uppercase text-gray-400">4. Completed Bookings</span>
                <div className="text-2xl font-black text-emerald-700 mt-1">{stats?.completedBookings || 0}</div>
                <span className="text-[10px] text-gray-500">Successful job deliveries</span>
              </div>

              {/* 5. Pending Bookings */}
              <div className="bg-white p-4 rounded-2xl border border-surface-200 shadow-xs">
                <span className="text-[10px] font-bold uppercase text-gray-400">5. Pending Bookings</span>
                <div className="text-2xl font-black text-amber-600 mt-1">{stats?.pendingBookings || 0}</div>
                <span className="text-[10px] text-gray-500">Scheduled / In progress</span>
              </div>

              {/* 6. Cancelled Bookings */}
              <div className="bg-white p-4 rounded-2xl border border-surface-200 shadow-xs">
                <span className="text-[10px] font-bold uppercase text-gray-400">6. Cancelled Bookings</span>
                <div className="text-2xl font-black text-rose-600 mt-1">{stats?.cancelledBookings || 0}</div>
                <span className="text-[10px] text-gray-500">Customer or provider cancelled</span>
              </div>

              {/* 7. Total Customer Payments */}
              <div className="bg-white p-4 rounded-2xl border border-surface-200 shadow-xs">
                <span className="text-[10px] font-bold uppercase text-gray-400">7. Customer Payments</span>
                <div className="text-2xl font-black text-forest-900 mt-1">₹{stats?.totalCustomerPayments || 0}</div>
                <span className="text-[10px] text-emerald-600 font-medium">Gross Gross Merchandise Value</span>
              </div>

              {/* 8. Total Platform Commission */}
              <div className="bg-white p-4 rounded-2xl border border-surface-200 shadow-xs bg-emerald-50/40">
                <span className="text-[10px] font-bold uppercase text-emerald-800">8. Platform Commission</span>
                <div className="text-2xl font-black text-emerald-800 mt-1">₹{stats?.totalPlatformCommission || 0}</div>
                <span className="text-[10px] text-emerald-700 font-semibold">Net platform retained earnings</span>
              </div>

              {/* 9. Total Provider Earnings */}
              <div className="bg-white p-4 rounded-2xl border border-surface-200 shadow-xs">
                <span className="text-[10px] font-bold uppercase text-gray-400">9. Provider Earnings</span>
                <div className="text-2xl font-black text-blue-700 mt-1">₹{stats?.totalProviderEarnings || 0}</div>
                <span className="text-[10px] text-gray-500">Net allocated to providers</span>
              </div>

              {/* 10. Pending Provider Payouts */}
              <div className="bg-white p-4 rounded-2xl border border-surface-200 shadow-xs">
                <span className="text-[10px] font-bold uppercase text-gray-400">10. Pending Payouts</span>
                <div className="text-2xl font-black text-amber-600 mt-1">₹{stats?.pendingProviderPayouts || 0}</div>
                <span className="text-[10px] text-gray-500">Held in escrow / available balance</span>
              </div>

              {/* 11. Successful Provider Payouts */}
              <div className="bg-white p-4 rounded-2xl border border-surface-200 shadow-xs">
                <span className="text-[10px] font-bold uppercase text-gray-400">11. Successful Payouts</span>
                <div className="text-2xl font-black text-emerald-700 mt-1">₹{stats?.successfulProviderPayouts || 0}</div>
                <span className="text-[10px] text-gray-500">Settled to bank accounts</span>
              </div>

              {/* 12. Escrow Balance Overview */}
              <div className="bg-white p-4 rounded-2xl border border-surface-200 shadow-xs">
                <span className="text-[10px] font-bold uppercase text-gray-400">12. Active Escrow Pool</span>
                <div className="text-2xl font-black text-forest-950 mt-1">₹{stats?.escrowBalance || 0}</div>
                <span className="text-[10px] text-emerald-700 font-semibold">Protected Cashfree escrow</span>
              </div>

            </div>

            {/* Recent Transactions Table */}
            <div className="bg-white rounded-3xl border border-surface-200 overflow-hidden shadow-xs">
              <div className="p-5 border-b border-surface-200 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-gray-900">12. Recent Marketplace Transactions</h3>
                  <p className="text-xs text-gray-500">Latest customer online payments, escrow splits, and cash reconciliations.</p>
                </div>
                <button
                  onClick={() => setActiveNav('payments')}
                  className="text-xs font-bold text-forest-800 hover:underline flex items-center"
                >
                  <span>View All Payments</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-600">
                  <thead className="bg-surface-50 text-[10px] font-bold uppercase text-gray-500 border-b border-surface-200">
                    <tr>
                      <th className="p-3.5">Order / Booking Ref</th>
                      <th className="p-3.5">Customer</th>
                      <th className="p-3.5">Provider</th>
                      <th className="p-3.5">Total Amount</th>
                      <th className="p-3.5">Commission</th>
                      <th className="p-3.5">Provider Share</th>
                      <th className="p-3.5">Method</th>
                      <th className="p-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100">
                    {(!stats?.recentTransactions || stats.recentTransactions.length === 0) ? (
                      <tr>
                        <td colSpan="8" className="text-center p-8 text-gray-400">
                          No recent transactions recorded.
                        </td>
                      </tr>
                    ) : (
                      stats.recentTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-surface-50/70 transition-colors">
                          <td className="p-3.5 font-mono font-bold text-forest-900">#{tx.bookingRef || tx.id}</td>
                          <td className="p-3.5 font-medium text-gray-900">{tx.customer}</td>
                          <td className="p-3.5">{tx.provider}</td>
                          <td className="p-3.5 font-bold text-gray-900">₹{tx.amount}</td>
                          <td className="p-3.5 text-emerald-800 font-semibold">₹{tx.commission}</td>
                          <td className="p-3.5 font-semibold text-gray-900">₹{tx.providerShare}</td>
                          <td className="p-3.5 font-mono uppercase text-[10px]">{tx.method}</td>
                          <td className="p-3.5">
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                              {tx.status}
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

        {/* VIEW 2: CUSTOMERS */}
        {activeNav === 'customers' && (
          <div className="bg-white rounded-3xl border border-surface-200 overflow-hidden shadow-xs space-y-4 p-5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-base text-gray-900">Registered Customers ({customers.length})</h3>
                <p className="text-xs text-gray-500">Manage buyer accounts, review lifetime expenditure and status.</p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search customer name/email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-surface-200 focus:outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="bg-surface-50 text-[10px] font-bold uppercase text-gray-500 border-b border-surface-200">
                  <tr>
                    <th className="p-3.5">Customer Name</th>
                    <th className="p-3.5">Email</th>
                    <th className="p-3.5">Phone</th>
                    <th className="p-3.5">Locality</th>
                    <th className="p-3.5">Total Spent</th>
                    <th className="p-3.5">Bookings</th>
                    <th className="p-3.5">Account Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {customers
                    .filter((c) => 
                      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      c.email?.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((c) => (
                      <tr key={c._id} className="hover:bg-surface-50/70 transition-colors">
                        <td className="p-3.5 font-bold text-gray-900">{c.name}</td>
                        <td className="p-3.5">{c.email}</td>
                        <td className="p-3.5 font-mono">{c.phone || '+91 98XXX XXXXX'}</td>
                        <td className="p-3.5">{c.address?.locality || 'Bandra West'}</td>
                        <td className="p-3.5 font-bold text-emerald-800">₹{c.totalSpent || 0}</td>
                        <td className="p-3.5">{c.bookingCount || 0}</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            c.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {c.isActive ? 'Active' : 'Suspended'}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => handleToggleUserStatus(c._id)}
                            className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors ${
                              c.isActive
                                ? 'text-rose-700 hover:bg-rose-50 border border-rose-200'
                                : 'text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
                            }`}
                          >
                            {c.isActive ? 'Suspend' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 3: SERVICE PROVIDERS */}
        {activeNav === 'providers' && (
          <div className="bg-white rounded-3xl border border-surface-200 overflow-hidden shadow-xs space-y-4 p-5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-base text-gray-900">Service Providers ({providers.length})</h3>
                <p className="text-xs text-gray-500">Review KYC submissions, bank verification statuses, and payout balances.</p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search provider trade/name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-surface-200 focus:outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="bg-surface-50 text-[10px] font-bold uppercase text-gray-500 border-b border-surface-200">
                  <tr>
                    <th className="p-3.5">Provider Business</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">KYC Status</th>
                    <th className="p-3.5">Bank Payout Status</th>
                    <th className="p-3.5">Lifetime Earnings</th>
                    <th className="p-3.5">Available Balance</th>
                    <th className="p-3.5">Pending Escrow</th>
                    <th className="p-3.5 text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {providers
                    .filter((p) => 
                      p.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      p.category?.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((p) => (
                      <tr key={p._id} className="hover:bg-surface-50/70 transition-colors">
                        <td className="p-3.5 font-bold text-gray-900">
                          <div>{p.businessName}</div>
                          <div className="text-[10px] text-gray-400 font-mono">{p.user?.email}</div>
                        </td>
                        <td className="p-3.5 font-medium text-forest-800">{p.category}</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            p.verificationStatus === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {p.verificationStatus}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.bankAccount?.payoutStatus === 'verified'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-surface-200 text-gray-700'
                          }`}>
                            {p.bankAccount?.payoutStatus || 'Not Linked'}
                          </span>
                        </td>
                        <td className="p-3.5 font-bold text-gray-900">₹{p.totalEarnings || 0}</td>
                        <td className="p-3.5 font-bold text-emerald-800">₹{p.availableBalance || 0}</td>
                        <td className="p-3.5 font-bold text-amber-700">₹{p.pendingBalance || 0}</td>
                        <td className="p-3.5 text-right space-x-1.5">
                          {p.verificationStatus === 'pending' && (
                            <>
                              <button
                                onClick={() => handleReviewProvider(p._id, 'approve')}
                                className="bg-emerald-700 text-white text-[10px] font-bold px-2.5 py-1 rounded-md"
                              >
                                Approve KYC
                              </button>
                              <button
                                onClick={() => handleReviewProvider(p._id, 'reject')}
                                className="bg-rose-700 text-white text-[10px] font-bold px-2 py-1 rounded-md"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => {
                              setSelectedPayoutProvider(p);
                              setAdminPayoutAmount(p.availableBalance > 0 ? p.availableBalance : '');
                            }}
                            disabled={p.availableBalance <= 0 || p.bankAccount?.payoutStatus !== 'verified'}
                            className="bg-forest-800 hover:bg-forest-900 disabled:opacity-40 text-white text-[10px] font-bold px-2.5 py-1 rounded-md"
                          >
                            Disburse
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 4: SERVICES */}
        {activeNav === 'services' && (
          <div className="bg-white rounded-3xl border border-surface-200 p-5 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base text-gray-900">All Marketplace Services ({services.length})</h3>
                <p className="text-xs text-gray-500">Catalog of published services across all categories.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((srv) => (
                <div key={srv._id} className="p-4 rounded-2xl border border-surface-200 bg-surface-50 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold uppercase text-forest-800 bg-forest-100 px-2 py-0.5 rounded-full">
                      {srv.category}
                    </span>
                    <span className="text-xs font-black text-gray-900">₹{srv.price} {srv.priceType === 'hourly' ? '/hr' : 'fixed'}</span>
                  </div>
                  <h4 className="font-bold text-sm text-gray-900">{srv.title}</h4>
                  <p className="text-xs text-gray-500 line-clamp-2">{srv.description}</p>
                  <p className="text-[11px] text-gray-400">Provider: <strong>{srv.provider?.businessName || 'Local Pro'}</strong></p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 5: BOOKINGS */}
        {activeNav === 'bookings' && (
          <div className="bg-white rounded-3xl border border-surface-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-base text-gray-900">All Bookings ({bookings.length})</h3>
                <p className="text-xs text-gray-500">Track job progress, payment states, and trigger refunds if necessary.</p>
              </div>

              <div className="flex items-center space-x-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs p-2 rounded-xl border border-surface-200 bg-white"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="bg-surface-50 text-[10px] font-bold uppercase text-gray-500 border-b border-surface-200">
                  <tr>
                    <th className="p-3.5">Ref</th>
                    <th className="p-3.5">Service</th>
                    <th className="p-3.5">Customer</th>
                    <th className="p-3.5">Provider</th>
                    <th className="p-3.5">Scheduled</th>
                    <th className="p-3.5">Total Amount</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Payment</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {bookings
                    .filter((b) => statusFilter === 'all' || b.status === statusFilter)
                    .map((b) => (
                      <tr key={b._id} className="hover:bg-surface-50/70 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-forest-900">#{b.bookingReference}</td>
                        <td className="p-3.5 font-medium text-gray-900">{b.service?.title}</td>
                        <td className="p-3.5">{b.customer?.name}</td>
                        <td className="p-3.5">{b.provider?.businessName}</td>
                        <td className="p-3.5">{b.scheduledDate} {b.scheduledTime}</td>
                        <td className="p-3.5 font-bold text-gray-900">₹{b.agreedPriceSnapshot?.totalAmount}</td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-200 uppercase">
                            {b.status}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            b.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {b.paymentStatus}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          {b.paymentStatus === 'paid' && b.status !== 'completed' && !b.refundDetails && (
                            <button
                              onClick={() => setSelectedBookingRefund(b)}
                              className="text-rose-700 hover:bg-rose-50 border border-rose-200 text-[10px] font-bold px-2 py-1 rounded-md"
                            >
                              Refund
                            </button>
                          )}
                          {b.refundDetails && (
                            <span className="text-[10px] text-purple-700 font-bold">Refunded</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 6: PAYMENTS & TRANSACTIONS (MODULE 7) */}
        {activeNav === 'payments' && (
          <div className="bg-white rounded-3xl border border-surface-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-base text-gray-900">Payments & Gateway Transactions ({payments.length})</h3>
                <p className="text-xs text-gray-500">Every customer payment, Cashfree split configuration, and signature verification status.</p>
              </div>

              <button
                onClick={() => handleExportCsv('payments')}
                className="flex items-center space-x-1.5 bg-forest-800 hover:bg-forest-900 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export Payments CSV</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="bg-surface-50 text-[10px] font-bold uppercase text-gray-500 border-b border-surface-200">
                  <tr>
                    <th className="p-3.5">Gateway Order ID</th>
                    <th className="p-3.5">Booking Ref</th>
                    <th className="p-3.5">Payer</th>
                    <th className="p-3.5">Gross Amount</th>
                    <th className="p-3.5">Commission (Paise Safe)</th>
                    <th className="p-3.5">Provider Escrow Share</th>
                    <th className="p-3.5">Date & Time</th>
                    <th className="p-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center p-8 text-gray-400">No payment records found.</td>
                    </tr>
                  ) : (
                    payments.map((p) => (
                      <tr key={p._id || p.orderId} className="hover:bg-surface-50/70 transition-colors">
                        <td className="p-3.5 font-mono text-[10px] font-bold text-forest-900">{p.orderId}</td>
                        <td className="p-3.5 font-mono">#{p.booking?.bookingReference || 'REF'}</td>
                        <td className="p-3.5 text-gray-900">{p.customer?.name}</td>
                        <td className="p-3.5 font-bold text-gray-900">₹{p.amount}</td>
                        <td className="p-3.5 text-emerald-800 font-bold">₹{p.platformCommission}</td>
                        <td className="p-3.5 font-bold text-blue-700">₹{p.providerShare}</td>
                        <td className="p-3.5 text-[10px] text-gray-400">{new Date(p.createdAt || Date.now()).toLocaleString()}</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            p.status === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 7: PROVIDER PAYOUTS (MODULE 5) */}
        {activeNav === 'payouts' && (
          <div className="bg-white rounded-3xl border border-surface-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-base text-gray-900">Provider Payouts & Transfers ({payouts.length})</h3>
                <p className="text-xs text-gray-500">History of direct deposits to verified provider bank accounts.</p>
              </div>

              <button
                onClick={() => handleExportCsv('payouts')}
                className="flex items-center space-x-1.5 bg-forest-800 hover:bg-forest-900 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export Payouts CSV</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="bg-surface-50 text-[10px] font-bold uppercase text-gray-500 border-b border-surface-200">
                  <tr>
                    <th className="p-3.5">Transfer ID</th>
                    <th className="p-3.5">Provider</th>
                    <th className="p-3.5">Amount Disbursed</th>
                    <th className="p-3.5">Vendor Gateway ID</th>
                    <th className="p-3.5">Initiated By</th>
                    <th className="p-3.5">Time</th>
                    <th className="p-3.5">Payout Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {payouts.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center p-8 text-gray-400">No payouts have been executed yet.</td>
                    </tr>
                  ) : (
                    payouts.map((out) => (
                      <tr key={out._id || out.transferId} className="hover:bg-surface-50/70 transition-colors">
                        <td className="p-3.5 font-mono text-[10px] font-bold text-forest-900">{out.transferId}</td>
                        <td className="p-3.5 font-bold text-gray-900">{out.provider?.businessName || out.providerName}</td>
                        <td className="p-3.5 font-black text-emerald-800 text-sm">₹{out.amount}</td>
                        <td className="p-3.5 font-mono text-[10px]">{out.gatewayVendorId}</td>
                        <td className="p-3.5 capitalize">{out.initiatedBy || 'system'}</td>
                        <td className="p-3.5 text-[10px] text-gray-400">{new Date(out.createdAt || Date.now()).toLocaleString()}</td>
                        <td className="p-3.5">
                          <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
                            {out.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 8: COMMISSION SETTINGS (MODULE 4) */}
        {activeNav === 'commissions' && commissionSettings && (
          <div className="bg-white rounded-3xl border border-surface-200 p-6 shadow-xs space-y-6">
            <div className="border-b border-surface-100 pb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-forest-700">Module 4 Automation Engine</span>
              <h3 className="text-lg font-bold text-gray-900">Marketplace Commission Configuration</h3>
              <p className="text-xs text-gray-500">
                Configure default percentage, category-specific rates, and fixed platform fees. All rates take effect on subsequent bookings and are stored immutably.
              </p>
            </div>

            <form onSubmit={handleUpdateCommissionSettings} className="space-y-6">
              
              {/* Default Rate & Fixed Fee */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-surface-50 border border-surface-200 space-y-2">
                  <label className="block text-xs font-bold text-gray-800">
                    Default Commission Percentage (%) *
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      required
                      min="0"
                      max="100"
                      value={commissionSettings.defaultPercentage}
                      onChange={(e) => setCommissionSettings({ ...commissionSettings, defaultPercentage: Number(e.target.value) })}
                      className="w-24 text-base font-bold p-2 rounded-xl border border-surface-300 bg-white"
                    />
                    <span className="text-sm font-bold text-gray-600">%</span>
                  </div>
                  <p className="text-[10px] text-gray-400">Standard cut applied when no override exists.</p>
                </div>

                <div className="p-4 rounded-2xl bg-surface-50 border border-surface-200 space-y-2">
                  <label className="block text-xs font-bold text-gray-800">
                    Fixed Transaction Fee (₹)
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="0"
                      value={commissionSettings.fixedFee || 0}
                      onChange={(e) => setCommissionSettings({ ...commissionSettings, fixedFee: Number(e.target.value) })}
                      className="w-24 text-base font-bold p-2 rounded-xl border border-surface-300 bg-white"
                    />
                    <span className="text-sm font-bold text-gray-600">₹</span>
                  </div>
                  <p className="text-[10px] text-gray-400">Flat convenience fee per order (optional).</p>
                </div>

                <div className="p-4 rounded-2xl bg-surface-50 border border-surface-200 space-y-2">
                  <label className="block text-xs font-bold text-gray-800">
                    Commission Engine State
                  </label>
                  <div className="pt-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={commissionSettings.isActive !== false}
                        onChange={(e) => setCommissionSettings({ ...commissionSettings, isActive: e.target.checked })}
                        className="w-4 h-4 text-forest-800 rounded"
                      />
                      <span className="text-xs font-bold text-gray-900">
                        {commissionSettings.isActive !== false ? 'Active & Auto-Deducting' : 'Deactivated (0% Fees)'}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Category-Specific Overrides */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-gray-900">Category-Specific Commission Overrides</h4>
                <p className="text-xs text-gray-500">Tailor platform margins by vertical demand and operating costs.</p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {['Electrical', 'Plumbing', 'Home Cleaning', 'Carpentry', 'Painting', 'Appliance Repair', 'Gardening', 'Moving & Helpers'].map((cat) => (
                    <div key={cat} className="p-3 rounded-xl border border-surface-200 bg-white space-y-1">
                      <span className="text-xs font-bold text-gray-800 block truncate">{cat}</span>
                      <div className="flex items-center space-x-1.5">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={commissionSettings.categoryOverrides?.[cat] ?? commissionSettings.defaultPercentage}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setCommissionSettings({
                              ...commissionSettings,
                              categoryOverrides: {
                                ...(commissionSettings.categoryOverrides || {}),
                                [cat]: val,
                              },
                            });
                          }}
                          className="w-16 text-xs font-bold p-1.5 rounded-lg border border-surface-300"
                        />
                        <span className="text-xs font-bold text-gray-600">%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-surface-200 flex justify-end">
                <button
                  type="submit"
                  className="bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md transition-colors"
                >
                  Save Commission Rules
                </button>
              </div>

            </form>
          </div>
        )}

        {/* VIEW 9: REPORTS (MODULE 7: FINANCIAL REPORTS & CSV EXPORTS) */}
        {activeNav === 'reports' && (
          <div className="space-y-6">
            
            {/* Reports Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-surface-200 shadow-xs space-y-2">
                <span className="text-[10px] font-bold uppercase text-gray-400">Gross Marketplace GMV</span>
                <div className="text-2xl font-black text-forest-900">₹{reports?.grossVolume || stats?.totalCustomerPayments || 0}</div>
                <p className="text-[10px] text-gray-500">Total customer transactions processed through platform.</p>
                <button
                  onClick={() => handleExportCsv('revenue')}
                  className="mt-2 text-xs font-bold text-forest-800 hover:underline flex items-center"
                >
                  <Download className="w-3.5 h-3.5 mr-1" /> Download Full Report
                </button>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-surface-200 shadow-xs space-y-2">
                <span className="text-[10px] font-bold uppercase text-emerald-700">Platform Revenue Retained</span>
                <div className="text-2xl font-black text-emerald-800">₹{reports?.platformNetRevenue || stats?.totalPlatformCommission || 0}</div>
                <p className="text-[10px] text-gray-500">Net platform fees after vendor split allocation.</p>
                <button
                  onClick={() => handleExportCsv('commissions')}
                  className="mt-2 text-xs font-bold text-emerald-800 hover:underline flex items-center"
                >
                  <Download className="w-3.5 h-3.5 mr-1" /> Export Commission Ledger
                </button>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-surface-200 shadow-xs space-y-2">
                <span className="text-[10px] font-bold uppercase text-blue-700">Provider Payout Settlements</span>
                <div className="text-2xl font-black text-blue-800">₹{reports?.settledPayouts || stats?.successfulProviderPayouts || 0}</div>
                <p className="text-[10px] text-gray-500">Transfers disbursed directly into provider accounts.</p>
                <button
                  onClick={() => handleExportCsv('payouts')}
                  className="mt-2 text-xs font-bold text-blue-800 hover:underline flex items-center"
                >
                  <Download className="w-3.5 h-3.5 mr-1" /> Export Payout Records
                </button>
              </div>
            </div>

            {/* Category Revenue Breakdown */}
            <div className="bg-white rounded-3xl border border-surface-200 p-5 shadow-xs space-y-4">
              <h3 className="font-bold text-base text-gray-900">Revenue Breakdown by Vertical Category</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-600">
                  <thead className="bg-surface-50 text-[10px] font-bold uppercase text-gray-500 border-b border-surface-200">
                    <tr>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5">Completed Bookings</th>
                      <th className="p-3.5">Gross Volume</th>
                      <th className="p-3.5">Platform Cut</th>
                      <th className="p-3.5">Provider Payouts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100">
                    {(!reports?.categoryBreakdown || reports.categoryBreakdown.length === 0) ? (
                      <tr>
                        <td colSpan="5" className="text-center p-8 text-gray-400">No category transactions available.</td>
                      </tr>
                    ) : (
                      reports.categoryBreakdown.map((row) => (
                        <tr key={row.category} className="hover:bg-surface-50">
                          <td className="p-3.5 font-bold text-gray-900">{row.category}</td>
                          <td className="p-3.5">{row.count}</td>
                          <td className="p-3.5 font-bold text-gray-900">₹{row.gross}</td>
                          <td className="p-3.5 text-emerald-800 font-bold">₹{row.commission}</td>
                          <td className="p-3.5 text-blue-800 font-bold">₹{row.providerShare}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* VIEW 10: ADMIN SETTINGS & AUDIT LOGS */}
        {activeNav === 'settings' && (
          <div className="space-y-6">
            
            {/* System Info */}
            <div className="bg-white p-6 rounded-3xl border border-surface-200 shadow-xs space-y-3">
              <h3 className="font-bold text-base text-gray-900">System Gateway & Platform Configuration</h3>
              <p className="text-xs text-gray-500">Security configurations and connected payment services.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
                <div className="p-3 rounded-xl bg-surface-50 border border-surface-200">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Payment Gateway</span>
                  <p className="font-bold text-gray-900">Cashfree Easy Split (UPI QR / Cards / NetBanking)</p>
                  <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Automated Vendor Splitting & Webhooks Active</p>
                </div>

                <div className="p-3 rounded-xl bg-surface-50 border border-surface-200">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Escrow Architecture</span>
                  <p className="font-bold text-gray-900">Two-Phase Job Completion Settlement</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Double-entry immutable ledger enabled</p>
                </div>
              </div>
            </div>

            {/* Immutable Audit Logs Table */}
            <div className="bg-white rounded-3xl border border-surface-200 p-5 shadow-xs space-y-4">
              <h3 className="font-bold text-base text-gray-900">Platform Security & Audit Trail ({auditLogs.length})</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-600">
                  <thead className="bg-surface-50 text-[10px] font-bold uppercase text-gray-500 border-b border-surface-200">
                    <tr>
                      <th className="p-3.5">Action</th>
                      <th className="p-3.5">Admin / Actor</th>
                      <th className="p-3.5">Target</th>
                      <th className="p-3.5">Details</th>
                      <th className="p-3.5">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100">
                    {auditLogs.map((log) => (
                      <tr key={log._id || log.id} className="hover:bg-surface-50">
                        <td className="p-3.5 font-bold font-mono text-forest-900 text-[11px]">{log.action}</td>
                        <td className="p-3.5">{log.actor?.name || 'Administrator'}</td>
                        <td className="p-3.5 font-mono text-[10px]">{log.targetModel} #{log.targetId?.substring(0, 8)}</td>
                        <td className="p-3.5 text-gray-500 max-w-xs truncate">{JSON.stringify(log.details)}</td>
                        <td className="p-3.5 text-[10px] text-gray-400">{new Date(log.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* Admin Disburse Payout Modal */}
      {selectedPayoutProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-surface-200 space-y-4">
            <div className="flex justify-between items-center border-b border-surface-200 pb-3">
              <h3 className="font-bold text-base text-gray-900">Disburse Payout to Provider</h3>
              <button onClick={() => setSelectedPayoutProvider(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInitiateAdminPayout} className="space-y-4">
              <div className="bg-surface-50 p-3 rounded-2xl border border-surface-200 text-xs space-y-1">
                <div className="flex justify-between text-gray-600">
                  <span>Provider:</span>
                  <strong className="text-gray-900">{selectedPayoutProvider.businessName}</strong>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Available Balance:</span>
                  <strong className="text-emerald-700">₹{selectedPayoutProvider.availableBalance}</strong>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Target Vendor ID:</span>
                  <span className="font-mono">{selectedPayoutProvider.bankAccount?.gatewayVendorId}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Transfer Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedPayoutProvider.availableBalance}
                  value={adminPayoutAmount}
                  onChange={(e) => setAdminPayoutAmount(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-surface-200 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-forest-800"
                />
              </div>

              <button
                type="submit"
                disabled={initiatingPayout || Number(adminPayoutAmount) > selectedPayoutProvider.availableBalance || Number(adminPayoutAmount) <= 0}
                className="w-full bg-forest-800 hover:bg-forest-900 disabled:opacity-50 text-white font-bold text-xs py-3 rounded-xl shadow-md transition-colors"
              >
                {initiatingPayout ? 'Disbursing via Gateway...' : `Confirm Transfer of ₹${adminPayoutAmount || 0}`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Admin Refund Modal */}
      {selectedBookingRefund && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-surface-200 space-y-4">
            <div className="flex justify-between items-center border-b border-surface-200 pb-3">
              <h3 className="font-bold text-base text-gray-900 flex items-center">
                <RotateCcw className="w-5 h-5 text-rose-600 mr-2" />
                Process Customer Refund
              </h3>
              <button onClick={() => setSelectedBookingRefund(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProcessRefund} className="space-y-4">
              <div className="bg-rose-50 border border-rose-200 p-3 rounded-2xl text-xs space-y-1 text-rose-950">
                <div className="flex justify-between">
                  <span>Booking Reference:</span>
                  <strong className="font-mono">#{selectedBookingRefund.bookingReference}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Refundable Amount:</span>
                  <strong className="text-rose-700">₹{selectedBookingRefund.agreedPriceSnapshot?.totalAmount}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span>{selectedBookingRefund.customer?.name}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Reason for Refund *</label>
                <textarea
                  required
                  rows={2}
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="e.g. Provider failed to arrive for scheduled electrical diagnostic."
                  className="w-full text-xs p-2.5 rounded-xl border border-surface-200 focus:outline-none"
                />
              </div>

              <p className="text-[10px] text-gray-500">
                This will trigger gateway refund to customer and post compensating reversal entries in the double-entry financial ledger.
              </p>

              <button
                type="submit"
                disabled={processingRefund}
                className="w-full bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white font-bold text-xs py-3 rounded-xl shadow-md transition-colors"
              >
                {processingRefund ? 'Processing Refund...' : `Authorize Refund (₹${selectedBookingRefund.agreedPriceSnapshot?.totalAmount})`}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
