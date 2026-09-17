import { jsPDF } from 'jspdf';
import { Order, BusinessSettings } from '../types/order';
import { DEFAULT_BUSINESS_SETTINGS } from './pricing';
import { FLASHDROP_LOGO_BASE64, FD_SPEED_LOGO_BASE64 } from './assets/logoBase64';

/**
 * Generates and downloads a branded, high-contrast, commercial PDF invoice
 * for a FlashDrop Express delivery order using the official white daylight theme
 * and the rounded FD speed logo emblem.
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

  // Theme Palette: Clean Executive White / Daylight
  const red = [197, 22, 29]; // #C5161D Deep Crimson
  const textDark = [15, 23, 42]; // #0F172A Slate-900 (High contrast, zero eye strain)
  const textBody = [51, 65, 85]; // #334155 Slate-700
  const mutedText = [100, 116, 139]; // #64748B Slate-500
  const lightBg = [248, 250, 252]; // #F8FAFC
  const cardBorder = [226, 232, 240]; // #E2E8F0
  const tableHeaderBg = [241, 245, 249]; // #F1F5F9

  // Top Red Accent Line (3mm brand stripe)
  doc.setFillColor(red[0], red[1], red[2]);
  doc.rect(0, 0, 210, 3, 'F');

  // --- HEADER SECTION (WHITE THEME WITH ROUNDED FD SPEED LOGO EMBLEM) ---
  // Recreated rounded FD emblem badge (matching website header)
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(cardBorder[0], cardBorder[1], cardBorder[2]);
  doc.setLineWidth(0.4);
  doc.roundedRect(15, 8, 20, 20, 3, 3, 'FD');
  try {
    doc.addImage(FD_SPEED_LOGO_BASE64, 'JPEG', 16, 9, 18, 18);
  } catch (err) {
    console.error('Failed to embed FD speed logo in invoice PDF:', err);
    try {
      doc.addImage(FLASHDROP_LOGO_BASE64, 'JPEG', 15, 8, 20, 20);
    } catch (_) {}
  }

  // Brand Typography beside emblem
  const brandX = 39;
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('FLASHDROP ', brandX, 15.5);
  const fdW = doc.getTextWidth('FLASHDROP ');
  doc.setTextColor(red[0], red[1], red[2]);
  doc.text('EXPRESS', brandX + fdW, 15.5);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text('FAST  •  RELIABLE  •  DELIVERED', brandX, 20);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(red[0], red[1], red[2]);
  doc.text('COMMERCIAL COURIER & EXPEDITED FREIGHT', brandX, 24.5);

  // Company contact details below brand emblem
  const hstRegNo = settings.hst_number || '78750 1444 RT0001';
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textBody[0], textBody[1], textBody[2]);
  doc.setFontSize(7.5);
  doc.text('Suite 108, 3064 Jaguar Valley Dr, Mississauga, ON L5A 2J3, Canada', 15, 33);
  doc.text(
    `Dispatch: ${settings.phone || '+1 (647) 804-9775'}  •  Email: ${settings.email || 'support@flashdropexpress.com'}  •  HST/GST Reg: ${hstRegNo}`,
    15,
    37.5
  );

  // Right Side: INVOICE Title & Invoice Number
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('DELIVERY INVOICE', 195, 16, { align: 'right' });

  // Invoice Number Badge
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.setDrawColor(cardBorder[0], cardBorder[1], cardBorder[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(132, 20.5, 63, 8.5, 1.5, 1.5, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(red[0], red[1], red[2]);
  doc.text(`INVOICE #: ${order.order_number}`, 163.5, 26, { align: 'center' });

  // Date & Terms under badge
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text(`Date Issued: ${new Date(order.created_at).toLocaleDateString('en-CA')}`, 195, 33.5, { align: 'right' });
  doc.text(`Terms: ${order.payment_status === 'pay_later' ? 'Due on Delivery' : 'Paid in Full'}`, 195, 38, { align: 'right' });

  // Divider Line below header
  doc.setDrawColor(cardBorder[0], cardBorder[1], cardBorder[2]);
  doc.setLineWidth(0.4);
  doc.line(15, 42, 195, 42);

  // Crimson accent rule on divider
  doc.setDrawColor(red[0], red[1], red[2]);
  doc.setLineWidth(0.8);
  doc.line(15, 42, 45, 42);
  doc.setLineWidth(0.2);

  // --- METADATA BAR ---
  let y = 46;
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.setDrawColor(cardBorder[0], cardBorder[1], cardBorder[2]);
  doc.roundedRect(15, y, 180, 18, 1.5, 1.5, 'FD');

  doc.setFontSize(7.5);
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text('ORDER DATE', 22, y + 6);
  doc.text('PAYMENT STATUS', 72, y + 6);
  doc.text('DELIVERY STATUS', 122, y + 6);
  doc.text('SERVICE REGION', 165, y + 6);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(new Date(order.created_at).toLocaleDateString('en-CA'), 22, y + 13);

  // Payment status badge color
  if (order.payment_status === 'paid') {
    doc.setTextColor(22, 163, 74); // Green
    doc.text('Paid (Full)', 72, y + 13);
  } else {
    doc.setTextColor(180, 83, 9); // Amber-700
    doc.text('Pay Later (Due on Delivery)', 72, y + 13);
  }

  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(order.order_status.toUpperCase().replace('_', ' '), 122, y + 13);
  doc.text(order.service_area || 'GTA Central', 165, y + 13);

  // --- CUSTOMER & ROUTING CARDS ---
  y = 69;
  const cardW = 87;

  // Calculate dynamic card height to prevent overflow
  const pickupLines = doc.splitTextToSize(order.pickup_address, 62);
  const dropLines = doc.splitTextToSize(order.delivery_address, 62);
  const routingContentH = 15 + pickupLines.length * 4.2 + 6 + dropLines.length * 4.2 + 4;
  const custContentH = 22 + (order.company_name ? 5 : 0) + 14 + 6;
  const cardH = Math.max(48, Math.max(routingContentH, custContentH));

  // Customer Card
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(cardBorder[0], cardBorder[1], cardBorder[2]);
  doc.roundedRect(15, y, cardW, cardH, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(red[0], red[1], red[2]);
  doc.text('BILL TO / CUSTOMER', 21, y + 8);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(order.customer_name, 21, y + 16);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textBody[0], textBody[1], textBody[2]);
  let custY = y + 21;
  if (order.company_name) {
    doc.setFont('helvetica', 'bold');
    doc.text(order.company_name, 21, custY);
    custY += 4.5;
  }
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text(`Tel: ${order.customer_phone}`, 21, custY);
  custY += 4.5;
  doc.text(`Email: ${order.customer_email}`, 21, custY);
  custY += 4.5;

  // Account Type & Customer HST Number
  const acctType = order.account_type === 'personal' ? 'Personal Account' : 'Commercial Account';
  const custHst = order.customer_hst_number || order.hst_number;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  if (custHst) {
    doc.text(`${acctType}  •  HST: ${custHst}`, 21, custY);
  } else {
    doc.text(`Account Type: ${acctType}`, 21, custY);
  }

  // Routing Card
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(cardBorder[0], cardBorder[1], cardBorder[2]);
  doc.roundedRect(108, y, cardW, cardH, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(red[0], red[1], red[2]);
  doc.text('ROUTING & DESTINATIONS', 114, y + 8);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('PICKUP:', 114, y + 15);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textBody[0], textBody[1], textBody[2]);
  doc.text(pickupLines, 131, y + 15);

  const deliveryY = y + 15 + Math.max(pickupLines.length * 4.2, 8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('DROPOFF:', 114, deliveryY);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textBody[0], textBody[1], textBody[2]);
  doc.text(dropLines, 131, deliveryY);

  // --- LINE ITEM TABLE (WHITE THEME) ---
  y = y + cardH + 5;
  const tableStartY = y;

  // Header Bar (Light Slate Background, Clean Borders, Dark Bold Text)
  doc.setFillColor(tableHeaderBg[0], tableHeaderBg[1], tableHeaderBg[2]);
  doc.setDrawColor(cardBorder[0], cardBorder[1], cardBorder[2]);
  doc.rect(15, y, 180, 8, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('DESCRIPTION / LOGISTICS SPECIFICATION', 20, y + 5.5);
  doc.text('SPECS / DETAILS', 120, y + 5.5);
  doc.text('AMOUNT (CAD)', 190, y + 5.5, { align: 'right' });

  // Rows
  y += 8;
  const addRow = (label: string, specs: string, amount: number, isSub = false, isDiscount = false) => {
    if (isDiscount) {
      doc.setFillColor(240, 253, 244);
    } else if (isSub) {
      doc.setFillColor(252, 253, 255);
    } else {
      doc.setFillColor(255, 255, 255);
    }
    doc.rect(15, y, 180, 7.5, 'F');

    // Subtle line
    doc.setDrawColor(241, 245, 249);
    doc.line(15, y + 7.5, 195, y + 7.5);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', isSub ? 'normal' : 'bold');
    if (isDiscount) {
      doc.setTextColor(4, 120, 87);
    } else {
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    }
    doc.text(label, 20, y + 5.2);

    doc.setFont('helvetica', 'normal');
    if (isDiscount) {
      doc.setTextColor(5, 150, 105);
    } else {
      doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
    }
    doc.text(specs, 120, y + 5.2);

    doc.setFont('helvetica', 'bold');
    if (isDiscount) {
      doc.setTextColor(4, 120, 87);
      doc.text(`-$${Math.abs(amount).toFixed(2)}`, 190, y + 5.2, { align: 'right' });
    } else {
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      doc.text(`$${amount.toFixed(2)}`, 190, y + 5.2, { align: 'right' });
    }
    y += 7.5;
  };

  addRow(
    `Transport Base Rate (${order.vehicle_name})`,
    `${order.distance_km} km / ${order.weight_lbs} lbs`,
    order.base_price
  );

  if (order.excess_km_charge > 0) {
    addRow('Excess Distance Surcharge (> 40km)', 'Beyond 40km delivery radius', order.excess_km_charge, true);
  }

  if (order.delivery_type_charge && order.delivery_type_charge > 0) {
    const typeLabel =
      order.delivery_time_option === 'urgent' ||
      order.delivery_time_option === 'asap' ||
      order.delivery_time_option === '1-2h'
        ? 'Urgent / ASAP Priority (1.50x)'
        : 'On-Demand / Direct Route (1.25x)';
    addRow('Priority Speed Premium', typeLabel, order.delivery_type_charge, true);
  }

  if (order.after_hours_charge > 0) {
    addRow('After-Hours Service Surcharge', 'Evening / Weekend dispatch', order.after_hours_charge, true);
  }

  if (order.waiting_charge > 0) {
    addRow('Loading / Waiting Time', 'Extra driver wait / staging', order.waiting_charge, true);
  }

  if (order.labor_charge > 0) {
    addRow('Additional Labor & Handling', 'Driver heavy lift assist', order.labor_charge, true);
  }

  if (order.discount_amount && order.discount_amount > 0) {
    const discLabel = order.discount_type || 'Customer Loyalty Discount';
    const discSpecs = order.discount_notes ? order.discount_notes : 'Special customer discount';
    addRow(discLabel, discSpecs, order.discount_amount, false, true);
  }

  // Outer border around entire table
  doc.setDrawColor(cardBorder[0], cardBorder[1], cardBorder[2]);
  doc.rect(15, tableStartY, 180, y - tableStartY, 'S');

  // --- SUMMARY TOTALS SECTION ---
  y += 5;
  const rightLabelX = 142;
  const rightValX = 190;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text('Subtotal:', rightLabelX, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(`$${order.subtotal.toFixed(2)} CAD`, rightValX, y, { align: 'right' });

  if (order.tax_amount > 0) {
    y += 5.5;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
    doc.text('HST (13%):', rightLabelX, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(`$${order.tax_amount.toFixed(2)} CAD`, rightValX, y, { align: 'right' });

    y += 4;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
    doc.text(`CRA Reg: ${hstRegNo}`, rightValX, y, { align: 'right' });
  }

  // Total Due Card (Clean Crimson Card with Bold White Text)
  y += 6.5;
  doc.setFillColor(red[0], red[1], red[2]);
  doc.roundedRect(rightLabelX - 6, y - 4.5, 59, 11, 1.5, 1.5, 'F');

  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('TOTAL DUE:', rightLabelX, y + 3.2);
  doc.text(`$${order.total_price.toFixed(2)}`, rightValX, y + 3.2, { align: 'right' });

  // Special Instructions (placed on the left side under table)
  if (order.custom_instructions) {
    const leftY = y - 12;
    doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    doc.setDrawColor(cardBorder[0], cardBorder[1], cardBorder[2]);
    doc.roundedRect(15, leftY, 115, 22, 1.5, 1.5, 'FD');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(red[0], red[1], red[2]);
    doc.text('SPECIAL DELIVERY INSTRUCTIONS:', 19, leftY + 6);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textBody[0], textBody[1], textBody[2]);
    const instLines = doc.splitTextToSize(order.custom_instructions, 107);
    doc.text(instLines, 19, leftY + 12);
  }

  // --- TERMS & CONDITIONS ---
  y = 246;
  doc.setDrawColor(cardBorder[0], cardBorder[1], cardBorder[2]);
  doc.setLineWidth(0.3);
  doc.line(15, y, 195, y);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('TERMS & COMMERCIAL CONDITIONS', 15, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text(
    '• Payment is due upon receipt or delivery completion as specified in your commercial account agreement.\n• Base rates include standard loading/unloading up to 20 minutes; extended wait time is billed at scheduled tariffs.\n• Applicable 407 ETR toll highway charges and authorized parking/access fees are invoiced at cost.\n• FlashDrop Express operates licensed commercial courier transport adhering to Ontario Ministry of Transportation standards.',
    15,
    y + 10
  );

  // --- FOOTER BRANDING ---
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.rect(0, 280, 210, 17, 'F');
  doc.setDrawColor(cardBorder[0], cardBorder[1], cardBorder[2]);
  doc.line(0, 280, 210, 280);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(red[0], red[1], red[2]);
  doc.text('FLASHDROP EXPRESS', 105, 286, { align: 'center' });

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text(
    'Toronto & GTA Same-Day & Rush Courier Services  •  www.flashdropexpress.com  •  support@flashdropexpress.com',
    105,
    291,
    { align: 'center' }
  );

  // Save the PDF
  doc.save(`FlashDrop_Invoice_${order.order_number}.pdf`);
}

