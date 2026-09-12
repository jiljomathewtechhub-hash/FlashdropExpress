import React, { useState, useEffect } from 'react';
import {
  Shield,
  Truck,
  User,
  Mail,
  ArrowRight,
  CheckCircle2,
  Lock,
  Phone,
  AlertCircle,
  Loader2,
  Building2,
  MapPin,
  Info,
} from 'lucide-react';
import { UserRole } from '../types/order';
import { store } from '../lib/store';
import { supabase } from '../lib/supabase';

interface LoginPageProps {
  onNavigate: (tab: string, param?: any) => void;
  initialParams?: {
    role?: UserRole;
    error?: string;
  } | null;
}

const ADMIN_EMAILS = [
  'support@flashdropexpress.com',
  'admin@flashdropexpress.com',
  'nidhin@flashdropexpress.com',
  'jiljomathew.techhub@gmail.com',
];

const checkIsAdminEmail = (emailStr?: string | null): boolean => {
  if (!emailStr) return false;
  const lower = emailStr.toLowerCase().trim();
  return (
    ADMIN_EMAILS.includes(lower) ||
    lower.includes('admin') ||
    lower.endsWith('@flashdropexpress.com')
  );
};

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate, initialParams }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialParams?.role || 'customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(initialParams?.error || null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialParams?.role) {
      setSelectedRole(initialParams.role);
    }
    if (initialParams?.error) {
      setErrorMessage(initialParams.error);
    }
  }, [initialParams]);

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    setIsRegister(false);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    const emailTrimmed = email.trim().toLowerCase();
    const passwordTrimmed = password.trim();

    if (!supabase) {
      setErrorMessage('Authentication service is currently unavailable. Please check your connection.');
      setIsLoading(false);
      return;
    }

    try {
      if (isRegister) {
        // Only customers can register externally
        if (selectedRole !== 'customer') {
          throw new Error('Registration is strictly restricted to commercial customer accounts. Staff accounts must be provisioned by the Administrator.');
        }

        // Validate all required customer fields
        if (!fullName.trim()) throw new Error('Full Name of the contact person is required.');
        if (!companyName.trim()) throw new Error('Company or Business Name is required for commercial registration.');
        if (!phone.trim()) throw new Error('Business Phone Number is required for delivery coordination.');
        if (!address.trim()) throw new Error('Business Delivery Address is required.');
        if (passwordTrimmed.length < 6) throw new Error('Password must be at least 6 characters.');
        if (passwordTrimmed !== confirmPassword.trim()) throw new Error('Passwords do not match. Please re-enter your password.');

        // 1. Supabase Auth Sign Up
        const { data, error } = await supabase.auth.signUp({
          email: emailTrimmed,
          password: passwordTrimmed,
          options: {
            data: {
              role: 'customer',
              full_name: fullName.trim(),
              company_name: companyName.trim(),
              phone: phone.trim(),
              address: address.trim(),
            },
          },
        });

        if (error) {
          throw error;
        }

        if (!data.user) {
          throw new Error('Registration failed. Please try again.');
        }

        // 2. Save complete profile in Supabase profiles table
        await supabase.from('profiles').upsert([
          {
            id: data.user.id,
            email: emailTrimmed,
            role: 'customer',
            full_name: fullName.trim(),
            company_name: companyName.trim(),
            phone: phone.trim(),
          },
        ]);

        // 3. Set verified user session
        store.setCurrentUser({
          role: 'customer',
          email: emailTrimmed,
          name: fullName.trim(),
          phone: phone.trim(),
        });

        setSuccessMessage('Commercial account created successfully! Redirecting to Customer Portal...');
        setTimeout(() => {
          onNavigate('customer');
        }, 800);
        return;
      }

      // --- SIGN IN FLOW ---
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: emailTrimmed,
        password: passwordTrimmed,
      });

      if (authError || !authData.user) {
        if (selectedRole === 'admin') {
          throw new Error('Invalid administrator credentials. Access to this section is restricted to authorized personnel.');
        } else if (selectedRole === 'driver') {
          throw new Error('Invalid staff credentials. Staff accounts are provisioned exclusively by the Administrator.');
        } else {
          throw new Error('Invalid email or password. If you do not have an account yet, click "Create a new commercial account" below.');
        }
      }

      // Fetch user profile from Supabase to verify permissions
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      const userEmail = authData.user.email || emailTrimmed;
      const isAdminUser = checkIsAdminEmail(userEmail) || profile?.role === 'admin' || profile?.role === 'owner';
      const isStaffUser = profile?.role === 'driver' || profile?.role === 'dispatcher' || isAdminUser;

      // 1. Admin Portal Guard
      if (selectedRole === 'admin') {
        if (!isAdminUser) {
          await supabase.auth.signOut();
          throw new Error('Access Denied: This account does not have Administrator privileges.');
        }

        store.setCurrentUser({
          role: 'admin',
          email: userEmail,
          name: profile?.full_name || authData.user.user_metadata?.full_name || 'Administrator',
          phone: profile?.phone || '',
        });

        setSuccessMessage('Administrator authenticated. Loading Dispatch Command Center...');
        setTimeout(() => onNavigate('admin'), 500);
        return;
      }

      // 2. Staff / Driver Portal Guard
      if (selectedRole === 'driver') {
        if (!isStaffUser) {
          await supabase.auth.signOut();
          throw new Error('Access Denied: This account is not authorized as FlashDrop staff. Accounts must be provisioned by the Administrator.');
        }

        // Look up driver in local store or fetch from Supabase
        let matchingDriver = store.getDrivers().find(
          (d) =>
            (d.email && d.email.toLowerCase() === userEmail.toLowerCase()) ||
            (d.user_id && d.user_id === authData.user.id) ||
            d.id === authData.user.id
        );

        if (!matchingDriver && supabase) {
          const { data: dbDriver } = await supabase
            .from('drivers')
            .select('*')
            .or(`email.ilike.${userEmail},user_id.eq.${authData.user.id}`)
            .maybeSingle();

          if (dbDriver) {
            matchingDriver = store.addDriver({
              id: dbDriver.id,
              user_id: dbDriver.user_id || authData.user.id,
              name: dbDriver.name,
              email: dbDriver.email,
              phone: dbDriver.phone,
              vehicle_type: dbDriver.vehicle_type,
              license_plate: dbDriver.license_plate,
              is_active: dbDriver.is_active,
              current_status: dbDriver.current_status,
              staff_role: dbDriver.staff_role || 'driver',
            });
          }
        }

        store.setCurrentUser({
          role: isAdminUser ? 'admin' : 'driver',
          email: userEmail,
          name: profile?.full_name || matchingDriver?.name || authData.user.user_metadata?.full_name || 'Staff Member',
          phone: profile?.phone || matchingDriver?.phone || '',
          driverId: matchingDriver?.id || authData.user.id,
        });

        setSuccessMessage('Staff authenticated. Loading Driver Fleet Portal...');
        setTimeout(() => onNavigate('driver'), 500);
        return;
      }

      // 3. Customer Portal
      store.setCurrentUser({
        role: (profile?.role as UserRole) || 'customer',
        email: userEmail,
        name: profile?.full_name || profile?.company_name || authData.user.user_metadata?.full_name || 'Customer',
        phone: profile?.phone || authData.user.user_metadata?.phone || '',
      });

      setSuccessMessage('Welcome back! Loading Customer Portal...');
      setTimeout(() => onNavigate('customer'), 500);
    } catch (err: any) {
      console.error('Authentication error:', err);
      let msg = err?.message || 'Authentication failed. Please verify your credentials.';
      if (msg.includes('Invalid login credentials')) {
        if (selectedRole === 'admin') {
          msg = 'Invalid administrator email or password.';
        } else if (selectedRole === 'driver') {
          msg = 'Invalid staff credentials. Staff accounts are created directly by the Administrator.';
        } else {
          msg = 'Invalid email or password. If you do not have an account, click "Register here" below.';
        }
      }
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 relative z-10">
      <div className="max-w-md w-full space-y-6 bg-[#0A0E18]/95 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl relative">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto shadow-inner">
            {selectedRole === 'admin' ? (
              <Shield className="w-6 h-6" />
            ) : selectedRole === 'driver' ? (
              <Truck className="w-6 h-6" />
            ) : (
              <User className="w-6 h-6" />
            )}
          </div>
          <h2 className="text-2xl font-black text-white font-['Outfit'] tracking-tight">
            {selectedRole === 'admin'
              ? 'Administrator Login'
              : selectedRole === 'driver'
              ? 'Staff & Fleet Login'
              : isRegister
              ? 'Create Commercial Account'
              : 'Customer Portal Login'}
          </h2>
          <p className="text-xs text-slate-400">
            {selectedRole === 'admin'
              ? 'Restricted dispatch executive access. Authorized personnel only.'
              : selectedRole === 'driver'
              ? 'Courier driver and internal operations management portal.'
              : isRegister
              ? 'Register your business for direct GTA freight and courier service.'
              : 'Sign in to manage commercial deliveries, invoices, and tracking.'}
          </p>
        </div>

        {/* Error / Success Messages */}
        {errorMessage && (
          <div className="p-3.5 bg-red-950/80 border border-red-500/50 rounded-xl flex items-start space-x-2.5 text-xs text-red-200 animate-fade-in shadow-lg">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed font-medium">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 bg-emerald-950/80 border border-emerald-500/50 rounded-xl flex items-start space-x-2.5 text-xs text-emerald-200 animate-fade-in shadow-lg">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed font-medium">{successMessage}</span>
          </div>
        )}

        {/* Role Selection Switcher */}
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
            Select Your Portal
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { role: 'customer' as UserRole, label: 'Customer', desc: 'Commercial Client', icon: User },
              { role: 'driver' as UserRole, label: 'Staff / Fleet', desc: 'Drivers & Ops', icon: Truck },
              { role: 'admin' as UserRole, label: 'Administrator', desc: 'Dispatch Executive', icon: Shield },
            ].map((r) => {
              const Icon = r.icon;
              const isSelected = selectedRole === r.role || (r.role === 'admin' && selectedRole === 'owner');
              return (
                <button
                  key={r.role}
                  type="button"
                  onClick={() => handleRoleChange(r.role)}
                  className={`py-2.5 px-2 rounded-xl border text-center transition flex flex-col items-center justify-center space-y-1 cursor-pointer ${
                    isSelected
                      ? 'bg-red-950/40 border-red-500/40 text-white shadow-sm ring-1 ring-red-500/30'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-red-400' : 'text-slate-500'}`} />
                  <span className="text-xs font-bold leading-tight">{r.label}</span>
                  <span className="text-[9px] text-slate-500 hidden sm:block">{r.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Security Notice for Admin & Staff */}
        {selectedRole === 'admin' && (
          <div className="p-3 bg-red-950/30 border border-red-500/20 rounded-xl flex items-start space-x-2 text-[11px] text-slate-300">
            <Shield className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>
              <strong>Secure Dispatch Area:</strong> Only accounts registered with Administrator privileges can access this panel. Unauthorized access attempts are monitored.
            </span>
          </div>
        )}

        {selectedRole === 'driver' && (
          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex items-start space-x-2 text-[11px] text-slate-300">
            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <span>
              <strong>Staff Accounts:</strong> Employee and driver accounts are created directly by the Administrator in the Admin Dashboard. Public registration is disabled.
            </span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
          {isRegister && selectedRole === 'customer' && (
            <>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Contact Person Full Name <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Michael Smith"
                    className="w-full bg-[#0B0F17] border border-slate-700 pl-10 pr-3 py-2.5 rounded-xl text-white placeholder:text-slate-500 focus:border-red-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Company / Business Name <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Apex Coatings & Construction Inc."
                    className="w-full bg-[#0B0F17] border border-slate-700 pl-10 pr-3 py-2.5 rounded-xl text-white placeholder:text-slate-500 focus:border-red-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Business Phone Number <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +1 (647) 555-0199"
                    className="w-full bg-[#0B0F17] border border-slate-700 pl-10 pr-3 py-2.5 rounded-xl text-white placeholder:text-slate-500 focus:border-red-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Business / Delivery Address <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. 150 King St W, Toronto, ON"
                    className="w-full bg-[#0B0F17] border border-slate-700 pl-10 pr-3 py-2.5 rounded-xl text-white placeholder:text-slate-500 focus:border-red-500 focus:outline-none"
                    required
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Email Address <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={
                  selectedRole === 'admin'
                    ? 'e.g. admin@flashdropexpress.com'
                    : selectedRole === 'driver'
                    ? 'e.g. staff.name@flashdropexpress.com'
                    : 'e.g. client@company.com'
                }
                className="w-full bg-[#0B0F17] border border-slate-700 pl-10 pr-3 py-2.5 rounded-xl text-white placeholder:text-slate-500 focus:border-red-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Password <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                className="w-full bg-[#0B0F17] border border-slate-700 pl-10 pr-3 py-2.5 rounded-xl text-white placeholder:text-slate-500 focus:border-red-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {isRegister && selectedRole === 'customer' && (
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Confirm Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  className="w-full bg-[#0B0F17] border border-slate-700 pl-10 pr-3 py-2.5 rounded-xl text-white placeholder:text-slate-500 focus:border-red-500 focus:outline-none"
                  required
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-[#C5161D] hover:bg-[#A51218] disabled:opacity-60 text-white font-bold rounded-xl shadow-lg shadow-red-950/40 transition flex items-center justify-center space-x-2 cursor-pointer mt-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>
                  {isRegister
                    ? 'Register Commercial Account'
                    : selectedRole === 'admin'
                    ? 'Sign In as Administrator'
                    : selectedRole === 'driver'
                    ? 'Sign In as Staff'
                    : 'Sign In to Customer Portal'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Register / Sign In toggle for Customer only */}
        {selectedRole === 'customer' && (
          <div className="text-center pt-2 text-xs text-slate-400 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className="text-red-400 hover:text-red-300 hover:underline cursor-pointer font-medium"
            >
              {isRegister
                ? 'Already have a commercial customer account? Sign In here'
                : 'Need a new commercial account? Register your business'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
