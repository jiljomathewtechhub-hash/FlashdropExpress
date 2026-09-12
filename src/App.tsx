import React, { useState, useEffect } from 'react';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { HomePage } from './pages/HomePage';
import { ServicesPage } from './pages/ServicesPage';
import { ServiceAreasPage } from './pages/ServiceAreasPage';
import { VehiclesPage } from './pages/VehiclesPage';
import { PricingPage } from './pages/PricingPage';
import { ContactPage } from './pages/ContactPage';
import { LoginPage } from './pages/LoginPage';
import { OrderWizard } from './components/order/OrderWizard';
import { OrderTracker } from './components/tracking/OrderTracker';
import { CustomerPortal } from './components/customer/CustomerPortal';
import { DriverDashboard } from './components/driver/DriverDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { OwnerDashboard } from './components/owner/OwnerDashboard';
import { Phone, Truck, Search, Shield, User } from 'lucide-react';
import { store, UserSession } from './lib/store';
import { FullPage3DHighway } from './components/common/FullPage3DHighway';

const VALID_TABS = [
  'home',
  'services',
  'service-areas',
  'vehicles',
  'pricing',
  'order',
  'tracking',
  'contact',
  'login',
  'customer',
  'driver',
  'admin',
  'owner',
];

const getTabFromHash = (): string => {
  if (typeof window === 'undefined') return 'home';
  const hash = window.location.hash.replace(/^#\/?/, '').trim();
  return VALID_TABS.includes(hash) ? hash : 'home';
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => store.getCurrentUser());
  const [currentTab, setCurrentTab] = useState<string>(getTabFromHash);
  const [navParam, setNavParam] = useState<any>(null);

  // Subscribe to auth store updates
  useEffect(() => {
    return store.subscribe(() => {
      setCurrentUser(store.getCurrentUser());
    });
  }, []);

  const handleNavigate = (tab: string, param?: any, replace = false) => {
    setCurrentTab(tab);
    setNavParam(param || null);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const targetHash = `#${tab}`;
    if (replace) {
      window.history.replaceState({ tab, param }, '', targetHash);
    } else if (window.location.hash !== targetHash) {
      window.history.pushState({ tab, param }, '', targetHash);
    }
  };

  // Synchronize with native browser back & forward buttons
  useEffect(() => {
    const initialTab = getTabFromHash();
    if (!window.history.state?.tab) {
      window.history.replaceState({ tab: initialTab }, '', window.location.hash || `#${initialTab}`);
    }

    const handlePopState = (event: PopStateEvent) => {
      const targetTab = event.state?.tab || getTabFromHash();
      setCurrentTab(targetTab);
      setNavParam(event.state?.param || null);
    };

    const handleHashChange = () => {
      const tab = getTabFromHash();
      setCurrentTab(tab);
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Strict route protection for dashboards: redirect unauthorized users to login
  useEffect(() => {
    const user = store.getCurrentUser();
    if (currentTab === 'admin' || currentTab === 'owner') {
      if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
        handleNavigate('login', { role: 'admin', error: 'Administrator credentials required to access this portal.' }, true);
      }
    } else if (currentTab === 'driver') {
      if (!user || (user.role !== 'driver' && user.role !== 'dispatcher' && user.role !== 'admin' && user.role !== 'owner')) {
        handleNavigate('login', { role: 'driver', error: 'Staff credentials required to access this portal.' }, true);
      }
    } else if (currentTab === 'customer') {
      if (!user) {
        handleNavigate('login', { role: 'customer', error: 'Please sign in or register to access the Customer Portal.' }, true);
      }
    }
  }, [currentTab, currentUser]);

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 flex flex-col justify-between selection:bg-red-500 selection:text-white relative">
      {/* Full-Website Moving Highway & Vehicle Experience */}
      <FullPage3DHighway />

      {/* Top Navbar */}
      <Navbar currentTab={currentTab} onNavigate={handleNavigate} />

      {/* Main Content View */}
      <main className="flex-grow relative z-10 pb-20 sm:pb-0">
        {currentTab === 'home' && <HomePage onNavigate={handleNavigate} />}
        {currentTab === 'services' && <ServicesPage onNavigate={handleNavigate} />}
        {currentTab === 'service-areas' && <ServiceAreasPage onNavigate={handleNavigate} />}
        {currentTab === 'vehicles' && <VehiclesPage onNavigate={handleNavigate} />}
        {currentTab === 'pricing' && <PricingPage onNavigate={handleNavigate} />}
        {currentTab === 'order' && <OrderWizard initialData={navParam} onNavigate={handleNavigate} />}
        {currentTab === 'tracking' && (
          <OrderTracker
            initialOrderNumber={typeof navParam === 'string' ? navParam : undefined}
            onNavigate={handleNavigate}
          />
        )}
        {currentTab === 'contact' && <ContactPage onNavigate={handleNavigate} />}
        {currentTab === 'login' && <LoginPage onNavigate={handleNavigate} initialParams={navParam} />}
        {currentTab === 'customer' && currentUser && <CustomerPortal onNavigate={handleNavigate} />}
        {currentTab === 'driver' && currentUser && (currentUser.role === 'driver' || currentUser.role === 'dispatcher' || currentUser.role === 'admin' || currentUser.role === 'owner') && (
          <DriverDashboard onNavigate={handleNavigate} />
        )}
        {(currentTab === 'admin' || currentTab === 'owner') && currentUser && (currentUser.role === 'admin' || currentUser.role === 'owner') && (
          <AdminDashboard onNavigate={handleNavigate} />
        )}
      </main>

      {/* Floating Bottom Quick Action Dock for Mobile (Thumb-Friendly WCAG 48px) */}
      <div className="fixed bottom-3 left-3 right-3 z-40 sm:hidden mobile-safe-dock">
        <div className="bg-[#0A0D14]/95 backdrop-blur-xl border border-white/15 rounded-2xl p-1.5 shadow-2xl flex items-center justify-between">
          <a
            href="tel:+16478049775"
            className="min-h-[48px] min-w-[72px] flex flex-col items-center justify-center px-2 py-1 text-slate-300 hover:text-white transition-smooth rounded-xl hover:bg-white/5 active:bg-white/10"
            aria-label="Call Dispatch Desk at +1 (647) 804-9775"
          >
            <Phone className="w-4 h-4 text-red-400" />
            <span className="text-[10px] font-bold mt-0.5 tracking-tight">Call Desk</span>
          </a>

          <button
            onClick={() => handleNavigate('order')}
            className="flex-1 mx-1.5 min-h-[48px] py-3 btn-gradient-primary text-white font-bold text-xs rounded-xl shadow-lg shadow-red-950/50 flex items-center justify-center space-x-1.5 transition-smooth active:scale-[0.98] cursor-pointer"
          >
            <Truck className="w-4 h-4 shrink-0" />
            <span className="tracking-wide">Order Delivery</span>
          </button>

          <button
            onClick={() => handleNavigate('tracking')}
            className="min-h-[48px] min-w-[62px] flex flex-col items-center justify-center px-2 py-1 text-slate-300 hover:text-white transition-smooth rounded-xl hover:bg-white/5 active:bg-white/10 cursor-pointer"
            aria-label="Track Order with FD code"
          >
            <Search className="w-4 h-4 text-sky-300" />
            <span className="text-[10px] font-bold mt-0.5 tracking-tight">Track</span>
          </button>
        </div>
      </div>

      {/* Footer */}
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}
