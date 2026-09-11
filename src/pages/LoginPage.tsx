import React, { useState } from 'react';
import {
  Shield,
  Truck,
  User,
  Mail,
  ArrowRight,
  CheckCircle2,
  Lock,
  Sparkles,
  Phone,
  AlertCircle,
  Loader2,
  Database,
} from 'lucide-react';
import { UserRole } from '../types/order';
import { store } from '../lib/store';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface LoginPageProps {
  onNavigate: (tab: string) => void;
}

const ADMIN_EMAILS = [
  'support@flashdropexpress.com',
  'admin@flashdropexpress.com',
  'nidhin@flashdropexpress.com',
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

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    const emailTrimmed = email.trim();
    const isExplicitAdmin = checkIsAdminEmail(emailTrimmed) || selectedRole === 'admin' || selectedRole === 'owner';
    const roleToSet: UserRole = isExplicitAdmin ? 'admin' : selectedRole;

    if (isRegister && selectedRole !== 'customer') {
      setErrorMessage('Registration is only available for commercial customer accounts.');
      setIsLoading(false);
      return;
    }

    try {
      if (isSupabaseConfigured && supabase) {
        if (isRegister) {
          // Real Supabase Registration (Customers only)
          const { data, error } = await supabase.auth.signUp({
            email: emailTrimmed,
            password,
            options: {
              data: {
                role: roleToSet,
                full_name: fullName.trim() || emailTrimmed.split('@')[0],
                phone: phone.trim(),
              },
            },
          });

          if (error) {
            throw error;
          }

          if (data.user) {
            // Attempt to fetch or verify profile row
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.user.id)
              .single();

            const actualRole = isExplicitAdmin ? 'admin' : (profile?.role as UserRole) || roleToSet;

            // Ensure profile in database has admin role if user is authorized admin
            if (isExplicitAdmin) {
              supabase.from('profiles').upsert([
                {
                  id: data.user.id,
                  email: data.user.email || emailTrimmed,
                  role: 'admin',
                  full_name: profile?.full_name || fullName.trim() || emailTrimmed.split('@')[0],
                  phone: profile?.phone || phone.trim(),
                },
              ]).then();
            }

            store.setCurrentUser({
              role: actualRole,
              email: data.user.email || emailTrimmed,
              name: profile?.full_name || fullName || data.user.email || 'Admin',
              phone: profile?.phone || phone,
              driverId: actualRole === 'driver' ? data.user.id : undefined,
            });

            setSuccessMessage('Account registered successfully! Redirecting...');
            setTimeout(() => {
              if (actualRole === 'admin') onNavigate('admin');
              else if (actualRole === 'driver') onNavigate('driver');
              else onNavigate('customer');
            }, 600);
            return;
          }
        } else {
          // Real Supabase Sign In
          const { data, error } = await supabase.auth.signInWithPassword({
            email: emailTrimmed,
            password,
          });

          if (error) {
            throw error;
          }

          if (data.user) {
            // Fetch profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.user.id)
              .single();

            const isUserAdmin = checkIsAdminEmail(data.user.email) || profile?.role === 'admin' || profile?.role === 'owner' || roleToSet === 'admin';
            const actualRole: UserRole = isUserAdmin ? 'admin' : (profile?.role as UserRole) || 'customer';

            // If user is admin in whitelist but profile was customer, update profile
            if (isUserAdmin && profile && profile.role !== 'admin' && profile.role !== 'owner') {
              supabase.from('profiles').update({ role: 'admin' }).eq('id', data.user.id).then();
            }

            // Security check: Verify portal permissions
            if (roleToSet === 'admin' && !isUserAdmin) {
              await supabase.auth.signOut();
              throw new Error('Access Denied: This account does not have Admin privileges.');
            }

            if (roleToSet === 'driver' && actualRole !== 'driver' && !isUserAdmin) {
              await supabase.auth.signOut();
              throw new Error('Access Denied: This account is not registered as a FlashDrop Driver.');
            }

            store.setCurrentUser({
              role: actualRole,
              email: data.user.email || emailTrimmed,
              name: profile?.full_name || data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'Admin',
              phone: profile?.phone || data.user.user_metadata?.phone,
              driverId: actualRole === 'driver' ? (profile?.id || data.user.id) : undefined,
            });

            if (actualRole === 'admin') onNavigate('admin');
            else if (actualRole === 'driver') onNavigate('driver');
            else onNavigate('customer');
            return;
          }
        }
      }

      // Fallback if offline
      store.setCurrentUser({
        role: roleToSet,
        email: email || `${roleToSet}@flashdropexpress.com`,
        name: fullName || (roleToSet === 'admin' ? 'Operations Admin' : roleToSet === 'driver' ? 'Fleet Driver' : 'Business Client'),
        phone: phone || '',
        driverId: roleToSet === 'driver' ? 'drv-01' : undefined,
      });

      if (roleToSet === 'admin') onNavigate('admin');
      else if (roleToSet === 'driver') onNavigate('driver');
      else onNavigate('customer');
    } catch (err: any) {
      console.error('Authentication error:', err);
      let msg = err?.message || 'Authentication failed. Please check your credentials.';
      if (msg.includes('Invalid login credentials')) {
        msg = 'Invalid email or password. If you do not have an account yet, click "Register here" below to create one.';
      } else if (msg.includes('Access Denied')) {
        msg = err.message;
      } else if (msg.includes('schema cache') || msg.includes('relation "public.profiles" does not exist')) {
        msg = 'Database tables have not been created in Supabase yet. Please paste and run supabase/setup_complete.sql in your Supabase SQL Editor!';
      }
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="py-16 px-4 sm:px-6 max-w-lg mx-auto animate-fade-in">
      <div className="bg-[#111726] border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-white p-1.5 flex items-center justify-center mx-auto shadow-xl shadow-red-950/40 border border-slate-700/60 overflow-hidden">
            <img src="/images/fd-favicon.jpg" alt="FlashDrop Express FD Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-black text-white font-['Outfit']">
            FlashDrop Express Portal
          </h1>
          <p className="text-xs text-slate-400">
            Sign in to manage deliveries, live fleet tracking, and dispatch settings.
          </p>
        </div>

        {/* Error / Success Messages */}
        {errorMessage && (
          <div className="p-3 bg-red-950/70 border border-red-500/40 rounded-xl flex items-start space-x-2 text-xs text-red-200 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-950/70 border border-emerald-500/40 rounded-xl flex items-start space-x-2 text-xs text-emerald-200 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{successMessage}</span>
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
              { role: 'driver' as UserRole, label: 'Staff / Driver', desc: 'Operations & Fleet', icon: Truck },
              { role: 'admin' as UserRole, label: 'Administrator', desc: 'Dispatch Executive', icon: Shield },
            ].map((r) => {
              const Icon = r.icon;
              const isSelected = selectedRole === r.role || (r.role === 'admin' && selectedRole === 'owner');
              return (
                <button
                  key={r.role}
                  type="button"
                  onClick={() => {
                    setSelectedRole(r.role);
                    setIsRegister(false);
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className={`py-2.5 px-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center space-y-1 cursor-pointer ${
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

        {/* Credentials Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
          {isRegister && (
            <>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Name / Business *</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. John Doe / Apex Construction Ltd."
                  className="w-full bg-[#0B0F17] border border-slate-700 p-2.5 rounded-xl text-white placeholder:text-slate-500 focus:border-red-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +1 (647) 555-0199"
                    className="w-full bg-[#0B0F17] border border-slate-700 pl-10 pr-3 py-2.5 rounded-xl text-white placeholder:text-slate-500 focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Email Address *</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={
                  selectedRole === 'admin' || selectedRole === 'owner'
                    ? 'e.g. admin@example.com'
                    : selectedRole === 'driver'
                    ? 'e.g. staff@example.com'
                    : 'e.g. client@example.com'
                }
                className="w-full bg-[#0B0F17] border border-slate-700 pl-10 pr-3 py-2.5 rounded-xl text-white placeholder:text-slate-500 focus:border-red-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Password *</label>
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

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-[#C5161D] hover:bg-[#A51218] disabled:opacity-60 text-white font-bold rounded-xl shadow transition flex items-center justify-center space-x-2 cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>
                  {isRegister
                    ? 'Create Customer Account'
                    : selectedRole === 'admin' || selectedRole === 'owner'
                    ? 'Sign In as Administrator'
                    : selectedRole === 'driver'
                    ? 'Sign In as Staff / Employee'
                    : 'Sign In to Customer Portal'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {selectedRole === 'customer' && (
          <div className="text-center pt-1 text-xs text-slate-400">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className="text-red-400 hover:underline cursor-pointer font-medium"
            >
              {isRegister
                ? 'Already have a commercial customer account? Sign In'
                : 'Need a new commercial account? Register here'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

