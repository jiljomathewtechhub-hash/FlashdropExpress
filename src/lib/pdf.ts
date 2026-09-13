import { jsPDF } from 'jspdf';
import { Order, BusinessSettings } from '../types/order';
import { DEFAULT_BUSINESS_SETTINGS } from './pricing';

/**
 * Generates and downloads a branded PDF confirmation / commercial invoice
 * for a FlashDrop Express delivery order.
 */
export function generateOrderPdf(
  order: Order,
  settings: BusinessSettings = DEFAULT_BUSINESS_SETTINGS
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const red = [197, 22, 29]; // #C5161D Deep Crimson
  const darkNavy = [11, 17, 24]; // #0B1118
  const textDark = [30, 41, 59];
  const mutedText = [100, 116, 139];
  const lightBg = [248, 250, 252];

  // Header Background Bar
  doc.setFillColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.rect(0, 0, 210, 42, 'F');

  // Red accent line
  doc.setFillColor(red[0], red[1], red[2]);
  doc.rect(0, 42, 210, 2, 'F');

  // Logo Monogram
  doc.setFillColor(red[0], red[1], red[2]);
  doc.roundedRect(15, 10, 16, 16, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('FD', 19, 21);

  // Company Name & Tagline
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text('FLASHDROP EXPRESS', 36, 18);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(220, 220, 220);
  doc.text('FAST. RELIABLE. DELIVERED. — TORONTO & GTA COMMERCIAL COURIER', 36, 24);
  doc.text(`Phone: ${settings.phone}  |  Email: ${settings.email}`, 36, 29.5);
  doc.text(`HQ: ${settings.address || 'Suite 108, 3064 Jaguar Valley Dr, Mississauga, ON L5A 2J3'}`, 36, 35);

  // Document Title & Order Number Badge (Top Right)
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('DELIVERY INVOICE', 195, 18, { align: 'right' });

  doc.setFillColor(red[0], red[1], red[2]);
  doc.roundedRect(140, 24, 55, 10, 2, 2, 'F');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(order.order_number, 167, 30.5, { align: 'center' });

  // Metadata Panel
  let y = 54;
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.roundedRect(15, y, 180, 22, 2, 2, 'F');

  doc.setFontSize(8);
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text('ORDER DATE', 22, y + 7);
  doc.text('PAYMENT TERMS', 75, y + 7);
  doc.text('ORDER STATUS', 125, y + 7);
  doc.text('DISPATCH AREA', 165, y + 7);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(new Date(order.created_at).toLocaleDateString('en-CA'), 22, y + 15);
  doc.text(order.payment_status === 'pay_later' ? 'Pay Later (Due on Delivery)' : 'Paid', 75, y + 15);
  doc.text(order.order_status.toUpperCase().replace('_', ' '), 125, y + 15);
  doc.text(order.service_area || 'GTA', 165, y + 15);

  // Customer & Delivery Address Box
  y = 84;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(15, y, 86, 42, 2, 2, 'S');
  doc.roundedRect(109, y, 86, 42, 2, 2, 'S');

  // Customer Details Box
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(red[0], red[1], red[2]);
  doc.text('CUSTOMER / BILL TO', 20, y + 8);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(order.customer_name, 20, y + 16);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  if (order.company_name) {
    doc.text(order.company_name, 20, y + 22);
  }
  doc.text(`Phone: ${order.customer_phone}`, 20, y + (order.company_name ? 28 : 23));
  doc.text(`Email: ${order.customer_email}`, 20, y + (order.company_name ? 34 : 29));

  // Pickup & Dropoff Box
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(red[0], red[1], red[2]);
  doc.text('ROUTING & SCHEDULE', 114, y + 8);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('PICKUP:', 114, y + 15);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  const pickupLines = doc.splitTextToSize(order.pickup_address, 65);
  doc.text(pickupLines, 130, y + 15);

  const deliveryY = y + 15 + Math.max(pickupLines.length * 4, 8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('DROPOFF:', 114, deliveryY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  const dropLines = doc.splitTextToSize(order.delivery_address, 65);
  doc.text(dropLines, 130, deliveryY);

  // Line Item Table
  y = 135;
  doc.setFillColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.rect(15, y, 180, 8, 'F');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('DESCRIPTION / LOGISTICS SPECIFICATION', 20, y + 5.5);
  doc.text('SPECS / UNITS', 120, y + 5.5);
  doc.text('AMOUNT (CAD)', 190, y + 5.5, { align: 'right' });

  // Rows
  y += 8;
  const addRow = (label: string, specs: string, amount: number, isSub = false) => {
    doc.setFillColor(isSub ? 255 : 250, isSub ? 255 : 250, isSub ? 255 : 250);
    doc.rect(15, y, 180, 7, 'F');
    doc.setDrawColor(235, 238, 242);
    doc.line(15, y + 7, 195, y + 7);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', isSub ? 'normal' : 'bold');
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(label, 20, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
    doc.text(specs, 120, y + 5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(`$${amount.toFixed(2)}`, 190, y + 5, { align: 'right' });
    y += 7;
  };

  addRow(
    `Transport Base Rate (${order.vehicle_name})`,
    `${order.distance_km} km / ${order.weight_lbs} lbs`,
    order.base_price
  );

  if (order.excess_km_charge > 0) {
    addRow('Excess Distance (> 40km)', `Beyond 40km threshold`, order.excess_km_charge, true);
  }

  if (order.delivery_type_charge && order.delivery_type_charge > 0) {
    const typeLabel = order.delivery_time_option === 'urgent' || order.delivery_time_option === 'asap' || order.delivery_time_option === '1-2h'
      ? '3) Urgent / ASAP (1.50x)'
      : '2) On Demand / Direct (1.25x)';
    addRow('Delivery Type Premium', typeLabel, order.delivery_type_charge, true);
  }

  if (order.after_hours_charge > 0) {
    addRow('After-Hours Service Surcharge', '1.5x Premium Rate', order.after_hours_charge, true);
  }

  if (order.waiting_charge > 0) {
    addRow('Waiting Time', 'Extra handling / wait', order.waiting_charge, true);
  }

  if (order.labor_charge > 0) {
    addRow('Additional Labor Service', 'Loading / Assistance', order.labor_charge, true);
  }

  // Summary Totals
  y += 4;
  const rightX = 145;
  const valX = 190;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text('Subtotal:', rightX, y);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(`$${order.subtotal.toFixed(2)} CAD`, valX, y, { align: 'right' });

  if (order.tax_amount > 0) {
    y += 6;
    doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
    doc.text(`HST (13%):`, rightX, y);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(`$${order.tax_amount.toFixed(2)} CAD`, valX, y, { align: 'right' });
  }

  y += 8;
  doc.setFillColor(red[0], red[1], red[2]);
  doc.roundedRect(rightX - 5, y - 5, 55, 12, 1, 1, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('TOTAL DUE:', rightX, y + 3);
  doc.text(`$${order.total_price.toFixed(2)}`, valX, y + 3, { align: 'right' });

  // Notes & Instructions
  if (order.custom_instructions) {
    y += 18;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(red[0], red[1], red[2]);
    doc.text('SPECIAL INSTRUCTIONS:', 15, y);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    const inst = doc.splitTextToSize(order.custom_instructions, 180);
    doc.text(inst, 15, y + 5);
  }

  // Terms & Conditions Footer
  y = 250;
  doc.setDrawColor(226, 232, 240);
  doc.line(15, y, 195, y);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('TERMS & CONDITIONS', 15, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text(
    '• 100% payment is due upon delivery or invoice receipt.\n• Rates based on standard delivery requirements. Additional waiting time charged after 20 mins.\n• 407 ETR toll charges or applicable parking/access fees are billed as incurred.\n• FlashDrop Express guarantees fast, secure, and professional commercial delivery throughout Ontario.',
    15,
    y + 9
  );

  // Footer Branding
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(red[0], red[1], red[2]);
  doc.text('FlashDrop Express — www.flashdropexpress.com', 105, 285, { align: 'center' });

  // Save the PDF
  doc.save(`FlashDrop_Invoice_${order.order_number}.pdf`);
}
