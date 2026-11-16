import React, { useState, useEffect } from 'react';
import { apiCreatePaymentOrder, apiVerifyPayment, apiGetPaymentReceipt } from '../api/client.js';
import { 
  X, 
  QrCode, 
  CheckCircle2, 
  ShieldCheck, 
  Clock, 
  IndianRupee, 
  Printer, 
  Download, 
  ExternalLink,
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';

export const PaymentModal = ({ isOpen, onClose, booking, onPaymentSuccess }) => {
  const [order, setOrder] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900); // 15 mins

  useEffect(() => {
    if (!isOpen || !booking) return;

    let timer;
    const initPaymentOrder = async () => {
      setLoading(true);
      setError('');
      setReceipt(null);
      setTimeLeft(900);

      try {
        const res = await apiCreatePaymentOrder(booking._id);
        if (res.success && res.order) {
          setOrder(res.order);
        } else {
          setError(res.message || 'Unable to generate payment session.');
        }
      } catch (err) {
        setError(err.message || 'Payment initiation failed.');
      } finally {
        setLoading(false);
      }
    };

    initPaymentOrder();

    timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, booking]);

  if (!isOpen || !booking) return null;

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleCopyUPI = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerifyPayment = async () => {
    if (!order) return;
    setVerifying(true);
    setError('');

    try {
      const res = await apiVerifyPayment({
        orderId: order.orderId,
        paymentId: `PAY_UPI_${Date.now()}`,
      });

      if (res.success) {
        setReceipt(res.receipt);
        if (onPaymentSuccess) {
          onPaymentSuccess(res.payment);
        }
      } else {
        setError(res.message || 'Payment verification could not be completed.');
      }
    } catch (err) {
      setError(err.message || 'Payment verification error.');
    } finally {
      setVerifying(false);
    }
  };

  const qrImageUrl = order?.dynamicQrString
    ? `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(order.dynamicQrString)}&margin=10`
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-surface-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-forest-900 text-white p-5 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-300 hover:text-white p-1 rounded-full hover:bg-forest-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              NEXORA Secure Gateway
            </span>
            <span className="bg-emerald-950/80 text-emerald-300 text-[9px] font-semibold px-2 py-0.5 rounded-full border border-emerald-800">
              Cashfree Easy Split
            </span>
          </div>
          <h3 className="text-lg font-bold mt-0.5 truncate">
            {receipt ? 'Payment Receipt & Confirmation' : 'Dynamic UPI QR Payment'}
          </h3>
          <p className="text-xs text-forest-200">
            Booking Ref: <span className="font-mono font-bold text-white">#{booking.bookingReference}</span>
          </p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-10 h-10 border-4 border-forest-800 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-gray-600 font-medium">Generating encrypted marketplace payment QR...</p>
            </div>
          ) : receipt ? (
            /* Verified Payment Receipt View */
            <div className="space-y-4">
              <div className="text-center py-3">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="text-lg font-bold text-gray-900">Payment Verified & Escrowed!</h4>
                <p className="text-xs text-gray-500">
                  Funds held securely in NEXORA escrow until service completion.
                </p>
              </div>

              {/* Receipt Card */}
              <div id="payment-receipt-print" className="bg-surface-50 border border-surface-200 rounded-2xl p-4 text-xs space-y-3 font-sans">
                <div className="flex justify-between items-start border-b border-surface-200 pb-3">
                  <div>
                    <h5 className="font-black text-forest-900 text-sm">NEXORA MARKETPLACE</h5>
                    <p className="text-[10px] text-gray-500">Receipt #{receipt.receiptNumber}</p>
                    <p className="text-[10px] text-gray-400">{new Date(receipt.paidAt).toLocaleString()}</p>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                    PAID / ESCROWED
                  </span>
                </div>

                <div className="space-y-1.5 py-1">
                  <div className="flex justify-between text-gray-600">
                    <span>Service:</span>
                    <strong className="text-gray-900">{booking.service?.title || 'Hyperlocal Service'}</strong>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Service Provider:</span>
                    <span className="text-gray-900">{booking.provider?.businessName || 'Verified Provider'}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Payment Method:</span>
                    <span className="text-gray-900 font-mono uppercase">{receipt.paymentMethod || 'UPI QR'}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Transaction Ref:</span>
                    <span className="text-gray-900 font-mono text-[10px]">{receipt.gatewayPaymentId || order?.orderId}</span>
                  </div>
                </div>

                <div className="border-t border-surface-200 pt-3 space-y-1.5">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span>₹{receipt.amount}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700">
                    <span>Platform Commission & Protection (10%):</span>
                    <span>₹{receipt.platformCommission}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Provider Allocation:</span>
                    <span>₹{receipt.providerShare}</span>
                  </div>
                  <div className="flex justify-between font-bold text-forest-950 text-sm pt-2 border-t border-surface-200">
                    <span>Total Paid:</span>
                    <span>₹{receipt.amount}</span>
                  </div>
                </div>

                <div className="pt-2 text-[10px] text-gray-400 text-center italic">
                  Protected by NEXORA Escrow. Money released to provider upon job verification.
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 flex items-center justify-center space-x-1.5 bg-surface-100 hover:bg-surface-200 text-gray-800 text-xs font-bold py-2.5 rounded-xl border border-surface-300 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Receipt</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-forest-800 hover:bg-forest-900 text-white text-xs font-bold py-2.5 rounded-xl shadow-md transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Active Dynamic QR Payment View */
            <div className="space-y-4">
              
              {/* Order Info & Timer */}
              <div className="flex items-center justify-between bg-surface-50 p-3 rounded-2xl border border-surface-200 text-xs">
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Payable Total</span>
                  <div className="text-xl font-black text-forest-900">₹{order?.amount}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 font-bold uppercase flex items-center justify-end">
                    <Clock className="w-3 h-3 mr-1 text-amber-600" /> Session Expires
                  </span>
                  <div className={`text-sm font-mono font-bold ${timeLeft < 180 ? 'text-rose-600' : 'text-gray-900'}`}>
                    {formatTimer(timeLeft)}
                  </div>
                </div>
              </div>

              {/* Dynamic QR Code Card */}
              <div className="bg-white p-4 rounded-2xl border-2 border-dashed border-forest-200 flex flex-col items-center text-center space-y-3">
                <div className="bg-white p-2 rounded-xl shadow-md border border-surface-200 inline-block">
                  <img
                    src={qrImageUrl}
                    alt="UPI Dynamic QR Code"
                    className="w-48 h-48 object-contain rounded-lg"
                  />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Scan with any UPI App</h4>
                  <p className="text-[10px] text-gray-500">Google Pay • PhonePe • Paytm • CRED • BHIM</p>
                </div>
              </div>

              {/* UPI Intent / String Copy */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-gray-500">UPI Payment Link</label>
                <div className="flex items-center space-x-2 bg-surface-100 p-2 rounded-xl border border-surface-200">
                  <input
                    type="text"
                    readOnly
                    value={order?.dynamicQrString || ''}
                    className="bg-transparent text-[10px] font-mono text-gray-700 flex-1 outline-none truncate"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopyUPI(order?.dynamicQrString || '')}
                    className="p-1 text-forest-800 hover:text-forest-950 rounded flex items-center text-[10px] font-semibold"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Trust Badge */}
              <div className="flex items-center space-x-2 text-[11px] text-forest-800 bg-forest-50 p-2.5 rounded-xl border border-forest-200">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>
                  <strong>Safe Marketplace Escrow:</strong> Payment is securely collected by NEXORA and only disbursed to the provider after service completion.
                </span>
              </div>

              {/* Verification & Simulation Button */}
              <button
                type="button"
                onClick={handleVerifyPayment}
                disabled={verifying || timeLeft === 0}
                className="w-full bg-forest-800 hover:bg-forest-900 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-xs shadow-md transition-all flex items-center justify-center space-x-2"
              >
                {verifying ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Verifying with Cashfree Gateway...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>I Have Paid (Simulate / Verify Payment)</span>
                  </>
                )}
              </button>

            </div>
          )}
        </div>

      </div>
    </div>
  );
};
