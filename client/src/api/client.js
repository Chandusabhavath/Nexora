const API_BASE = '/api';

export const apiClient = async (endpoint, options = {}) => {
  const token = localStorage.getItem('nexora_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
};

// Auth API
export const apiLogin = (credentials) => apiClient('/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
export const apiRegister = (userData) => apiClient('/auth/register', { method: 'POST', body: JSON.stringify(userData) });
export const apiGetMe = () => apiClient('/auth/me');
export const apiRequestOtp = (phone) => apiClient('/auth/otp/request', { method: 'POST', body: JSON.stringify({ phone }) });
export const apiVerifyOtp = (phone, otp) => apiClient('/auth/otp/verify', { method: 'POST', body: JSON.stringify({ phone, otp }) });
export const apiRequestEmailOtp = (email) => apiClient('/auth/request-otp', { method: 'POST', body: JSON.stringify({ email }) });
export const apiVerifyEmailOtp = (email, otp) => apiClient('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ email, otp }) });
export const apiResendEmailOtp = (email) => apiClient('/auth/resend-otp', { method: 'POST', body: JSON.stringify({ email }) });

// Services & Providers
export const apiGetServices = (params = '') => apiClient(`/services${params ? `?${params}` : ''}`);
export const apiGetServiceById = (id) => apiClient(`/services/${id}`);
export const apiCreateService = (data) => apiClient('/services', { method: 'POST', body: JSON.stringify(data) });
export const apiUpdateService = (id, data) => apiClient(`/services/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const apiDeleteService = (id) => apiClient(`/services/${id}`, { method: 'DELETE' });

export const apiGetProviders = (params = '') => apiClient(`/providers${params ? `?${params}` : ''}`);
export const apiGetProviderById = (id) => apiClient(`/providers/detail/${id}`);
export const apiGetMyProviderProfile = () => apiClient('/providers/me');
export const apiUpdateProviderProfile = (data) => apiClient('/providers/me', { method: 'PUT', body: JSON.stringify(data) });
export const apiSubmitVerification = (data) => apiClient('/providers/verify', { method: 'POST', body: JSON.stringify(data) });

// Provider Bank & Financials (Modules 2 & 6)
export const apiGetBankDetails = () => apiClient('/providers/bank-details');
export const apiUpdateBankDetails = (data) => apiClient('/providers/bank-details', { method: 'POST', body: JSON.stringify(data) });
export const apiVerifyBankDetails = () => apiClient('/providers/bank-details/verify', { method: 'POST' });
export const apiGetProviderFinance = () => apiClient('/providers/finance');
export const apiProviderRequestPayout = (amount, notes) => apiClient('/providers/request-payout', { method: 'POST', body: JSON.stringify({ amount, notes }) });

// Bookings
export const apiCreateBooking = (data) => apiClient('/bookings', { method: 'POST', body: JSON.stringify(data) });
export const apiGetBookings = (params = '') => apiClient(`/bookings${params ? `?${params}` : ''}`);
export const apiGetBookingById = (id) => apiClient(`/bookings/${id}`);
export const apiUpdateBookingStatus = (id, data) => apiClient(`/bookings/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) });
export const apiReportPayment = (id, data) => apiClient(`/bookings/${id}/report-payment`, { method: 'POST', body: JSON.stringify(data) });
export const apiConfirmPayment = (id) => apiClient(`/bookings/${id}/confirm-payment`, { method: 'POST' });

// Marketplace Payments (Module 3)
export const apiCreatePaymentOrder = (bookingId) => apiClient('/payments/create-order', { method: 'POST', body: JSON.stringify({ bookingId }) });
export const apiVerifyPayment = (data) => apiClient('/payments/verify', { method: 'POST', body: JSON.stringify(data) });
export const apiGetPaymentReceipt = (orderId) => apiClient(`/payments/receipt/${orderId}`);

// Reviews
export const apiCreateReview = (data) => apiClient('/reviews', { method: 'POST', body: JSON.stringify(data) });
export const apiGetProviderReviews = (providerId) => apiClient(`/reviews/provider/${providerId}`);

// Chat
export const apiGetConversation = (bookingId) => apiClient(`/chat/${bookingId}`);
export const apiSendMessage = (bookingId, text) => apiClient(`/chat/${bookingId}`, { method: 'POST', body: JSON.stringify({ text }) });

// AI Smart Match
export const apiAIMatch = (query, location) => apiClient('/ai/match', { method: 'POST', body: JSON.stringify({ query, location }) });

// Admin Dashboard & Marketplace Controls (Modules 1, 4, 5, 7, 8)
export const apiGetAdminStats = () => apiClient('/admin/stats');
export const apiGetAdminCustomers = () => apiClient('/admin/customers');
export const apiGetAdminProviders = () => apiClient('/admin/providers');
export const apiGetAdminServices = () => apiClient('/admin/services');
export const apiGetAdminBookings = () => apiClient('/admin/bookings');
export const apiGetAdminPayments = (params = '') => apiClient(`/admin/payments${params ? `?${params}` : ''}`);
export const apiGetAdminPayouts = () => apiClient('/admin/payouts');
export const apiInitiateAdminPayout = (data) => apiClient('/admin/payouts/initiate', { method: 'POST', body: JSON.stringify(data) });
export const apiGetCommissionSettings = () => apiClient('/admin/commissions/settings');
export const apiUpdateCommissionSettings = (data) => apiClient('/admin/commissions/settings', { method: 'PUT', body: JSON.stringify(data) });
export const apiGetFinancialReports = (params = '') => apiClient(`/admin/reports${params ? `?${params}` : ''}`);
export const apiProcessRefund = (data) => apiClient('/admin/refunds', { method: 'POST', body: JSON.stringify(data) });
export const apiGetVerifications = () => apiClient('/admin/verifications');
export const apiReviewVerification = (providerId, action, feedback) => apiClient(`/admin/verifications/${providerId}`, { method: 'POST', body: JSON.stringify({ action, feedback }) });
export const apiGetUsers = () => apiClient('/admin/users');
export const apiToggleUserStatus = (userId) => apiClient(`/admin/users/${userId}/toggle-status`, { method: 'PATCH' });
export const apiGetCommissions = () => apiClient('/admin/commissions');
export const apiReconcileCommission = (commissionId, settlementNote) => apiClient(`/admin/commissions/${commissionId}/reconcile`, { method: 'POST', body: JSON.stringify({ settlementNote }) });
export const apiGetDisputes = () => apiClient('/admin/disputes');
export const apiResolveDispute = (disputeId, resolutionNote) => apiClient(`/admin/disputes/${disputeId}/resolve`, { method: 'POST', body: JSON.stringify({ resolutionNote }) });
export const apiGetAuditLogs = () => apiClient('/admin/audit-logs');
