import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { Navbar } from './components/Navbar.jsx';
import { Footer } from './components/Footer.jsx';
import { AIModal } from './components/AIModal.jsx';
import { BookingModal } from './components/BookingModal.jsx';

import { HomePage } from './pages/HomePage.jsx';
import { SearchPage } from './pages/SearchPage.jsx';
import { ServiceDetailPage } from './pages/ServiceDetailPage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { RegisterPage } from './pages/RegisterPage.jsx';
import { CustomerDashboard } from './pages/CustomerDashboard.jsx';
import { ProviderDashboard } from './pages/ProviderDashboard.jsx';
import { AdminDashboard } from './pages/AdminDashboard.jsx';

export function App() {
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedServiceForBooking, setSelectedServiceForBooking] = useState(null);

  const handleOpenBooking = (service) => {
    setSelectedServiceForBooking(service);
    setBookingModalOpen(true);
  };

  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="flex flex-col min-h-screen bg-surface-50 text-gray-900 font-sans antialiased">
          
          {/* Navigation Header */}
          <Navbar onOpenAIModal={() => setAiModalOpen(true)} />

          {/* Main Route Content */}
          <main className="flex-1">
            <Routes>
              <Route
                path="/"
                element={
                  <HomePage
                    onOpenAIModal={() => setAiModalOpen(true)}
                    onSelectService={handleOpenBooking}
                  />
                }
              />
              <Route
                path="/search"
                element={
                  <SearchPage
                    onOpenAIModal={() => setAiModalOpen(true)}
                    onSelectService={handleOpenBooking}
                  />
                }
              />
              <Route
                path="/service/:id"
                element={<ServiceDetailPage onBookService={handleOpenBooking} />}
              />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/dashboard" element={<CustomerDashboard />} />
              <Route path="/provider/dashboard" element={<ProviderDashboard />} />
              <Route path="/admin" element={<AdminDashboard />} />
            </Routes>
          </main>

          {/* Footer */}
          <Footer />

          {/* Global AI Matching Modal */}
          <AIModal
            isOpen={aiModalOpen}
            onClose={() => setAiModalOpen(false)}
            onSelectService={handleOpenBooking}
          />

          {/* Global Booking Dialog */}
          <BookingModal
            isOpen={bookingModalOpen}
            onClose={() => {
              setBookingModalOpen(false);
              setSelectedServiceForBooking(null);
            }}
            service={selectedServiceForBooking}
          />

        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
