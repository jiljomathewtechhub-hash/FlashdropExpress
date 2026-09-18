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
    <footer className="bg-white border-t border-slate-200 text-slate-600 text-sm relative z-20 pb-20 sm:pb-8 shadow-sm">
      {/* Decorative Brand Top Line */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />

      {/* Top Value Banner */}
      <div className="border-b border-slate-200/90 py-8 px-4 sm:px-6 bg-slate-50/60">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex items-start space-x-3.5 p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-slate-900 font-bold text-sm">Fast Same-Day Courier</h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Direct GTA dispatch with 1–2h rush or standard delivery.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3.5 p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-slate-900 font-bold text-sm">Safe & Fully Insured</h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Dedicated handling for paint pails, supplies, and business cargo.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3.5 p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-slate-900 font-bold text-sm">Digital Proof of Delivery</h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Instant delivery photo, recipient signature, and stamped PDF invoice.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3.5 p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-slate-900 font-bold text-sm">24/7 Emergency Service</h4>
              <p className="text-xs text-slate-600 mt-0.5">
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

            <p className="text-xs leading-relaxed text-slate-600 pr-6">
              Ontario&apos;s direct point-to-point courier for commercial contractors, suppliers, paint stores,
              and business freight. Instant distance pricing with guaranteed Pay Later terms.
            </p>

            <div className="pt-2 space-y-2 text-xs">
              <div className="flex items-center space-x-2 text-slate-700">
                <Phone className="w-4 h-4 text-red-600" />
                <a href="tel:+16478049775" className="hover:text-red-600 transition-smooth font-semibold">
                  Dispatch: +1 (647) 804-9775
                </a>
              </div>
              <div className="flex items-center space-x-2 text-slate-700">
                <Mail className="w-4 h-4 text-red-600" />
                <a href="mailto:support@flashdropexpress.com" className="hover:text-red-600 transition-smooth">
                  support@flashdropexpress.com
                </a>
              </div>
              <div className="flex items-start space-x-2 text-slate-600">
                <MapPin className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <a
                  href="https://www.google.com/maps/search/?api=1&query=3064+Jaguar+Valley+Dr+Mississauga+ON+L5A+2J3"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-red-600 transition-smooth"
                >
                  Suite 108, 3064 Jaguar Valley Dr, Mississauga, ON L5A 2J3, Canada
                </a>
              </div>
            </div>
          </div>

          {/* Services Column */}
          <div>
            <h4 className="text-slate-900 font-bold text-xs uppercase tracking-wider mb-3">
              Services
            </h4>
            <ul className="space-y-1 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('services')}
                  className="py-1 text-slate-600 hover:text-red-600 transition-smooth cursor-pointer block text-left"
                >
                  Same-Day Courier
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('services')}
                  className="py-1 text-slate-600 hover:text-red-600 transition-smooth cursor-pointer block text-left"
                >
                  Paint Pails & Supply Freight
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('services')}
                  className="py-1 text-slate-600 hover:text-red-600 transition-smooth cursor-pointer block text-left"
                >
                  Rush / 1-2h Express Dispatch
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('services')}
                  className="py-1 text-slate-600 hover:text-red-600 transition-smooth cursor-pointer block text-left"
                >
                  Commercial Box Truck Freight
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('services')}
                  className="py-1 text-slate-600 hover:text-red-600 transition-smooth cursor-pointer block text-left"
                >
                  After-Hours Emergency Delivery
                </button>
              </li>
            </ul>
          </div>

          {/* Coverage Column */}
          <div>
            <h4 className="text-slate-900 font-bold text-xs uppercase tracking-wider mb-3">
              Coverage Area
            </h4>
            <ul className="space-y-1 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('service-areas')}
                  className="py-1 text-slate-600 hover:text-red-600 transition-smooth cursor-pointer block text-left"
                >
                  Toronto (Downtown & Suburbs)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('service-areas')}
                  className="py-1 text-slate-600 hover:text-red-600 transition-smooth cursor-pointer block text-left"
                >
                  Mississauga & Brampton (Peel)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('service-areas')}
                  className="py-1 text-slate-600 hover:text-red-600 transition-smooth cursor-pointer block text-left"
                >
                  Vaughan, Markham, Richmond Hill
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('service-areas')}
                  className="py-1 text-slate-600 hover:text-red-600 transition-smooth cursor-pointer block text-left"
                >
                  Oakville, Burlington & Milton
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('service-areas')}
                  className="py-1 text-slate-600 hover:text-red-600 transition-smooth cursor-pointer block text-left"
                >
                  Ontario-Wide Delivery Coverage (Hamilton, Niagara, Waterloo, London)
                </button>
              </li>
            </ul>
          </div>

          {/* Quick Links & Portals */}
          <div>
            <h4 className="text-slate-900 font-bold text-xs uppercase tracking-wider mb-3">
              Portals & Accounts
            </h4>
            <ul className="space-y-1 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('order')}
                  className="py-1 text-red-600 font-bold flex items-center hover:text-red-800 transition-smooth cursor-pointer"
                >
                  <span>Request Delivery (Guest or User)</span>
                  <ArrowUpRight className="w-3 h-3 ml-1" />
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('tracking')}
                  className="py-1 text-slate-600 hover:text-slate-900 transition-smooth cursor-pointer block text-left"
                >
                  Check Order Status (FDXXXXXX)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('about')}
                  className="py-1 text-slate-600 hover:text-red-600 transition-smooth cursor-pointer block text-left"
                >
                  About FlashDrop Express
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('pricing')}
                  className="py-1 text-slate-600 hover:text-slate-900 transition-smooth cursor-pointer block text-left"
                >
                  Freight Tiers & Quotes
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('terms')}
                  className="py-1 text-slate-700 hover:text-red-600 font-semibold transition-smooth cursor-pointer block text-left"
                >
                  Terms &amp; Conditions
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
                  className="py-1 text-slate-600 hover:text-slate-900 transition-smooth cursor-pointer block text-left"
                >
                  Frequently Asked Questions (FAQ)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('login')}
                  className="py-1 text-slate-600 hover:text-slate-900 transition-smooth cursor-pointer block text-left"
                >
                  Customer Login
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('login')}
                  className="py-1 text-slate-500 hover:text-slate-800 transition-smooth cursor-pointer block text-left"
                >
                  Staff & Admin Portal
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar (High Contrast WCAG AA) */}
        <div className="border-t border-slate-200 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} FlashDrop Express &bull; A Division of SNM Group International Inc.
            <span className="block text-[11px] text-slate-400 mt-0.5">
              Licensed Ontario Commercial Courier &bull; Domain: flashdropexpress.com
            </span>
          </div>
          <div className="flex flex-wrap items-center space-x-3 mt-4 sm:mt-0">
            <button
              onClick={() => onNavigate('about')}
              className="hover:text-red-600 font-medium transition cursor-pointer"
            >
              About Us
            </button>
            <span>•</span>
            <button
              onClick={() => onNavigate('terms')}
              className="hover:text-red-600 font-medium transition cursor-pointer"
            >
              Terms &amp; Conditions
            </button>
            <span>•</span>
            <span>Payment: Pay Later on Delivery</span>
            <span>•</span>
            <span>All rates in CAD subject to HST (CRA Reg: 78750 1444 RT0001)</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
