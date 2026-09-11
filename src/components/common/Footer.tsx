import React from 'react';
import {
  Truck,
  Phone,
  Mail,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ArrowUpRight,
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';

interface FooterProps {
  onNavigate: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-[#030509] border-t-2 border-slate-800 text-slate-400 text-sm relative z-20 pb-20 sm:pb-8 shadow-2xl">
      {/* Decorative Pastel Top Gradient Line */}
      <div className="h-[1px] bg-gradient-to-r from-transparent via-red-300/30 to-transparent" />

      {/* Top Value Banner */}
      <div className="border-b border-slate-800/80 py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-400/15 via-red-400/10 to-red-500/10 border border-red-300/25 text-red-200">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">Fast Same-Day Courier</h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Direct GTA dispatch with 1–2h rush or standard delivery.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-400/15 via-red-400/10 to-red-500/10 border border-red-300/25 text-red-200">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">Safe & Fully Insured</h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Dedicated handling for paint pails, supplies, and business cargo.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-400/15 via-red-400/10 to-red-500/10 border border-red-300/25 text-red-200">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">Digital Proof of Delivery</h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Instant delivery photo, recipient signature, and stamped PDF invoice.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-400/15 via-red-400/10 to-red-500/10 border border-red-300/25 text-red-200">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">24/7 Emergency Service</h4>
              <p className="text-xs text-slate-300 mt-0.5">
                After-hours and weekend dispatch available whenever you need it.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Company Column */}
          <div className="md:col-span-2 space-y-4">
            <div
              onClick={() => onNavigate('home')}
              className="cursor-pointer select-none"
            >
              <BrandLogo size="md" />
            </div>

            <p className="text-xs leading-relaxed text-slate-300 pr-6">
              Ontario&apos;s direct point-to-point courier for commercial contractors, suppliers, paint stores,
              and business freight. Instant distance pricing with guaranteed Pay Later terms.
            </p>

            <div className="pt-2 space-y-2 text-xs">
              <div className="flex items-center space-x-2 text-slate-200">
                <Phone className="w-4 h-4 text-red-400" />
                <a href="tel:+16478049775" className="hover:text-red-300 transition-smooth font-semibold">
                  Dispatch: +1 (647) 804-9775
                </a>
              </div>
              <div className="flex items-center space-x-2 text-slate-200">
                <Mail className="w-4 h-4 text-red-400" />
                <a href="mailto:support@flashdropexpress.com" className="hover:text-red-300 transition-smooth">
                  support@flashdropexpress.com
                </a>
              </div>
              <div className="flex items-center space-x-2 text-slate-300">
                <MapPin className="w-4 h-4 text-red-400" />
                <span>Serving Toronto & Greater Toronto Area, Ontario</span>
              </div>
            </div>
          </div>

          {/* Services Column */}
          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">
              Services
            </h4>
            <ul className="space-y-1 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('services')}
                  className="py-1 text-slate-300 hover:text-white transition-smooth cursor-pointer block text-left"
                >
                  Same-Day Courier
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('services')}
                  className="py-1 text-slate-300 hover:text-white transition-smooth cursor-pointer block text-left"
                >
                  Paint Pails & Supply Freight
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('services')}
                  className="py-1 text-slate-300 hover:text-white transition-smooth cursor-pointer block text-left"
                >
                  Rush / 1-2h Express Dispatch
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('services')}
                  className="py-1 text-slate-300 hover:text-white transition-smooth cursor-pointer block text-left"
                >
                  Commercial Box Truck Freight
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('services')}
                  className="py-1 text-slate-300 hover:text-white transition-smooth cursor-pointer block text-left"
                >
                  After-Hours Emergency Delivery
                </button>
              </li>
            </ul>
          </div>

          {/* Coverage Column */}
          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">
              Coverage Area
            </h4>
            <ul className="space-y-1 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('service-areas')}
                  className="py-1 text-slate-300 hover:text-white transition-smooth cursor-pointer block text-left"
                >
                  Toronto (Downtown & Suburbs)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('service-areas')}
                  className="py-1 text-slate-300 hover:text-white transition-smooth cursor-pointer block text-left"
                >
                  Mississauga & Brampton (Peel)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('service-areas')}
                  className="py-1 text-slate-300 hover:text-white transition-smooth cursor-pointer block text-left"
                >
                  Vaughan, Markham, Richmond Hill
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('service-areas')}
                  className="py-1 text-slate-300 hover:text-white transition-smooth cursor-pointer block text-left"
                >
                  Oakville, Burlington & Milton
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('service-areas')}
                  className="py-1 text-slate-300 hover:text-white transition-smooth cursor-pointer block text-left"
                >
                  Outside GTA (Hamilton, Niagara, Waterloo)
                </button>
              </li>
            </ul>
          </div>

          {/* Quick Links & Portals */}
          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">
              Portals & Accounts
            </h4>
            <ul className="space-y-1 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('order')}
                  className="py-1 text-red-300 font-semibold flex items-center hover:text-white transition-smooth cursor-pointer"
                >
                  <span>Request Delivery (Guest or User)</span>
                  <ArrowUpRight className="w-3 h-3 ml-1" />
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('tracking')}
                  className="py-1 text-slate-300 hover:text-white transition-smooth cursor-pointer block text-left"
                >
                  Track an Order (FD-XXXXXX)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('pricing')}
                  className="py-1 text-slate-300 hover:text-white transition-smooth cursor-pointer block text-left"
                >
                  Rate Calculator
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    onNavigate('home');
                    setTimeout(() => {
                      const el = document.getElementById('faq');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }, 120);
                  }}
                  className="py-1 text-slate-300 hover:text-white transition-smooth cursor-pointer block text-left"
                >
                  Frequently Asked Questions (FAQ)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('login')}
                  className="py-1 text-slate-300 hover:text-white transition-smooth cursor-pointer block text-left"
                >
                  Customer Login
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('admin')}
                  className="py-1 text-slate-400 hover:text-slate-200 transition-smooth cursor-pointer block text-left"
                >
                  Staff & Admin Dispatch
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar (High Contrast WCAG AA) */}
        <div className="border-t border-slate-800/80 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400">
          <div>
            &copy; {new Date().getFullYear()} FlashDrop Express. All rights reserved.
            Domain: flashdropexpress.com
          </div>
          <div className="flex items-center space-x-4 mt-4 sm:mt-0">
            <span>Payment Method: Pay Later on Delivery</span>
            <span>•</span>
            <span>All rates in CAD subject to HST</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
