import React, { useState } from 'react';
import {
  Users,
  Linkedin,
  Mail,
  Shield,
  Briefcase,
  TrendingUp,
  Award,
  Sparkles,
  ArrowRight,
  Truck,
  CheckCircle2,
  Clock,
  Compass,
  Building2,
  Phone,
  FileCheck,
} from 'lucide-react';

interface TeamPageProps {
  onNavigate: (tab: string) => void;
}

interface TeamMember {
  name: string;
  role: string;
  tier: 'executive' | 'director' | 'head';
  department: string;
  image: string;
  fallbackInitials: string;
  bio: string;
  linkedin?: string;
  email: string;
  highlights?: string[];
}

export const TeamPage: React.FC<TeamPageProps> = ({ onNavigate }) => {
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const handleCopyEmail = (email: string, e: React.MouseEvent) => {
    e.preventDefault();
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2500);
  };

  const executiveLeader: TeamMember = {
    name: 'Shyju Govind',
    role: 'Founder & Chief Executive Officer (CEO)',
    tier: 'executive',
    department: 'Executive Leadership',
    image: '/images/team/team-1.jpg',
    fallbackInitials: 'SG',
    bio: 'Driving strategic vision, corporate expansion, and operational excellence to position FlashDrop Express as a leader in modern logistics.',
    linkedin: 'https://www.linkedin.com',
    email: 'support@flashdropexpress.com',
    highlights: [
      'Strategic Corporate Vision & Fleet Expansion',
      'Over a Decade of Freight Logistics Leadership',
      'Pioneering Point-to-Point Non-Stop Courier Architecture',
    ],
  };

  const directors: TeamMember[] = [
    {
      name: 'Nidhin Sasidharan',
      role: 'Director of Operations',
      tier: 'director',
      department: 'Fleet & Dispatch Logistics',
      image: '/images/team/team-2.jpg',
      fallbackInitials: 'NS',
      bio: 'Spearheading hub management, delivery dispatch systems, and last-mile route efficiency across the entire fleet network.',
      linkedin: 'https://www.linkedin.com',
      email: 'support@flashdropexpress.com',
      highlights: [
        'Hub Management & Fleet Operations',
        'Rush 1–2h Dispatch Optimization',
        'Real-time Chain-of-Custody Governance',
      ],
    },
    {
      name: 'Ajit Yohannan',
      role: 'Director of Business Development',
      tier: 'director',
      department: 'Client Acquisitions & Growth',
      image: '/images/team/team-3.jpg',
      fallbackInitials: 'AY',
      bio: 'Leading corporate partnerships, enterprise client acquisitions, and strategic market expansion.',
      linkedin: 'https://www.linkedin.com',
      email: 'support@flashdropexpress.com',
      highlights: [
        'Commercial Accounts & Trade Partnerships',
        'Pay Later Corporate Term Structuring',
        'Ontario-Wide Enterprise Expansion',
      ],
    },
    {
      name: 'Masharkhan',
      role: 'Director of Administration',
      tier: 'director',
      department: 'Corporate Governance & People',
      image: '/images/team/team-4.jpg',
      fallbackInitials: 'MK',
      bio: 'Managing internal workflows, organizational compliance, human resources, and day-to-day administrative governance.',
      linkedin: 'https://www.linkedin.com',
      email: 'support@flashdropexpress.com',
      highlights: [
        'Provincial Regulatory & MTO Compliance',
        'Carrier Safety & HR Development',
        'Financial Auditing & Workflow Optimization',
      ],
    },
  ];

  const departmentHead: TeamMember = {
    name: 'Jobbin Samuel',
    role: 'Head of Marketing',
    tier: 'head',
    department: 'Brand & Digital Growth',
    image: '/images/team/team-5.jpg',
    fallbackInitials: 'JS',
    bio: 'Driving brand awareness, digital acquisition, customer engagement, and performance marketing strategies.',
    linkedin: 'https://www.linkedin.com',
    email: 'support@flashdropexpress.com',
    highlights: [
      'Multi-Channel Digital Acquisition',
      'Client Retention & Portal Engagement',
      'Brand Identity & Commercial Positioning',
    ],
  };

  const corePillars = [
    {
      icon: Clock,
      title: 'Precision Dispatch Execution',
      desc: 'Our leaders build systems with zero depot detours and direct point-to-point routes, ensuring 1–2 hour rush deliveries across the GTA.',
    },
    {
      icon: Shield,
      title: 'Safety, Security & Compliance',
      desc: 'Rigorous chain-of-custody protocols, cargo insurance protection, and full Ministry of Transportation regulatory compliance.',
    },
    {
      icon: TrendingUp,
      title: 'Customer-First Economics',
      desc: 'Transparent pricing with no hidden fuel multipliers, 20 minutes included pickup time, and Pay Later invoice flexibility.',
    },
    {
      icon: Compass,
      title: 'Ontario-Wide Scalability',
      desc: 'From our Mississauga operational command center to Golden Horseshoe hubs, engineering scalable courier infrastructure.',
    },
  ];

  return (
    <div className="py-12 sm:py-16 space-y-20 bg-[#F8FAFC]">
      {/* 1. Hero Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 text-center space-y-6 relative">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center justify-center space-x-2 text-xs font-semibold text-slate-500 mb-2">
          <button
            onClick={() => onNavigate('home')}
            className="hover:text-red-600 transition cursor-pointer"
          >
            Home
          </button>
          <span>/</span>
          <span className="text-red-600 font-bold">Meet the Team</span>
        </div>

        {/* Badge / Eyebrow */}
        <div className="inline-flex items-center space-x-2 bg-red-50 border border-red-200 text-red-700 px-4 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-red-600" />
          <span>OUR LEADERSHIP</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 font-['Outfit'] tracking-tight max-w-4xl mx-auto leading-tight">
          The People Behind <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-red-500 to-[#C5161D]">FlashDrop Express</span>
        </h1>

        {/* Subheadline */}
        <p className="text-slate-600 text-sm sm:text-base lg:text-lg max-w-3xl mx-auto leading-relaxed">
          Meet the dedicated leadership team driving seamless logistics, innovative delivery networks, and speed-first customer service.
        </p>

        {/* Quick Stats Pill */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-600">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">Mississauga Operations Headquarters</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">Serving Toronto, GTA &amp; Southern Ontario</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">Licensed Ontario Commercial Courier</span>
          </div>
        </div>
      </section>

      {/* 2. Tier 1: Executive Leadership (Single Prominent / Centered Card) */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center space-y-2 mb-8">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-red-600 bg-red-50 border border-red-200 px-3 py-1 rounded-full inline-block">
            Executive Leadership
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-['Outfit'] tracking-tight">
            Chief Executive Office
          </h2>
        </div>

        <div className="max-w-3xl mx-auto">
          <TeamMemberCard
            member={executiveLeader}
            prominent={true}
            copiedEmail={copiedEmail}
            onCopyEmail={handleCopyEmail}
          />
        </div>
      </section>

      {/* 3. Tier 2: Directors (3-Column Responsive Grid) */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center space-y-2 mb-10">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-red-600 bg-red-50 border border-red-200 px-3 py-1 rounded-full inline-block">
            Operational &amp; Commercial Leadership
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-['Outfit'] tracking-tight">
            Board of Directors
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
            Heading operations, strategic expansion, and governance across all Southern Ontario service corridors.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {directors.map((director) => (
            <TeamMemberCard
              key={director.name}
              member={director}
              prominent={false}
              copiedEmail={copiedEmail}
              onCopyEmail={handleCopyEmail}
            />
          ))}
        </div>
      </section>

      {/* 4. Tier 3: Department Head (Centered Card) */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center space-y-2 mb-8">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-red-600 bg-red-50 border border-red-200 px-3 py-1 rounded-full inline-block">
            Growth &amp; Brand Strategy
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-['Outfit'] tracking-tight">
            Department Leadership
          </h2>
        </div>

        <div className="max-w-md mx-auto">
          <TeamMemberCard
            member={departmentHead}
            prominent={false}
            copiedEmail={copiedEmail}
            onCopyEmail={handleCopyEmail}
          />
        </div>
      </section>

      {/* 5. Leadership Pillars & Core Principles */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-12 shadow-sm space-y-8">
          <div className="max-w-2xl mx-auto text-center space-y-3">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              Our Shared Commitment
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 font-['Outfit'] tracking-tight">
              The Principles That Guide Our Fleet
            </h3>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Every day across Toronto and the Golden Horseshoe, our leadership team ensures that FlashDrop Express operates with precision, integrity, and client trust.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {corePillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.title}
                  className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-white hover:border-red-200 transition-all duration-200 shadow-2xs hover:shadow-md space-y-3 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors duration-200 shadow-xs">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 font-['Outfit'] tracking-tight">
                    {pillar.title}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {pillar.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. Call to Action Section (Bottom) */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-r from-red-600 via-red-600 to-rose-700 text-white rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-xl relative overflow-hidden">
          {/* Subtle Ambient Background Flare */}
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-black/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-2xl mx-auto space-y-3 relative z-10">
            <div className="inline-flex items-center space-x-2 bg-white/15 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-red-100 border border-white/20">
              <Briefcase className="w-3.5 h-3.5 text-white" />
              <span>Careers &amp; Opportunities</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white !text-white font-['Outfit'] tracking-tight leading-tight">
              Want to join our growing network?
            </h2>
            <p className="text-red-100 text-xs sm:text-sm leading-relaxed max-w-xl mx-auto">
              Explore careers at FlashDrop Express. We are continuously expanding our driver fleet, operations staff, and corporate dispatch network across Ontario.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 relative z-10">
            <button
              onClick={() => onNavigate('contact')}
              className="px-8 py-3.5 bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs sm:text-sm rounded-xl shadow-lg transition cursor-pointer flex items-center space-x-2 group"
            >
              <Briefcase className="w-4 h-4 text-red-600" />
              <span>Explore Careers at FlashDrop</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => onNavigate('order')}
              className="px-6 py-3.5 bg-red-800/60 hover:bg-red-800 text-white font-bold text-xs sm:text-sm rounded-xl border border-white/20 transition cursor-pointer flex items-center space-x-2"
            >
              <Truck className="w-4 h-4 text-white" />
              <span>Request a Quote</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

interface TeamMemberCardProps {
  member: TeamMember;
  prominent?: boolean;
  copiedEmail: string | null;
  onCopyEmail: (email: string, e: React.MouseEvent) => void;
}

const TeamMemberCard: React.FC<TeamMemberCardProps> = ({
  member,
  prominent = false,
  copiedEmail,
  onCopyEmail,
}) => {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <div
      className={`group bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-red-300 transition-all duration-300 overflow-hidden flex flex-col ${
        prominent ? 'ring-2 ring-red-500/15' : ''
      }`}
    >
      {/* Photo Container */}
      <div
        className={`relative w-full overflow-hidden bg-slate-100 ${
          prominent ? 'aspect-[4/3] sm:aspect-[16/10]' : 'aspect-[4/5]'
        }`}
      >
        {!imgError ? (
          <img
            src={member.image}
            alt={`${member.name} - ${member.role}`}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
            className={`w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105 ${
              imgLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ) : null}

        {/* Graceful Fallback Placeholder if image fails to load or hasn't been dropped in */}
        {(!imgLoaded || imgError) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-slate-200 to-red-50 text-slate-500 p-6 text-center">
            <div className="w-20 h-20 rounded-2xl bg-white border border-slate-300 flex items-center justify-center text-2xl font-black text-red-600 shadow-md font-['Outfit'] mb-3">
              {member.fallbackInitials}
            </div>
            <span className="text-xs font-bold text-slate-700 font-['Outfit']">
              {member.name}
            </span>
            <span className="text-[10px] text-slate-500 mt-1">
              Photo placeholder ({member.image.split('/').pop()})
            </span>
          </div>
        )}

        {/* Top Badges Overlay */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-slate-900/85 text-white backdrop-blur-md shadow-sm">
            {member.department}
          </span>
          {prominent && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-600 text-white shadow-md flex items-center space-x-1">
              <Award className="w-3 h-3 mr-1" />
              <span>Executive</span>
            </span>
          )}
        </div>

        {/* Bottom Gradient Scrim */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-950/60 to-transparent pointer-events-none" />
      </div>

      {/* Card Content Details */}
      <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between space-y-5">
        <div className="space-y-2">
          {/* Member Name */}
          <h3
            className={`font-black text-slate-900 font-['Outfit'] tracking-tight group-hover:text-red-700 transition-colors ${
              prominent ? 'text-2xl sm:text-3xl' : 'text-xl'
            }`}
          >
            {member.name}
          </h3>

          {/* Member Role */}
          <div className="text-xs sm:text-sm font-bold text-red-600 font-['Outfit'] flex items-center space-x-1.5">
            <Shield className="w-3.5 h-3.5 text-red-600 shrink-0" />
            <span>{member.role}</span>
          </div>

          {/* Bio */}
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">
            {member.bio}
          </p>

          {/* Prominent Executive Key Highlights */}
          {member.highlights && member.highlights.length > 0 && (
            <div className="pt-3 border-t border-slate-100 space-y-1.5">
              {member.highlights.map((item, idx) => (
                <div key={idx} className="flex items-center space-x-2 text-xs text-slate-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
                  <span className="leading-tight">{item}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Card Footer: Social & Contact Links */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            {/* LinkedIn Placeholder Button */}
            <a
              href={member.linkedin || 'https://www.linkedin.com'}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Visit ${member.name}'s LinkedIn profile`}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-[#0A66C2] hover:text-white text-slate-600 flex items-center justify-center transition-all duration-200 border border-slate-200 hover:border-[#0A66C2] shadow-2xs cursor-pointer group/link"
              title="LinkedIn Profile"
            >
              <Linkedin className="w-4 h-4 transition-transform group-hover/link:scale-110" />
            </a>

            {/* Email Contact Button */}
            <a
              href={`mailto:${member.email}?subject=Inquiry%20for%20${encodeURIComponent(member.name)}%20-%20FlashDrop%20Express`}
              aria-label={`Send email to ${member.name}`}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-red-600 hover:text-white text-slate-600 flex items-center justify-center transition-all duration-200 border border-slate-200 hover:border-red-600 shadow-2xs cursor-pointer group/email"
              title={`Email ${member.name}`}
            >
              <Mail className="w-4 h-4 transition-transform group-hover/email:scale-110" />
            </a>

            {/* Quick Copy Email Action */}
            <button
              type="button"
              onClick={(e) => onCopyEmail(member.email, e)}
              className="text-[11px] font-bold text-slate-500 hover:text-red-600 transition px-2 py-1 rounded-md hover:bg-slate-100 cursor-pointer"
              title="Copy official email to clipboard"
            >
              {copiedEmail === member.email ? (
                <span className="text-emerald-700 font-bold flex items-center">
                  <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                  Copied!
                </span>
              ) : (
                'Copy Email'
              )}
            </button>
          </div>

          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            FlashDrop Leader
          </span>
        </div>
      </div>
    </div>
  );
};
