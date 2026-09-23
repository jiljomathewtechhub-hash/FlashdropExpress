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
import { TermsPage } from './pages/TermsPage';
import { AboutPage } from './pages/AboutPage';
import { TeamPage } from './pages/TeamPage';
import { OrderWizard } from './components/order/OrderWizard';
import { OrderTracker } from './components/tracking/OrderTracker';
import { CustomerPortal } from './components/customer/CustomerPortal';
import { DriverDashboard } from './components/driver/DriverDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { OwnerDashboard } from './components/owner/OwnerDashboard';
import { Phone, Truck, Search, Shield, User } from 'lucide-react';
import { store, UserSession } from './lib/store';
import { FullPage3DHighway } from './components/common/FullPage3DHighway';
import { NotificationToastContainer } from './components/common/NotificationToastContainer';
import { NotificationDetailModal } from './components/common/NotificationDetailModal';

const VALID_TABS = [
  'home',
  'about',
  'services',
  'service-areas',
  'vehicles',
  'team',
  'pricing',
  'terms',
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
  const pathname = window.location.pathname.replace(/^\//, '').replace(/\/$/, '').toLowerCase();
  const rawHash = window.location.hash.replace(/^#\/?/, '').trim();
  const search = window.location.search;

  if (
    rawHash.includes('type=recovery') ||
    rawHash.includes('reset-password') ||
    rawHash.includes('access_token=') ||
    search.includes('type=recovery')
  ) {
    return 'login';
  }

  // Detect quotation confirmation or tracking in search or hash
  if (
    search.includes('confirm_quote=') ||
    search.includes('track=') ||
    rawHash.startsWith('track') ||
    rawHash.includes('action=confirm')
  ) {
    return 'tracking';
  }

  const cleanHash = rawHash.split('?')[0].split('&')[0];
  if (cleanHash === 'track') return 'tracking';
  if (VALID_TABS.includes(cleanHash)) return cleanHash;

  const cleanPath = pathname.split('?')[0].split('&')[0];
  if (cleanPath === 'track') return 'tracking';
  if (VALID_TABS.includes(cleanPath)) return cleanPath;

  return 'home';
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

  // Check on initial load if user landed from a quote confirmation, tracking, or password recovery link
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const rawHash = window.location.hash;
    const search = window.location.search;

    if (
      rawHash.includes('type=recovery') ||
      rawHash.includes('reset-password') ||
      rawHash.includes('access_token') ||
      search.includes('type=recovery')
    ) {
      setCurrentTab('login');
      setNavParam({ mode: 'reset' });
      return;
    }

    // Inspect URL parameters for direct quote confirmation or order tracking
    const searchParams = new URLSearchParams(search);
    const hashQueryIndex = rawHash.indexOf('?');
    const hashParams = hashQueryIndex !== -1 ? new URLSearchParams(rawHash.slice(hashQueryIndex)) : new URLSearchParams();

    const confirmQuoteParam = searchParams.get('confirm_quote') || hashParams.get('confirm_quote');
    const trackParam = searchParams.get('track') || hashParams.get('track') || searchParams.get('order') || hashParams.get('order');
    const actionParam = searchParams.get('action') || hashParams.get('action');
    const confirmFlag = searchParams.get('confirm') || hashParams.get('confirm');

    const shouldAutoConfirm = Boolean(
      confirmQuoteParam ||
      actionParam === 'confirm_quote' ||
      actionParam === 'confirm' ||
      confirmFlag === '1' ||
      confirmFlag === 'true'
    );
    const targetOrderNumber = (confirmQuoteParam || trackParam || '').trim();

    if (targetOrderNumber) {
      setCurrentTab('tracking');
      setNavParam({
        orderNumber: targetOrderNumber,
        autoConfirm: shouldAutoConfirm,
      });
    }
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

  // Strict route protection for dashboards: redirect unauthorized users to login or their designated portal
  useEffect(() => {
    const user = store.getCurrentUser();
    if (currentTab === 'admin' || currentTab === 'owner') {
      if (!user) {
        handleNavigate('login', { role: 'admin', error: 'Administrator credentials required to access this portal.' }, true);
      } else if (user.role !== 'admin' && user.role !== 'owner') {
        // Bounce unauthorized users back to their own portal
        handleNavigate(user.role === 'driver' || user.role === 'dispatcher' ? 'driver' : 'customer', {
          error: 'Access Denied: You do not have Administrator privileges.',
        }, true);
      }
    } else if (currentTab === 'driver') {
      if (!user) {
        handleNavigate('login', { role: 'driver', error: 'Staff credentials required to access this portal.' }, true);
      } else if (user.role === 'customer') {
        // Customer accounts cannot access driver portal
        handleNavigate('customer', {
          error: 'Access Denied: The Fleet Portal is restricted to FlashDrop staff and drivers.',
        }, true);
      }
    } else if (currentTab === 'customer') {
      if (!user) {
        handleNavigate('login', { role: 'customer', error: 'Please sign in or register to access the Customer Portal.' }, true);
      } else if (user.role === 'driver' || user.role === 'dispatcher') {
        // Driver accounts cannot access customer portal
        handleNavigate('driver', {
          error: 'Access Denied: Drivers and staff cannot access the Customer Portal. You have been redirected to your Fleet Portal.',
        }, true);
      } else if (user.role === 'admin' || user.role === 'owner') {
        // Admin accounts should use Admin portal
        handleNavigate('admin', {
          error: 'Access Denied: Please use the Dispatch Command Center.',
        }, true);
      }
    }
  }, [currentTab, currentUser]);

  const isAdminTab = currentTab === 'admin' || currentTab === 'owner';

  useEffect(() => {
    if (isAdminTab) {
      document.body.classList.add('admin-dashboard-scope');
    } else {
      document.body.classList.remove('admin-dashboard-scope');
    }
    return () => {
      document.body.classList.remove('admin-dashboard-scope');
    };
  }, [isAdminTab]);

  return (
    <div className={`min-h-screen ${isAdminTab ? 'bg-[#F1F5F9] admin-dashboard-scope' : 'bg-[#F8FAFC]'} text-slate-800 flex flex-col justify-between selection:bg-red-500 selection:text-white relative`}>
      {/* Full-Website Moving Highway & Vehicle Experience (disabled on Admin Dashboard for distraction-free performance) */}
      {!isAdminTab && <FullPage3DHighway />}

      {/* Top Navbar */}
      <Navbar currentTab={currentTab} onNavigate={handleNavigate} />

      {/* Real-time In-App Dispatch Notification Toasts & Audio Chimes */}
      <NotificationToastContainer onNavigate={handleNavigate} />

      {/* Pop-Up Window: Full Notification Details Modal */}
      <NotificationDetailModal onNavigate={handleNavigate} />

      {/* Main Content View */}
      <main className="flex-grow relative z-10 pb-20 sm:pb-0">
        {currentTab === 'home' && <HomePage onNavigate={handleNavigate} />}
        {currentTab === 'about' && <AboutPage onNavigate={handleNavigate} />}
        {currentTab === 'services' && <ServicesPage onNavigate={handleNavigate} />}
        {currentTab === 'service-areas' && <ServiceAreasPage onNavigate={handleNavigate} />}
        {currentTab === 'vehicles' && <VehiclesPage onNavigate={handleNavigate} />}
        {currentTab === 'team' && <TeamPage onNavigate={handleNavigate} />}
        {currentTab === 'pricing' && <PricingPage onNavigate={handleNavigate} />}
        {currentTab === 'terms' && <TermsPage onNavigate={handleNavigate} />}
        {currentTab === 'order' && <OrderWizard initialData={navParam} onNavigate={handleNavigate} />}
        {currentTab === 'tracking' && (
          <OrderTracker
            initialOrderNumber={
              typeof navParam === 'string'
                ? navParam
                : navParam?.orderNumber || undefined
            }
            autoConfirm={
              typeof navParam === 'object' && navParam !== null
                ? !!navParam.autoConfirm
                : false
            }
            onNavigate={handleNavigate}
          />
        )}
        {currentTab === 'contact' && <ContactPage onNavigate={handleNavigate} />}
        {currentTab === 'login' && <LoginPage onNavigate={handleNavigate} initialParams={navParam} />}
        {currentTab === 'customer' && currentUser && currentUser.role === 'customer' && (
          <CustomerPortal onNavigate={handleNavigate} />
        )}
        {currentTab === 'driver' && currentUser && (currentUser.role === 'driver' || currentUser.role === 'dispatcher' || currentUser.role === 'admin' || currentUser.role === 'owner') && (
          <DriverDashboard onNavigate={handleNavigate} initialParams={navParam} />
        )}
        {(currentTab === 'admin' || currentTab === 'owner') && currentUser && (currentUser.role === 'admin' || currentUser.role === 'owner') && (
          <AdminDashboard onNavigate={handleNavigate} initialParams={navParam} />
        )}
      </main>

      {/* Floating Bottom Quick Action Dock for Mobile (Thumb-Friendly WCAG 48px) */}
      <div className="fixed bottom-3 left-3 right-3 z-40 sm:hidden mobile-safe-dock">
        <div className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl p-1.5 shadow-xl shadow-slate-900/10 flex items-center justify-between">
          <a
            href="tel:+16478049775"
            className="min-h-[48px] min-w-[72px] flex flex-col items-center justify-center px-2 py-1 text-slate-600 hover:text-slate-900 transition-smooth rounded-xl hover:bg-slate-100 active:bg-slate-200"
            aria-label="Call Dispatch Desk at +1 (647) 804-9775"
          >
            <Phone className="w-4 h-4 text-red-600" />
            <span className="text-[10px] font-bold mt-0.5 tracking-tight">Call Desk</span>
          </a>

          <button
            onClick={() => handleNavigate('order')}
            className="flex-1 mx-1.5 min-h-[48px] py-3 btn-gradient-primary text-white font-bold text-xs rounded-xl shadow-md shadow-red-600/20 flex items-center justify-center space-x-1.5 transition-smooth active:scale-[0.98] cursor-pointer"
          >
            <Truck className="w-4 h-4 shrink-0" />
            <span className="tracking-wide">Order Delivery</span>
          </button>

          <button
            onClick={() => handleNavigate('tracking')}
            className="min-h-[48px] min-w-[62px] flex flex-col items-center justify-center px-2 py-1 text-slate-600 hover:text-slate-900 transition-smooth rounded-xl hover:bg-slate-100 active:bg-slate-200 cursor-pointer"
            aria-label="Check Order Status with FD code"
          >
            <Search className="w-4 h-4 text-sky-600" />
            <span className="text-[10px] font-bold mt-0.5 tracking-tight">Status</span>
          </button>
        </div>
      </div>

      {/* Footer */}
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}
