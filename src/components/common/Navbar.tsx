import React, { useState, useEffect } from 'react';
import {
  Truck,
  Phone,
  Search,
  User,
  Shield,
  Menu,
  X,
  ChevronRight,
  LogOut,
  MapPin,
  Clock,
  Sparkles,
} from 'lucide-react';
import { store, UserSession } from '../../lib/store';
import { BrandLogo } from './BrandLogo';
import { NotificationBell } from './NotificationBell';

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onNavigate }) => {
  const [user, setUser] = useState<UserSession | null>(store.getCurrentUser());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    return store.subscribe(() => {
      setUser(store.getCurrentUser());
    });
  }, []);

  const handleLogout = () => {
    store.logout();
    onNavigate('home');
  };

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About' },
    { id: 'services', label: 'Services' },
    { id: 'service-areas', label: 'Coverage' },
    { id: 'vehicles', label: 'Fleet' },
    { id: 'team', label: 'Meet the Team' },
    { id: 'contact', label: 'Contact' },
  ];

  const mobileNavLinks = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About' },
    { id: 'services', label: 'Services' },
    { id: 'service-areas', label: 'Coverage' },
    { id: 'vehicles', label: 'Fleet' },
    { id: 'team', label: 'Meet the Team' },
    { id: 'tracking', label: 'Order Status' },
    { id: 'contact', label: 'Contact' },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-200 shadow-sm bg-white/95 backdrop-blur-md border-b border-slate-200/90">
        {/* Top Info Bar (Standard Compact Text Size for Space Efficiency) */}
        <div className="bg-slate-100 border-b border-slate-200 text-[11px] py-1 px-4 hidden md:block">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-slate-600">
            <div className="flex items-center space-x-5">
              <span className="flex items-center text-emerald-700 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1.5"></span>
                GTA Dispatch Active: Same-Day Delivery Online
              </span>
              <span className="flex items-center text-slate-600">
                <Clock className="w-3 h-3 text-red-600 mr-1" />
                Hours: 8:00 AM – 5:00 PM (After-Hours 24/7 Available)
              </span>
              <span className="flex items-center text-slate-600">
                <MapPin className="w-3 h-3 text-red-600 mr-1" />
                Serving Toronto, GTA & Southern Ontario
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <a
                href="tel:+16478049775"
                className="flex items-center text-slate-700 hover:text-red-600 font-semibold transition"
              >
                <Phone className="w-3 h-3 text-red-600 mr-1" />
                Dispatch: +1 (647) 804-9775
              </a>
            </div>
          </div>
        </div>

        {/* Sleek Compact Main Navigation Bar */}
        <nav className="px-3 sm:px-6">
          <div className="max-w-7xl mx-auto py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-4">
          {/* Authentic Recreated Brand Logo */}
          <div
            onClick={() => onNavigate('home')}
            className="cursor-pointer group select-none flex items-center shrink-0 min-w-0"
          >
            <BrandLogo size="sm" />
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center space-x-0.5 xl:space-x-1 shrink min-w-0">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => onNavigate(link.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-smooth cursor-pointer whitespace-nowrap ${
                  currentTab === link.id
                    ? 'text-red-700 bg-red-50 font-bold border border-red-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center space-x-1.5 xl:space-x-2 shrink-0">
            {/* Quick Dispatch Phone Callout (Only on very wide screens when logged out to preserve spacing) */}
            {!user && (
              <a
                href="tel:+16478049775"
                className="hidden 2xl:flex items-center text-xs font-semibold text-slate-700 hover:text-red-600 transition-smooth px-2.5 py-1.5 rounded-lg hover:bg-slate-100 whitespace-nowrap"
                title="Call Dispatch directly"
              >
                <Phone className="w-3.5 h-3.5 text-red-600 mr-1.5" />
                <span>(647) 804-9775</span>
              </a>
            )}

            {/* Quick Order Status button */}
            <button
              onClick={() => onNavigate('tracking')}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-smooth cursor-pointer whitespace-nowrap border ${
                currentTab === 'tracking'
                  ? 'bg-red-50 text-red-700 border-red-200 font-bold'
                  : 'text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border-slate-200'
              }`}
              title="Check order status with FD number"
            >
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <span>Order Status</span>
            </button>

            {/* Portal / Role Button & Notification Bell */}
            {user ? (
              <div className="flex items-center space-x-1.5">
                {(user.role === 'admin' || user.role === 'owner' || user.role === 'driver') && (
                  <NotificationBell onNavigate={onNavigate} />
                )}
                <button
                  onClick={() => onNavigate(user.role === 'owner' || user.role === 'admin' ? 'admin' : user.role === 'driver' ? 'driver' : 'customer')}
                  className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-smooth cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5 text-red-600" />
                  <span>{user.role === 'owner' || user.role === 'admin' ? 'Admin' : user.role === 'driver' ? 'Staff' : 'Portal'}</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-smooth cursor-pointer"
                  title="Log out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => onNavigate('login')}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-smooth cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>Sign In</span>
              </button>
            )}

            {/* Primary Order CTA */}
            <button
              onClick={() => onNavigate('order')}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-bold text-white btn-gradient-primary rounded-lg shadow-md transition-smooth group cursor-pointer"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Request a Quote</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Mobile Menu Controls */}
          <div className="flex items-center space-x-1.5 sm:hidden shrink-0">
            {user && (user.role === 'admin' || user.role === 'owner' || user.role === 'driver') && (
              <NotificationBell onNavigate={onNavigate} />
            )}
            <button
              onClick={() => onNavigate('order')}
              className="min-h-[36px] px-2.5 py-1 text-[11px] font-bold text-white btn-gradient-primary rounded-lg shadow-sm transition-smooth flex items-center justify-center cursor-pointer whitespace-nowrap"
            >
              Order Now
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="min-h-[38px] min-w-[38px] p-2 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-smooth flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-red-500/40 cursor-pointer shrink-0"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-3 pt-3 border-t border-slate-200 pb-4 space-y-1 bg-white">
            {mobileNavLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => {
                  onNavigate(link.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-semibold transition-smooth flex items-center justify-between cursor-pointer ${
                  currentTab === link.id
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                }`}
              >
                <span>{link.label}</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            ))}

            <div className="pt-3 border-t border-slate-200 flex flex-col space-y-2.5">
              <button
                onClick={() => {
                  onNavigate('order');
                  setMobileMenuOpen(false);
                }}
                className="w-full min-h-[48px] py-3 btn-gradient-primary text-white font-bold rounded-xl text-sm text-center flex items-center justify-center space-x-2 transition-smooth shadow-lg cursor-pointer"
              >
                <Truck className="w-4 h-4" />
                <span>Request a Delivery</span>
              </button>

              <button
                onClick={() => {
                  onNavigate(user ? (user.role === 'owner' || user.role === 'admin' ? 'admin' : user.role === 'driver' ? 'driver' : 'customer') : 'login');
                  setMobileMenuOpen(false);
                }}
                className="w-full min-h-[44px] py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-sm flex items-center justify-center space-x-2 border border-slate-200 transition-smooth cursor-pointer"
              >
                <User className="w-4 h-4 text-slate-600" />
                <span>{user ? `Go to ${user.role === 'owner' || user.role === 'admin' ? 'Admin Panel' : user.role === 'driver' ? 'Staff Portal' : 'Customer Portal'}` : 'Portal Sign In / Register'}</span>
              </button>
            </div>
          </div>
        )}
      </nav>
    </header>
    {/* Spacer so page content begins directly beneath fixed navbar */}
    <div className="h-[48px] md:h-[70px] w-full shrink-0 pointer-events-none" aria-hidden="true" />
  </>
  );
};
