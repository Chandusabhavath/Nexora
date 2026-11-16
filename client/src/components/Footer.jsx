import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, CheckCircle2, Lock, HelpCircle, PhoneCall } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-forest-950 text-gray-300 pt-16 pb-12 border-t border-forest-900 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Trust Badges Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-12 border-b border-forest-900/60">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-full bg-forest-900 flex items-center justify-center text-forest-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Identity Verified</h4>
              <p className="text-xs text-gray-400">Govt ID & police checked providers</p>
            </div>
          </div>

          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-full bg-forest-900 flex items-center justify-center text-forest-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Guaranteed Pricing</h4>
              <p className="text-xs text-gray-400">Transparent rates, no hidden fees</p>
            </div>
          </div>

          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-full bg-forest-900 flex items-center justify-center text-forest-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Direct Cash & UPI</h4>
              <p className="text-xs text-gray-400">Pay directly after work completion</p>
            </div>
          </div>

          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-full bg-forest-900 flex items-center justify-center text-forest-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Dispute Support</h4>
              <p className="text-xs text-gray-400">Dedicated hyperlocal resolution</p>
            </div>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 py-12">
          <div className="col-span-2">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-forest-800 flex items-center justify-center text-white font-bold text-lg">
                N
              </div>
              <span className="font-bold text-xl text-white">NEXORA</span>
            </div>
            <p className="mt-4 text-xs text-gray-400 leading-relaxed max-w-sm">
              NEXORA is an AI-assisted hyperlocal marketplace and community platform connecting residents with trusted, verified local professionals for electrical, plumbing, home maintenance, and essential services.
            </p>
            <div className="mt-6 flex items-center space-x-2 text-xs text-forest-400">
              <PhoneCall className="w-4 h-4" />
              <span>Hyperlocal Support: support@nexora.com</span>
            </div>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-white">Popular Services</h5>
            <ul className="mt-4 space-y-2.5 text-xs">
              <li><Link to="/search?category=Electrical" className="hover:text-forest-400 transition-colors">Electrical Repairs</Link></li>
              <li><Link to="/search?category=Plumbing" className="hover:text-forest-400 transition-colors">Emergency Plumbing</Link></li>
              <li><Link to="/search?category=Home+Cleaning" className="hover:text-forest-400 transition-colors">Deep Home Cleaning</Link></li>
              <li><Link to="/search?category=Carpentry" className="hover:text-forest-400 transition-colors">Custom Woodcraft</Link></li>
              <li><Link to="/search?category=Appliance+Repair" className="hover:text-forest-400 transition-colors">Appliance Overhaul</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-white">For Providers</h5>
            <ul className="mt-4 space-y-2.5 text-xs">
              <li><Link to="/register?role=provider" className="hover:text-forest-400 transition-colors">Join as a Professional</Link></li>
              <li><Link to="/provider/dashboard" className="hover:text-forest-400 transition-colors">Provider Portal</Link></li>
              <li><span className="text-gray-500">Fair 10% Platform Fee</span></li>
              <li><span className="text-gray-500">Instant UPI Direct Pay</span></li>
              <li><span className="text-gray-500">Verification Standards</span></li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-white">Platform & Trust</h5>
            <ul className="mt-4 space-y-2.5 text-xs">
              <li><span className="text-gray-400">Trust & Safety Policy</span></li>
              <li><span className="text-gray-400">Terms of Service</span></li>
              <li><span className="text-gray-400">Privacy & Data Controls</span></li>
              <li><span className="text-gray-400">Cancellation Guidelines</span></li>
              <li><Link to="/admin" className="text-gray-500 hover:text-white">Admin Bootstrap</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-forest-900/40 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500">
          <p>© {new Date().getFullYear()} NEXORA Technologies Inc. All rights reserved.</p>
          <p className="mt-2 sm:mt-0">Built with MERN Stack • Mumbai Hyperlocal Region</p>
        </div>

      </div>
    </footer>
  );
};
