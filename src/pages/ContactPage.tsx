import React, { useState } from 'react';
import { Phone, Mail, Clock, MapPin, Send, CheckCircle2, MessageSquare, Building } from 'lucide-react';
import { store } from '../lib/store';
import { inAppNotificationService } from '../lib/inAppNotificationService';
import { TiltCard } from '../components/common/TiltCard';

interface ContactPageProps {
  onNavigate: (tab: string) => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ onNavigate }) => {
  const settings = store.getSettings();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    inAppNotificationService.dispatch({
      title: `Inquiry from ${name.trim() || 'Website Visitor'}`,
      message: `${name.trim()} (${email.trim() || phone.trim()}): "${message.trim().slice(0, 120)}${message.length > 120 ? '...' : ''}"`,
      type: 'system',
      recipient_role: 'admin',
    });

    setSent(true);
    setTimeout(() => {
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
      setSent(false);
    }, 3000);
  };

  return (
    <div className="py-16 px-4 sm:px-6 max-w-6xl mx-auto space-y-12 relative">
      {/* Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-red-600/5 blur-[120px] pointer-events-none rounded-full" />

      {/* Header */}
      <div className="max-w-2xl mx-auto text-center space-y-3 relative z-10">
        <span className="badge-soft-rose px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-block">
          Direct Operations
        </span>
        <h1 className="text-4xl font-black text-slate-900 font-['Outfit'] tracking-tight">
          Contact FlashDrop Express
        </h1>
        <p className="text-slate-600 text-sm">
          Live GTA dispatch coordinator for immediate pickup or commercial account setup.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        {/* Left Column: 3D Contact Cards */}
        <div className="lg:col-span-5 space-y-6">
          <TiltCard maxTilt={6}>
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 font-['Outfit'] border-b border-slate-100 pb-3">
                Commercial Dispatch Desk
              </h2>

              <div className="space-y-4 text-xs">
                {/* Phone */}
                <div className="flex items-start space-x-3.5">
                  <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 flex-shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px] uppercase font-bold">Dispatch Direct Line</span>
                    <a
                      href="tel:+16478049775"
                      className="text-lg font-black text-slate-900 hover:text-red-600 transition font-['Outfit'] tracking-wide"
                    >
                      +1 (647) 804-9775
                    </a>
                    <span className="text-emerald-700 text-[11px] block mt-0.5">● Live Dispatch Active</span>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start space-x-3.5">
                  <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 flex-shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px] uppercase font-bold">Electronic Billing & Support</span>
                    <a
                      href="mailto:support@flashdropexpress.com"
                      className="text-slate-800 hover:text-red-600 transition font-medium text-xs"
                    >
                      support@flashdropexpress.com
                    </a>
                  </div>
                </div>

                {/* Operating Hours */}
                <div className="flex items-start space-x-3.5">
                  <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 flex-shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px] uppercase font-bold">Standard & After-Hours</span>
                    <span className="text-slate-800 font-medium block">
                      {settings.operating_hours_start} – {settings.operating_hours_end} (Mon–Sat)
                    </span>
                    <span className="text-red-700 font-semibold block mt-0.5">
                      24/7 On-Call Emergency Service Available
                    </span>
                  </div>
                </div>

                {/* Registered Business Address */}
                <div className="flex items-start space-x-3.5">
                  <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 flex-shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px] uppercase font-bold">Registered Business Address</span>
                    <a
                      href="https://www.google.com/maps/search/?api=1&query=3064+Jaguar+Valley+Dr+Mississauga+ON+L5A+2J3"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-800 hover:text-red-600 transition font-medium text-xs block leading-relaxed"
                    >
                      Suite 108, 3064 Jaguar Valley Dr<br />
                      Mississauga, ON L5A 2J3, Canada
                    </a>
                    <span className="text-slate-500 text-[11px] block mt-0.5">Commercial Dispatch & Operations Base</span>
                  </div>
                </div>

                {/* Service Region */}
                <div className="flex items-start space-x-3.5">
                  <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 flex-shrink-0">
                    <Building className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px] uppercase font-bold">Courier Operations Hub</span>
                    <span className="text-slate-800 font-medium block">
                      Toronto, Peel (Mississauga / Brampton), York & Greater Toronto Area
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </TiltCard>

          {/* Official Brand Identity Card */}
          <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs flex items-center justify-center space-x-4">
            <img
              src="/images/flashdrop-logo.jpg"
              alt="FlashDrop Express"
              className="h-14 w-auto object-contain"
            />
            <div className="text-left border-l border-slate-300 pl-4">
              <div className="text-xs font-black text-slate-900 uppercase tracking-wide">
                FlashDrop Express Inc.
              </div>
              <div className="text-[11px] text-slate-500">
                Ontario Commercial Freight Carrier
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Suite 108, 3064 Jaguar Valley Dr, Mississauga, ON L5A 2J3
              </div>
              <div className="text-[10px] font-medium text-slate-600 mt-0.5">
                CRA GST/HST Reg: <span className="font-mono font-semibold text-slate-800">78750 1444 RT0001</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Inquiry Form */}
        <div className="lg:col-span-7">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 font-['Outfit']">
                  Send Dispatch Message
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Quick response guaranteed for commercial quotes and immediate pickups.
                </p>
              </div>
              <MessageSquare className="w-5 h-5 text-red-400" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Name / Business *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Acme Industrial Supplies Ltd. / John Doe"
                    className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-red-500 focus:outline-none shadow-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +1 (647) 555-0199"
                    className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-red-500 focus:outline-none shadow-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Email Address *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. logistics@company.com"
                  className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-red-500 focus:outline-none shadow-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Freight or Service Requirements *</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="e.g. Need daily pallet transfers between Mississauga and Markham, approx 800 lbs per load..."
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-red-500 focus:outline-none shadow-xs"
                  required
                />
              </div>

              {sent ? (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-center flex items-center justify-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>Message dispatched to support@flashdropexpress.com! We will reach out shortly.</span>
                </div>
              ) : (
                <button
                  type="submit"
                  className="w-full py-3.5 btn-gradient-primary text-white font-bold rounded-xl shadow-lg shadow-red-950/40 transition flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Message</span>
                </button>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

