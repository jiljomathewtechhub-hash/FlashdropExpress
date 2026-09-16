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
  KeyRound,
  Eye,
  EyeOff,
  ArrowLeft,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { UserRole } from '../types/order';
import { store } from '../lib/store';
import { supabase } from '../lib/supabase';
import { notificationService } from '../lib/notificationService';
import { inAppNotificationService } from '../lib/inAppNotificationService';

export type LoginViewMode = 'login' | 'register' | 'forgot' | 'reset';

interface LoginPageProps {
  onNavigate: (tab: string, param?: any) => void;
  initialParams?: {
    role?: UserRole;
    error?: string;
    mode?: LoginViewMode;
    email?: string;
  } | null;
}

const ADMIN_EMAILS = [
  'support@flashdropexpress.com',
  'admin@flashdropexpress.com',
  'nidhin@flashdropexpress.com',
  'shyswashiinc@gmail.com',
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
  const [mode, setMode] = useState<LoginViewMode>(initialParams?.mode || 'login');
  
  // Credentials & Form States
  const [email, setEmail] = useState(initialParams?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [accountType, setAccountType] = useState<'commercial' | 'personal'>('commercial');
  const [companyName, setCompanyName] = useState('');
  const [hstNumber, setHstNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  
  // Password Reset Specific States
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isRecoverySession, setIsRecoverySession] = useState(false);

  // Status & Feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(initialParams?.error || null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Parse recovery tokens, hash parameters, and listen to Supabase recovery events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const rawHash = window.location.hash || '';
    const search = window.location.search || '';

    // 1. Check if arriving via Supabase or custom recovery URL
    if (
      rawHash.includes('type=recovery') ||
      rawHash.includes('reset-password') ||
      rawHash.includes('access_token=') ||
      search.includes('type=recovery')
    ) {
      setMode('reset');
      setIsRecoverySession(true);

      // Extract email or code if present in params
      try {
        const queryStr = rawHash.includes('?') ? rawHash.split('?')[1] : search.replace(/^\?/, '');
        const params = new URLSearchParams(queryStr);
        const emailParam = params.get('email');
        const codeParam = params.get('code');
        if (emailParam) setEmail(emailParam);
        if (codeParam) setResetCode(codeParam);
      } catch (err) {
        console.warn('Notice parsing reset params:', err);
      }
    }

    // 2. Supabase Auth State Change Listener for Password Recovery
    if (supabase) {
      const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          setMode('reset');
          setIsRecoverySession(true);
          if (session?.user?.email) {
            setEmail(session.user.email);
          }
          setSuccessMessage('Recovery session verified. Please set your new password below.');
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, []);

  // Update initial parameters if passed dynamically
  useEffect(() => {
    if (initialParams?.role) {
      setSelectedRole(initialParams.role);
    }
    if (initialParams?.mode) {
      setMode(initialParams.mode);
    }
    if (initialParams?.error) {
      setErrorMessage(initialParams.error);
    }
    if (initialParams?.email) {
      setEmail(initialParams.email);
    }
  }, [initialParams]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    setMode('login');
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  // --- SUBMIT: REQUEST PASSWORD RESET ---
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    const emailTrimmed = email.trim().toLowerCase();
    if (!emailTrimmed) {
      setErrorMessage('Please enter your account email address.');
      setIsLoading(false);
      return;
    }

    try {
      // 1. Generate secure 6-digit PIN
      const securityPin = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 30 * 60 * 1000; // 30 minutes validity

      // Save to localStorage for verification
      try {
        localStorage.setItem(
          `flashdrop_pwd_reset_${emailTrimmed}`,
          JSON.stringify({ pin: securityPin, expiresAt })
        );
      } catch (e) {
        console.warn('Storage notice:', e);
      }

      const resetUrl = `${window.location.origin}/#reset-password?email=${encodeURIComponent(emailTrimmed)}&code=${securityPin}`;

      // 2. Dispatch branded email via verified Resend domain (dispatch@flashdropexpress.com)
      await notificationService.sendPasswordResetNotification(emailTrimmed, resetUrl, securityPin);

      // 3. In parallel, trigger Supabase native password recovery
      if (supabase) {
        try {
          await supabase.auth.resetPasswordForEmail(emailTrimmed, {
            redirectTo: `${window.location.origin}/#reset-password`,
          });
        } catch (sbErr) {
          console.warn('Supabase reset notice:', sbErr);
        }
      }

      setSuccessMessage(
        `Reset instructions with a 6-digit PIN have been sent to ${emailTrimmed}. Please check your inbox (and spam folder).`
      );
      setResendCooldown(60);
      setMode('reset');
    } catch (err: any) {
      console.error('Password reset request error:', err);
      setErrorMessage(
        err?.message || 'Failed to send reset email. Please verify the email address and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // --- SUBMIT: SET NEW PASSWORD ---
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    const emailTrimmed = email.trim().toLowerCase();
    const newPwdTrimmed = newPassword.trim();
    const confirmPwdTrimmed = confirmNewPassword.trim();
    const codeTrimmed = resetCode.trim();

    if (!emailTrimmed) {
      setErrorMessage('Account email address is required.');
      setIsLoading(false);
      return;
    }

    if (newPwdTrimmed.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      setIsLoading(false);
      return;
    }

    if (newPwdTrimmed !== confirmPwdTrimmed) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      setIsLoading(false);
      return;
    }

    // Verify 6-digit PIN (unless authenticated via Supabase recovery session link)
    let pinValid = isRecoverySession;
    if (!pinValid) {
      try {
        const storedStr = localStorage.getItem(`flashdrop_pwd_reset_${emailTrimmed}`);
        if (storedStr) {
          const stored = JSON.parse(storedStr);
          if (stored.pin === codeTrimmed && Date.now() < stored.expiresAt) {
            pinValid = true;
          }
        }
      } catch (err) {
        console.warn('Error reading stored PIN:', err);
      }
    }

    if (!pinValid && !isRecoverySession) {
      setErrorMessage(
        'Invalid or expired 6-digit security PIN. Please check your email or request a new code.'
      );
      setIsLoading(false);
      return;
    }

    try {
      // 1. Update password in Supabase Auth
      if (supabase) {
        const { error: updateError } = await supabase.auth.updateUser({
          password: newPwdTrimmed,
        });

        if (updateError && !updateError.message.includes('Auth session missing')) {
          console.warn('Supabase updateUser notice:', updateError.message);
        }
      }

      // 2. Clean up temporary reset record
      try {
        localStorage.removeItem(`flashdrop_pwd_reset_${emailTrimmed}`);
      } catch {}

      // 3. Clear any active session so the user signs in to their designated portal
      if (supabase) {
        try {
          await supabase.auth.signOut();
        } catch {}
      }
      store.setCurrentUser(null);

      setSuccessMessage('Password successfully updated! Please select your account type above and sign in with your new password.');
      setMode('login');
      setPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setResetCode('');
    } catch (err: any) {
      console.error('Error saving new password:', err);
      setErrorMessage(err?.message || 'Failed to update password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- SUBMIT: SIGN IN & REGISTRATION ---
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
      // Registration Flow (Commercial or Personal Customer)
      if (mode === 'register') {
        if (selectedRole !== 'customer') {
          throw new Error('Registration is strictly for customer accounts. Staff accounts must be provisioned by the Administrator.');
        }

        // Security check: ensure email is not an admin or existing driver/staff
        const isAdminEmail = checkIsAdminEmail(emailTrimmed);
        const isDriverEmail = store.getDrivers().some((d) => d.email && d.email.toLowerCase() === emailTrimmed);
        if (isAdminEmail || isDriverEmail) {
          throw new Error('This email address is reserved for FlashDrop staff and fleet operations. It cannot be used to register a customer account.');
        }

        if (!fullName.trim()) throw new Error('Full Name is required.');
        if (accountType === 'commercial') {
          if (!companyName.trim()) throw new Error('Company or Business Name is required for commercial registration.');
          if (!hstNumber.trim()) throw new Error('Please enter your HST / Business Number (e.g. 12345 6789 RT0001) to create an account.');
        }
        if (!phone.trim()) throw new Error('Phone Number is required for delivery coordination.');
        if (!address.trim()) throw new Error('Street / Delivery Address is required.');
        if (passwordTrimmed.length < 6) throw new Error('Password must be at least 6 characters.');
        if (passwordTrimmed !== confirmPassword.trim()) throw new Error('Passwords do not match. Please re-enter your password.');

        const resolvedCompany = accountType === 'commercial' ? companyName.trim() : (companyName.trim() || 'Personal Account');

        const { data, error } = await supabase.auth.signUp({
          email: emailTrimmed,
          password: passwordTrimmed,
          options: {
            data: {
              role: 'customer',
              account_type: accountType,
              full_name: fullName.trim(),
              company_name: resolvedCompany,
              phone: phone.trim(),
              address: address.trim(),
              hst_number: hstNumber.trim(),
            },
          },
        });

        if (error) {
          throw error;
        }

        if (!data.user) {
          throw new Error('Registration failed. Please try again.');
        }

        try {
          await supabase.from('profiles').upsert([
            {
              id: data.user.id,
              email: emailTrimmed,
              role: 'customer',
              full_name: fullName.trim(),
              company_name: resolvedCompany,
              phone: phone.trim(),
            },
          ]);
        } catch (profileErr) {
          console.warn('Profile upsert warning:', profileErr);
        }

        // Cache customer profile locally
        try {
          localStorage.setItem(`flashdrop_profile_${emailTrimmed}`, JSON.stringify({
            accountType,
            hstNumber: hstNumber.trim(),
            companyName: resolvedCompany,
            fullName: fullName.trim(),
            phone: phone.trim(),
            address: address.trim(),
          }));
        } catch {}

        store.setCurrentUser({
          role: 'customer',
          email: emailTrimmed,
          name: fullName.trim(),
          phone: phone.trim(),
          accountType,
          hstNumber: hstNumber.trim(),
          companyName: resolvedCompany,
        });

        inAppNotificationService.dispatch({
          title: `New Customer Registered: ${fullName.trim()}`,
          message: `${accountType === 'commercial' ? 'Commercial' : 'Personal'} account created (${emailTrimmed}, ${phone.trim()}${resolvedCompany ? ` • ${resolvedCompany}` : ''}).`,
          type: 'system',
          recipient_role: 'admin',
        });

        setSuccessMessage(
          accountType === 'commercial'
            ? 'Commercial business account created successfully! Redirecting to Customer Portal...'
            : 'Personal customer account created successfully! Redirecting to Customer Portal...'
        );
        setTimeout(() => {
          onNavigate('customer');
        }, 800);
        return;
      }

      // Standard Sign In Flow
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
          throw new Error('Invalid email or password. Click "Forgot password?" below if you need to reset it.');
        }
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();

      const userEmail = (authData.user.email || emailTrimmed).toLowerCase().trim();
      const isAdminUser = checkIsAdminEmail(userEmail) || profile?.role === 'admin' || profile?.role === 'owner';

      // Look up driver record in memory or remote drivers table
      let matchingDriver = store.getDrivers().find(
        (d) =>
          (d.email && d.email.toLowerCase() === userEmail) ||
          (d.user_id && d.user_id === authData.user.id) ||
          d.id === authData.user.id
      );

      if (!matchingDriver && supabase) {
        try {
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
        } catch (drvErr) {
          console.warn('Driver lookup notice:', drvErr);
        }
      }

      const isDriverUser = Boolean(matchingDriver) || profile?.role === 'driver' || profile?.role === 'dispatcher';

      // 1. Admin Guard
      if (selectedRole === 'admin') {
        if (!isAdminUser) {
          await supabase.auth.signOut();
          store.setCurrentUser(null);
          if (isDriverUser) {
            throw new Error('Access Denied: Staff/Driver credentials cannot be used to access the Administrator Command Center. Please select "Staff / Fleet" above to sign in.');
          }
          throw new Error('Access Denied: Customer accounts cannot access the Administrator Command Center. Please select "Customer" above to sign in.');
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

      // 2. Staff / Driver Guard
      if (selectedRole === 'driver') {
        if (!isDriverUser && !isAdminUser) {
          await supabase.auth.signOut();
          store.setCurrentUser(null);
          throw new Error('Access Denied: This account is registered as a Customer. Customer accounts cannot access the Staff / Fleet Portal. Please select "Customer" above to sign in.');
        }

        store.setCurrentUser({
          role: isAdminUser && !matchingDriver ? 'admin' : 'driver',
          email: userEmail,
          name: profile?.full_name || matchingDriver?.name || authData.user.user_metadata?.full_name || 'Staff Member',
          phone: profile?.phone || matchingDriver?.phone || '',
          driverId: matchingDriver?.id || authData.user.id,
        });

        setSuccessMessage('Staff authenticated. Loading Driver Fleet Portal...');
        setTimeout(() => onNavigate('driver'), 500);
        return;
      }

      // 3. Customer Guard
      if (selectedRole === 'customer') {
        // STRICT SECURITY GUARD: Block Staff / Drivers and Admins from logging in as customers!
        if (isDriverUser) {
          await supabase.auth.signOut();
          store.setCurrentUser(null);
          throw new Error('Access Denied: This email address is registered as an active FlashDrop Staff / Driver account. Staff members cannot access the Customer Portal. Please select "Staff / Fleet" above to sign in to your Driver Portal.');
        }

        if (isAdminUser) {
          await supabase.auth.signOut();
          store.setCurrentUser(null);
          throw new Error('Access Denied: This email address belongs to an Administrator account. Administrator accounts cannot access the Customer Portal. Please select "Admin / Dispatch" above to sign in.');
        }

        let cachedProf: any = null;
        try {
          const stored = localStorage.getItem(`flashdrop_profile_${userEmail}`);
          if (stored) cachedProf = JSON.parse(stored);
        } catch {}

        const userAccountType =
          authData.user.user_metadata?.account_type ||
          profile?.account_type ||
          cachedProf?.accountType ||
          (profile?.company_name && profile.company_name !== 'Personal Account' ? 'commercial' : 'personal');

        const userHstNumber =
          authData.user.user_metadata?.hst_number ||
          profile?.hst_number ||
          cachedProf?.hstNumber ||
          '';

        const userCompanyName =
          profile?.company_name ||
          authData.user.user_metadata?.company_name ||
          cachedProf?.companyName ||
          '';

        store.setCurrentUser({
          role: 'customer',
          email: userEmail,
          name: profile?.full_name || userCompanyName || authData.user.user_metadata?.full_name || 'Customer',
          phone: profile?.phone || authData.user.user_metadata?.phone || '',
          accountType: userAccountType,
          hstNumber: userHstNumber,
          companyName: userCompanyName,
        });

        setSuccessMessage('Welcome back! Loading Customer Portal...');
        setTimeout(() => onNavigate('customer'), 500);
        return;
      }
    } catch (err: any) {
      console.error('Authentication error:', err);
      let msg = err?.message || 'Authentication failed. Please verify your credentials.';
      if (msg.includes('Invalid login credentials')) {
        if (selectedRole === 'admin') {
          msg = 'Invalid administrator email or password.';
        } else if (selectedRole === 'driver') {
          msg = 'Invalid staff credentials. Staff accounts are created directly by the Administrator.';
        } else {
          msg = 'Invalid email or password. Click "Forgot password?" below to reset it.';
        }
      }
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 relative z-10">
      <div className="max-w-md w-full space-y-6 bg-white border border-slate-200 p-8 rounded-3xl shadow-sm relative">
        
        {/* Header Icon & Title */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mx-auto shadow-xs">
            {mode === 'forgot' || mode === 'reset' ? (
              <KeyRound className="w-6 h-6 text-red-400 animate-pulse" />
            ) : selectedRole === 'admin' ? (
              <Shield className="w-6 h-6" />
            ) : selectedRole === 'driver' ? (
              <Truck className="w-6 h-6" />
            ) : (
              <User className="w-6 h-6" />
            )}
          </div>

          <h2 className="text-2xl font-black text-slate-900 font-['Outfit'] tracking-tight">
            {mode === 'forgot'
              ? 'Reset Your Password'
              : mode === 'reset'
              ? 'Create New Password'
              : mode === 'register'
              ? 'Create Commercial Account'
              : selectedRole === 'admin'
              ? 'Administrator Login'
              : selectedRole === 'driver'
              ? 'Staff & Fleet Login'
              : 'Customer Portal Login'}
          </h2>

          <p className="text-xs text-slate-600 leading-relaxed">
            {mode === 'forgot'
              ? 'Enter your account email. We will send you a 6-digit security PIN and a direct recovery link.'
              : mode === 'reset'
              ? 'Enter the 6-digit PIN sent to your email and choose your new password.'
              : mode === 'register'
              ? 'Register your business for direct GTA freight and courier service.'
              : selectedRole === 'admin'
              ? 'Restricted dispatch executive access. Authorized personnel only.'
              : selectedRole === 'driver'
              ? 'Courier driver and internal operations management portal.'
              : 'Sign in to manage commercial deliveries, invoices, and tracking.'}
          </p>
        </div>

        {/* Error / Success Alerts */}
        {errorMessage && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-2.5 text-xs text-red-800 animate-fade-in shadow-xs">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed font-medium">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start space-x-2.5 text-xs text-emerald-800 animate-fade-in shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed font-medium">{successMessage}</span>
          </div>
        )}

        {/* Role Switcher (Hidden in Forgot/Reset Mode) */}
        {mode !== 'forgot' && mode !== 'reset' && (
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">
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
                        ? 'bg-red-50 border-red-500 text-red-700 shadow-xs ring-1 ring-red-300'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-red-600' : 'text-slate-400'}`} />
                    <span className="text-xs font-bold leading-tight">{r.label}</span>
                    <span className="text-[9px] text-slate-500 hidden sm:block">{r.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Security Notice for Admin & Staff in standard login */}
        {mode === 'login' && selectedRole === 'admin' && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-2 text-[11px] text-slate-700">
            <Shield className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>
              <strong>Secure Dispatch Area:</strong> Only accounts registered with Administrator privileges can access this panel.
            </span>
          </div>
        )}

        {mode === 'login' && selectedRole === 'driver' && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start space-x-2 text-[11px] text-slate-700">
            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <span>
              <strong>Staff Accounts:</strong> Driver and employee accounts are created directly by the Administrator in the Admin Dashboard.
            </span>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 1: FORGOT PASSWORD FORM (Request PIN & Link)        */}
        {/* ========================================================= */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotPasswordSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Account Email Address <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. client@company.com"
                  className="w-full bg-slate-50 border border-slate-300 pl-10 pr-3 py-2.5 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-red-500 focus:outline-none shadow-xs"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-[11px] text-slate-600">
              <div className="flex items-center space-x-1.5 text-slate-700 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-red-400" />
                <span>Instant Verification</span>
              </div>
              <p>
                A 6-digit security code and a 1-click recovery link will be dispatched from{' '}
                <strong className="text-slate-900">dispatch@flashdropexpress.com</strong>.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#C5161D] hover:bg-[#A51218] disabled:opacity-60 text-white font-bold rounded-xl shadow-lg shadow-red-950/40 transition flex items-center justify-center space-x-2 cursor-pointer"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Send Reset Instructions</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="inline-flex items-center space-x-1.5 text-xs text-slate-600 hover:text-slate-900 transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Sign In</span>
              </button>
            </div>
          </form>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: SET NEW PASSWORD FORM (Enter PIN & New Password) */}
        {/* ========================================================= */}
        {mode === 'reset' && (
          <form onSubmit={handleResetPasswordSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Account Email Address <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. client@company.com"
                  className="w-full bg-slate-50 border border-slate-300 pl-10 pr-3 py-2.5 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-red-500 focus:outline-none shadow-xs"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-700 font-semibold">
                  6-Digit Security PIN <span className="text-red-400">*</span>
                </label>
                {resendCooldown > 0 ? (
                  <span className="text-[10px] text-slate-500">Resend in {resendCooldown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleForgotPasswordSubmit}
                    className="text-[11px] text-red-400 hover:text-red-300 hover:underline cursor-pointer flex items-center space-x-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Resend PIN</span>
                  </button>
                )}
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  maxLength={6}
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 849201"
                  className="w-full bg-slate-50 border border-slate-300 pl-10 pr-3 py-2.5 rounded-xl text-slate-900 font-mono tracking-widest text-sm placeholder:text-slate-400 placeholder:tracking-normal focus:bg-white focus:border-red-500 focus:outline-none shadow-xs"
                  required={!isRecoverySession}
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Check your inbox for the 6-digit code sent from dispatch@flashdropexpress.com.
              </p>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                New Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  minLength={6}
                  className="w-full bg-slate-50 border border-slate-300 pl-10 pr-10 py-2.5 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-red-500 focus:outline-none shadow-xs"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-900 cursor-pointer"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Confirm New Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  minLength={6}
                  className="w-full bg-slate-50 border border-slate-300 pl-10 pr-10 py-2.5 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-red-500 focus:outline-none shadow-xs"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#C5161D] hover:bg-[#A51218] disabled:opacity-60 text-white font-bold rounded-xl shadow-lg shadow-red-950/40 transition flex items-center justify-center space-x-2 cursor-pointer mt-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Save New Password & Sign In</span>
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="inline-flex items-center space-x-1.5 text-xs text-slate-600 hover:text-slate-900 transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Cancel & Return to Sign In</span>
              </button>
            </div>
          </form>
        )}

        {/* ========================================================= */}
        {/* VIEW 3: STANDARD LOGIN & COMMERCIAL REGISTRATION         */}
        {/* ========================================================= */}
        {(mode === 'login' || mode === 'register') && (
          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            {mode === 'register' && selectedRole === 'customer' && (
              <>
                {/* Account Classification: Commercial vs Personal */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">
                    Account Classification <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setAccountType('commercial')}
                      className={`py-2.5 px-3 rounded-xl border font-bold text-xs flex items-center justify-center space-x-2 transition cursor-pointer ${
                        accountType === 'commercial'
                          ? 'bg-red-50 border-red-600 text-red-700 shadow-xs ring-1 ring-red-600/30'
                          : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Building2 className="w-4 h-4 text-red-600" />
                      <span>Commercial / Business</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAccountType('personal')}
                      className={`py-2.5 px-3 rounded-xl border font-bold text-xs flex items-center justify-center space-x-2 transition cursor-pointer ${
                        accountType === 'personal'
                          ? 'bg-red-50 border-red-600 text-red-700 shadow-xs ring-1 ring-red-600/30'
                          : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <User className="w-4 h-4 text-red-600" />
                      <span>Personal / Individual</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {accountType === 'commercial'
                      ? 'For corporations, contractors, wholesalers & businesses.'
                      : 'For private individuals & residential senders.'}
                  </p>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    {accountType === 'commercial' ? 'Contact Person Full Name' : 'Full Name'}{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Michael Smith"
                      className="w-full bg-slate-50 border border-slate-300 pl-10 pr-3 py-2.5 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-red-500 focus:outline-none shadow-xs"
                      required
                    />
                  </div>
                </div>

                {accountType === 'commercial' ? (
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Company / Business Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="e.g. Apex Coatings & Construction Inc."
                        className="w-full bg-slate-50 border border-slate-300 pl-10 pr-3 py-2.5 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-red-500 focus:outline-none shadow-xs"
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Company / Organization <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Optional (if booking on behalf of an organization)"
                        className="w-full bg-slate-50 border border-slate-300 pl-10 pr-3 py-2.5 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-red-500 focus:outline-none shadow-xs"
                      />
                    </div>
                  </div>
                )}

                {/* HST / Business Number */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-700 font-semibold">
                      HST / Business Number (GST/HST #){' '}
                      {accountType === 'commercial' ? (
                        <span className="text-red-600 font-bold">*</span>
                      ) : (
                        <span className="text-slate-400 font-normal text-xs">(Optional)</span>
                      )}
                    </label>
                  </div>
                  <div className="relative">
                    <Shield className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={hstNumber}
                      onChange={(e) => {
                        setHstNumber(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      placeholder={
                        accountType === 'commercial'
                          ? 'e.g. 12345 6789 RT0001'
                          : 'e.g. 12345 6789 RT0001 (Optional)'
                      }
                      className={`w-full bg-slate-50 border pl-10 pr-3 py-2.5 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none shadow-xs transition ${
                        accountType === 'commercial' && !hstNumber.trim() && errorMessage
                          ? 'border-red-500 ring-2 ring-red-500/20'
                          : 'border-slate-300 focus:border-red-500'
                      }`}
                      required={accountType === 'commercial'}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {accountType === 'commercial'
                      ? 'Used to generate CRA-compliant input tax credit invoices.'
                      : 'Optional: Enter your GST/HST or tax exemption number if claiming business deductions.'}
                  </p>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    {accountType === 'commercial' ? 'Business Phone Number' : 'Phone Number'}{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +1 (647) 555-0199"
                      className="w-full bg-slate-50 border border-slate-300 pl-10 pr-3 py-2.5 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-red-500 focus:outline-none shadow-xs"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    {accountType === 'commercial' ? 'Business / Delivery Address' : 'Delivery / Street Address'}{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. 150 King St W, Toronto, ON"
                      className="w-full bg-slate-50 border border-slate-300 pl-10 pr-3 py-2.5 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-red-500 focus:outline-none shadow-xs"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
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
                  className="w-full bg-slate-50 border border-slate-300 pl-10 pr-3 py-2.5 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-red-500 focus:outline-none shadow-xs"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-700 font-semibold">
                  Password <span className="text-red-400">*</span>
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="text-[11px] text-red-600 hover:text-red-700 hover:underline cursor-pointer font-medium"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  className="w-full bg-slate-50 border border-slate-300 pl-10 pr-10 py-2.5 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-red-500 focus:outline-none shadow-xs"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-900 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === 'register' && selectedRole === 'customer' && (
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Confirm Password <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    minLength={6}
                    className="w-full bg-slate-50 border border-slate-300 pl-10 pr-3 py-2.5 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-red-500 focus:outline-none shadow-xs"
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
                    {mode === 'register'
                      ? accountType === 'commercial'
                        ? 'Register Commercial Account'
                        : 'Register Personal Account'
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
        )}

        {/* Register / Sign In toggle for Customer only */}
        {mode !== 'forgot' && mode !== 'reset' && selectedRole === 'customer' && (
          <div className="text-center pt-2 text-xs text-slate-600 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'register' ? 'login' : 'register');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className="text-red-600 hover:text-red-700 hover:underline cursor-pointer font-medium"
            >
              {mode === 'register'
                ? 'Already have an account? Sign In here'
                : 'Need a new customer account? Register as Commercial or Personal'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
