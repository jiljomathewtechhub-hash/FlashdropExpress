import React, { useState } from 'react';
import { ChevronDown, PhoneCall, ArrowRight, Calculator } from 'lucide-react';

interface FAQProps {
  onNavigate: (tab: string, param?: any) => void;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    id: 'pay-later',
    question: 'How does the "Pay Later" policy work? Do I need to pay upfront?',
    answer:
      'Zero upfront payment or credit card is required to book a delivery. Commercial clients and contractors can settle payment after successful delivery via corporate invoicing, credit/debit card, or e-Transfer, backed by our digital Proof of Delivery.',
  },
  {
    id: 'rush-speed',
    question: 'How fast is Rush Courier delivery across Toronto & GTA?',
    answer:
      'For urgent dispatches, our automated dispatch assigns the closest available vehicle within minutes. Driver pickup is typically completed within 15–30 minutes, followed by non-stop direct transport straight to your destination in 1–2 hours.',
  },
  {
    id: 'paint-pails',
    question: 'Can FlashDrop safely transport paint pails and contractor supplies?',
    answer:
      'Yes. Our fleet is equipped with heavy-duty non-slip cargo flooring and secure strapping systems specifically configured to transport commercial paint containers, drywall compound, tools, plumbing hardware, and architectural materials without spillage or damage.',
  },
  {
    id: 'service-areas',
    question: 'Which areas across Ontario do you service?',
    answer:
      'We provide daily point-to-point courier service across the entire Greater Toronto Area (Toronto, Mississauga, Brampton, Vaughan, Markham, Richmond Hill, Oakville, Burlington, and Oshawa), with dedicated regional routes to Hamilton, Kitchener-Waterloo, Barrie, and Niagara.',
  },
  {
    id: 'tracking-pod',
    question: 'How does live tracking and Proof of Delivery (POD) work?',
    answer:
      'Every shipment includes a live radar tracking link with real-time GPS transit updates. Once delivered, the recipient\'s digital signature and timestamped photo verification are recorded and available on your invoice receipt.',
  },
  {
    id: 'after-hours',
    question: 'Do you offer weekend or after-hours emergency delivery?',
    answer:
      'Yes. FlashDrop operations run 7 days a week, including early mornings, evenings, and weekends. Emergency runs can be booked online 24/7 or by contacting our dispatch desk directly.',
  },
];

export const FAQ: React.FC<FAQProps> = ({ onNavigate }) => {
  const [openId, setOpenId] = useState<string | null>('pay-later');

  const toggleItem = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section id="faq" className="py-20 lg:py-24 bg-[#080B11]/90 relative overflow-hidden border-t border-slate-800/60">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Minimalist Section Header */}
        <div className="text-center mb-12 space-y-2.5">
          <span className="badge-soft-rose px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-block">
            FAQ
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white font-['Outfit'] tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-slate-400 max-w-lg mx-auto font-normal leading-relaxed">
            Clear answers regarding our GTA rush courier, flexible payment terms, and dedicated cargo handling.
          </p>
        </div>

        {/* Minimalist Accordion List */}
        <div className="divide-y divide-slate-800/80 border-y border-slate-800/80">
          {FAQ_ITEMS.map((item) => {
            const isOpen = openId === item.id;
            return (
              <div key={item.id} className="py-4 transition-colors">
                <button
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between text-left py-1 group focus:outline-none cursor-pointer"
                >
                  <span className="text-sm sm:text-base font-semibold text-white group-hover:text-red-200 transition-colors font-['Outfit'] pr-4">
                    {item.question}
                  </span>
                  <div
                    className={`p-1.5 rounded-lg border transition-transform duration-300 shrink-0 ${
                      isOpen
                        ? 'rotate-180 bg-red-500/15 border-red-400/30 text-red-200'
                        : 'bg-white/[0.03] border-white/10 text-slate-400 group-hover:text-white'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="pt-2 pb-2 pr-6 animate-fade-in">
                    <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Clean, Understated Bottom Contact Bar */}
        <div className="mt-10 pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 text-center sm:text-left">
          <div>
            <span>Have a custom delivery requirement? </span>
            <a
              href="tel:+16478049775"
              className="text-white hover:text-red-300 font-semibold underline underline-offset-4 transition-colors"
            >
              Call dispatch at +1 (647) 804-9775
            </a>
          </div>

          <div className="flex items-center space-x-2.5 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('pricing')}
              className="px-3.5 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white font-medium text-xs transition-colors cursor-pointer flex items-center space-x-1.5"
            >
              <Calculator className="w-3.5 h-3.5 text-amber-300" />
              <span>Rate Calculator</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('order')}
              className="px-3.5 py-1.5 rounded-lg btn-gradient-primary text-white font-semibold text-xs shadow-sm hover:shadow-red-900/40 transition-colors cursor-pointer flex items-center space-x-1.5"
            >
              <span>Book Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};