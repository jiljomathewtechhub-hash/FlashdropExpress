import React from 'react';
import {
  FileText,
  Clock,
  Truck,
  DollarSign,
  MapPin,
  AlertTriangle,
  HelpCircle,
  Phone,
  Mail,
  Printer,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Scale,
  CloudRain,
  Navigation,
  CreditCard,
  PackageCheck,
} from 'lucide-react';

interface TermsPageProps {
  onNavigate: (tab: string) => void;
}

export const TermsPage: React.FC<TermsPageProps> = ({ onNavigate }) => {
  const serviceTerms = [
    {
      number: 1,
      title: 'Pricing Basis',
      icon: DollarSign,
      content:
        'Rates are based on the vehicle required, shipment size/weight, distance, pickup and delivery requirements, and selected service level.',
      highlight: 'Vehicle class, cargo size/weight, route distance, and service level determine final quotation.',
    },
    {
      number: 2,
      title: 'Pickup Location & Driver Mileage',
      icon: Navigation,
      content:
        'For on-demand, remote or out-of-area requests, mileage may be calculated from the driver’s dispatch location to pickup and from pickup to final delivery, where applicable.',
      highlight: 'Deadhead mileage may apply for out-of-area or urgent dispatch requests.',
    },
    {
      number: 3,
      title: 'Waiting Time',
      icon: Clock,
      content:
        'The first 20 minutes from the scheduled pickup time are included. Waiting beyond 20 minutes is charged at $25/hour.',
      highlight: 'First 20 minutes are 100% FREE. Additional waiting is billed at $25.00/hr ($0.42/min).',
    },
    {
      number: 4,
      title: 'Loading & Unloading',
      icon: PackageCheck,
      content:
        'Standard service includes normal curbside/door-to-door pickup and delivery where reasonably accessible. Additional labour applies to unusually heavy items, excessive quantities, extended handling, or assistance beyond normal service.',
      highlight: 'Standard service is curbside / door-to-door. Extra labour fees apply for stairs, heavy cargo, or extended handling.',
    },
    {
      number: 5,
      title: 'Additional Stops & Route Changes',
      icon: MapPin,
      content:
        'Any additional pickup, delivery, stop or significant route change requested after dispatch may result in an additional charge.',
      highlight: 'Route alterations or mid-transit stops after driver dispatch are billed based on distance and vehicle type.',
    },
    {
      number: 6,
      title: 'Remote / Outside-GTA Deliveries',
      icon: Truck,
      content:
        'Deliveries outside the normal GTA service area may be subject to additional mileage, driver travel time, deadhead mileage and/or remote service charges. Exceptionally long-distance or unusual shipments may be priced separately.',
      highlight: 'Long-haul routes outside the standard GTA envelope may be priced via custom dispatch quotation.',
    },
    {
      number: 7,
      title: 'Failed Delivery / Re-delivery',
      icon: AlertTriangle,
      content:
        'Additional charges may apply for incorrect/incomplete addresses, customer unavailability, refusal, site closure, lack of access, customer-caused delay, or return-to-sender requests.',
      highlight: 'Ensure delivery contact is reachable. Return-to-sender or re-delivery trips incur standard delivery fees.',
    },
    {
      number: 8,
      title: 'Tolls, Parking & Access Fees',
      icon: CreditCard,
      content:
        'Applicable 407 tolls, bridge/tunnel tolls, paid parking, permits and access fees incurred during service are additional and billed at cost.',
      highlight: 'Highway 407 ETR toll fees and paid parking tickets incurred during delivery are billed at exact cost.',
    },
    {
      number: 9,
      title: 'Shipment Weight & Vehicle Requirements',
      icon: Scale,
      content:
        'Customers are responsible for accurate shipment quantity, dimensions and weight. If a larger vehicle is required than originally requested, FLASHDROP EXPRESS may adjust the delivery rate accordingly.',
      highlight: 'Rate adjustment applies if actual cargo exceeds declared payload or requires an upgraded vehicle.',
    },
    {
      number: 10,
      title: 'Oversized / Special Shipments',
      icon: ShieldCheck,
      content:
        'Shipments requiring special equipment, unusual handling, multiple drivers, liftgate service, extended loading/unloading or other special requirements may incur additional charges.',
      highlight: 'Liftgate, pallet jack, or 2-man handling services are quoted separately upon request.',
    },
    {
      number: 11,
      title: 'Service Availability',
      icon: CheckCircle2,
      content:
        'All services are subject to vehicle and driver availability. An order is confirmed only after FLASHDROP EXPRESS confirms the booking.',
      highlight: 'All orders are confirmed upon dispatch review and receipt of official FlashDrop confirmation.',
    },
    {
      number: 12,
      title: 'Weather & Road Conditions',
      icon: CloudRain,
      content:
        'Delivery times are estimates and may be affected by traffic, weather, road closures, construction, accidents or circumstances beyond FLASHDROP EXPRESS’s reasonable control.',
      highlight: 'Safety is our top priority. Severe Ontario weather and highway gridlock may affect arrival windows.',
    },
    {
      number: 13,
      title: 'Payment Terms',
      icon: DollarSign,
      content:
        '100% payment is due upon receipt of invoice, unless otherwise agreed in writing.',
      highlight: 'Guaranteed Pay Later upon delivery terms. Invoices are payable immediately upon receipt.',
    },
  ];

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="py-8 sm:py-12 bg-[#F8FAFC]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Navigation & Header Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <button
            onClick={() => onNavigate('home')}
            className="inline-flex items-center text-xs font-bold text-slate-600 hover:text-red-600 transition cursor-pointer self-start"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Home
          </button>

          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              Print / Save PDF
            </button>
            <button
              onClick={() => onNavigate('order')}
              className="inline-flex items-center px-4 py-1.5 btn-gradient-primary text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer"
            >
              <Truck className="w-3.5 h-3.5 mr-1.5" />
              Book Delivery
            </button>
          </div>
        </div>

        {/* Hero Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center space-x-2 bg-red-50 border border-red-200 text-red-700 px-3.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase">
            <FileText className="w-3.5 h-3.5" />
            <span>Official Operating Terms</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 font-['Outfit'] tracking-tight">
            Terms &amp; Conditions
          </h1>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Please review our service policies, pricing terms, and operational guidelines for all same-day and rush courier bookings across Ontario.
          </p>
        </div>

        {/* Customer-Friendly Service Policy (Top Highlight Banner) */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 sm:p-8 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-3">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span className="text-xs font-black tracking-widest uppercase text-emerald-400">
                Customer-Friendly Service Policy
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white !text-white font-['Outfit']">
              Our Commitment to Transparency &amp; Fair Pricing
            </h2>
            <p className="text-slate-200 text-xs sm:text-sm leading-relaxed">
              FLASHDROP EXPRESS is committed to reliable and transparent delivery services. Standard rates cover normal delivery requirements. Additional charges may apply when a shipment requires additional time, distance, labour, stops, special handling or resources beyond standard service. Customers will be advised of significant additional charges whenever reasonably possible before they are incurred.
            </p>
          </div>
        </div>

        {/* Important Service Terms (Numbered Grid) */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
              <h2 className="text-lg sm:text-xl font-black text-slate-900 font-['Outfit'] tracking-tight uppercase">
                Important Service Terms
              </h2>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              13 Defined Provisions
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {serviceTerms.map((term) => {
              const IconComponent = term.icon;
              return (
                <div
                  key={term.number}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <span className="w-7 h-7 rounded-xl bg-red-50 border border-red-200 text-red-600 font-black text-xs flex items-center justify-center font-mono">
                          {term.number}
                        </span>
                        <h3 className="font-bold text-slate-900 text-sm font-['Outfit']">
                          {term.title}
                        </h3>
                      </div>
                      <div className="p-1.5 rounded-lg bg-slate-50 text-slate-500">
                        <IconComponent className="w-4 h-4 text-slate-600" />
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {term.content}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <div className="bg-slate-50 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-700 flex items-start space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="leading-tight font-medium">
                        {term.highlight}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Company Identity & Registered Contact Footer Box */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="text-center sm:text-left sm:flex sm:items-center sm:justify-between border-b border-slate-100 pb-5">
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight font-['Outfit']">
                FLASHDROP EXPRESS
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Licensed Commercial Freight &amp; Same-Day Courier Services &bull; Ontario, Canada
              </p>
            </div>
            <div className="mt-3 sm:mt-0 inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              Active Operating Authority
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-700">
            <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-200/60">
              <MapPin className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-slate-900 mb-0.5">Operating Address</span>
                <span>Unit 208, 495 Highway 8, Stoney Creek, ON L8G 5E1</span>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-200/60">
              <Phone className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-slate-900 mb-0.5">Direct Dispatch Desk</span>
                <a href="tel:+16478049775" className="hover:text-red-600 transition font-semibold">
                  +1 (647) 804-9775
                </a>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-200/60">
              <Mail className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-slate-900 mb-0.5">Customer Support</span>
                <a href="mailto:support@flashdropexpress.com" className="hover:text-red-600 transition font-semibold">
                  support@flashdropexpress.com
                </a>
                <span className="block text-[11px] text-slate-500 mt-0.5">www.flashdropexpress.com</span>
              </div>
            </div>
          </div>

          <div className="text-center pt-2">
            <p className="text-[11px] text-slate-500">
              By requesting a delivery, confirming a quotation, or creating an account with FLASHDROP EXPRESS, you acknowledge and agree to be bound by these Important Service Terms and Customer-Friendly Service Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
