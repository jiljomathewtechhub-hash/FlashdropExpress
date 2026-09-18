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
  const parentCo = settings.parent_company || 'SNM Group International Inc.';
  const hstRegNo = settings.hst_number || '78750 1444 RT0001';
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textBody[0], textBody[1], textBody[2]);
  doc.setFontSize(7);
  doc.text(`Operated by ${parentCo}  •  Suite 108, 3064 Jaguar Valley Dr, Mississauga, ON L5A 2J3`, 15, 33);
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
  const dropAddressWithUnit = order.delivery_unit ? `${order.delivery_address} (${order.delivery_unit})` : order.delivery_address;
  const dropLines = doc.splitTextToSize(dropAddressWithUnit, 62);
  const receiverContactName = order.delivery_contact_name || order.customer_name || 'Designated Consignee';
  const receiverContactPhone = order.delivery_contact_phone || order.customer_phone || '';
  const receiverText = receiverContactPhone
    ? `${receiverContactName} (Tel: ${receiverContactPhone})`
    : receiverContactName;
  const receiverLines = doc.splitTextToSize(receiverText, 62);

  const routingContentH = 15 + pickupLines.length * 4.2 + 5 + dropLines.length * 4.2 + 5 + receiverLines.length * 4.2 + 10;
  const custContentH = 22 + (order.company_name ? 5 : 0) + 14 + 6;
  const cardH = Math.max(54, Math.max(routingContentH, custContentH));

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

  const deliveryY = y + 15 + Math.max(pickupLines.length * 4.2, 7) + 1.5;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('DROPOFF:', 114, deliveryY);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textBody[0], textBody[1], textBody[2]);
  doc.text(dropLines, 131, deliveryY);

  const recvY = deliveryY + Math.max(dropLines.length * 4.2, 7) + 1.5;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('RECEIVER:', 114, recvY);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textBody[0], textBody[1], textBody[2]);
  doc.text(receiverLines, 131, recvY);

  const distY = recvY + Math.max(receiverLines.length * 4.2, 7) + 2;
  const insideKm = order.inside_gta_km !== undefined ? order.inside_gta_km : (order.service_area === 'Ontario-Wide' ? 0 : order.distance_km);
  const outsideKm = order.outside_gta_km !== undefined ? order.outside_gta_km : (order.service_area === 'Ontario-Wide' ? order.distance_km : 0);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('DISTANCE:', 114, distY);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textBody[0], textBody[1], textBody[2]);
  doc.text(`${order.distance_km} km (${insideKm} km GTA / ${outsideKm} km Outside)`, 131, distY);

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
    `${order.distance_km} km (${insideKm} km GTA / ${outsideKm} km Outside) • ${order.weight_lbs} lbs`,
    order.base_price
  );

  if (order.excess_km_charge > 0) {
    addRow('Excess Distance Surcharge (> 40km)', 'Beyond 40km delivery radius', order.excess_km_charge, true);
  }

  // Ontario-Wide / Outside GTA Delivery Coverage Surcharge ($60.00 base)
  const outsideCharge = order.outside_gta_charge ?? (order.service_area === 'Ontario-Wide' ? 60.0 : 0);
  if (outsideCharge > 0) {
    const isVar = order.is_variable_pricing || (order.distance_km > 100 && outsideKm > 0);
    const outsideSpecs = isVar
      ? `${outsideKm} km Outside GTA (Over 100 km: amount may vary)`
      : `${outsideKm} km Outside GTA Coverage`;
    addRow('Ontario-Wide Delivery Coverage Surcharge', outsideSpecs, outsideCharge, true);
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
    `A Division of ${settings.parent_company || 'SNM Group International Inc.'}  •  www.flashdropexpress.com  •  support@flashdropexpress.com`,
    105,
    291,
    { align: 'center' }
  );

  // Save the PDF
  doc.save(`FlashDrop_Invoice_${order.order_number}.pdf`);
}

/**
 * Draws a sharp, vector-based Code 128-style barcode using native PDF rectangles.
 */
function drawVectorBarcode(
  doc: jsPDF,
  text: string,
  startX: number,
  startY: number,
  totalWidth: number,
  barHeight: number
): void {
  doc.setFillColor(15, 23, 42); // Slate-900 black
  const clean = text.replace(/[^A-Za-z0-9]/g, '').toUpperCase() || 'FD1001';

  // Build deterministic pattern of alternating bar & space widths
  const sequence: number[] = [2, 1, 1, 2, 1]; // Start guard pattern
  for (let i = 0; i < clean.length; i++) {
    const code = clean.charCodeAt(i);
    sequence.push(((code >> 1) % 3) + 1);
    sequence.push(((code >> 3) % 2) + 1);
    sequence.push((code % 3) + 1);
    sequence.push(((code >> 2) % 2) + 1);
  }
  sequence.push(2, 1, 2, 2); // Stop guard pattern

  const totalUnits = sequence.reduce((acc, curr) => acc + curr, 0);
  const unitWidth = totalWidth / totalUnits;

  let currentX = startX;
  let isBar = true;

  for (const barUnits of sequence) {
    const w = barUnits * unitWidth;
    if (isBar) {
      doc.rect(currentX, startY, w, barHeight, 'F');
    }
    currentX += w;
    isBar = !isBar;
  }
}

/**
 * Generates and downloads a legally compliant Commercial Shipping Waybill /
 * Uniform Straight Bill of Lading (BOL) for an order.
 *
 * Designed to Ontario Ministry of Transportation (MTO) and Canadian freight standards.
 * CRITICAL PRIVACY RULE: Contains ZERO financial prices, rates, or dollar figures.
 * Strictly focuses on chain of custody, cargo specs, origin, destination, and sign-offs.
 */
export function generateWaybillPdf(
  order: Order,
  settings: BusinessSettings = DEFAULT_BUSINESS_SETTINGS
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Palette: Clean Commercial Logistics Daylight Theme
  const red = [197, 22, 29]; // #C5161D Deep Crimson
  const textDark = [15, 23, 42]; // #0F172A Slate-900 (High contrast)
  const textBody = [51, 65, 85]; // #334155 Slate-700
  const mutedText = [100, 116, 139]; // #64748B Slate-500
  const lightBg = [248, 250, 252]; // #F8FAFC Slate-50
  const cardBorder = [203, 213, 225]; // #CBD5E1 Slate-300
  const tableHeaderBg = [241, 245, 249]; // #F1F5F9

  // Top 3mm Red Brand Stripe
  doc.setFillColor(red[0], red[1], red[2]);
  doc.rect(0, 0, 210, 3, 'F');

  // --- HEADER: CARRIER IDENTITY ---
  // Rounded Emblem Box
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(cardBorder[0], cardBorder[1], cardBorder[2]);
  doc.setLineWidth(0.4);
  doc.roundedRect(15, 8, 20, 20, 2.5, 2.5, 'FD');
  try {
    doc.addImage(FD_SPEED_LOGO_BASE64, 'JPEG', 16, 9, 18, 18);
  } catch (err) {
    try {
      doc.addImage(FLASHDROP_LOGO_BASE64, 'JPEG', 15, 8, 20, 20);
    } catch (_) {}
  }

  // Carrier Typography
  const brandX = 39;
  doc.setFontSize(17);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('FLASHDROP ', brandX, 15);
  const fdW = doc.getTextWidth('FLASHDROP ');
  doc.setTextColor(red[0], red[1], red[2]);
  doc.text('EXPRESS', brandX + fdW, 15);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(red[0], red[1], red[2]);
  doc.text('COMMERCIAL COURIER & EXPEDITED FREIGHT CARRIER', brandX, 19.5);

  const parentCo = settings.parent_company || 'SNM Group International Inc.';
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textBody[0], textBody[1], textBody[2]);
  doc.setFontSize(6.8);
  doc.text(`Carrier Authority: Operated by ${parentCo}`, brandX, 23.5);
  doc.text(
    `Terminal: Suite 108, 3064 Jaguar Valley Dr, Mississauga, ON L5A 2J3  •  Tel: ${settings.phone || '+1 (647) 804-9775'}`,
    brandX,
    27
  );
  doc.text(
    `Dispatch: ${settings.email || 'support@flashdropexpress.com'}  •  Web: www.flashdropexpress.com`,
    brandX,
    30.5
  );

  // --- RIGHT SIDE: WAYBILL & BARCODE ---
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('SHIPPING WAYBILL', 195, 14.5, { align: 'right' });

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text('UNIFORM STRAIGHT BILL OF LADING', 195, 18.5, { align: 'right' });

  // Vector Barcode (48mm x 7.5mm)
  const barcodeW = 48;
  const barcodeH = 7;
  const barcodeX = 195 - barcodeW;
  const barcodeY = 21;
  drawVectorBarcode(doc, order.order_number, barcodeX, barcodeY, barcodeW, barcodeH);

  // Waybill / Tracking # Text below barcode
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(red[0], red[1], red[2]);
  doc.text(`* ${order.order_number} *`, 195 - barcodeW / 2, barcodeY + barcodeH + 3.8, { align: 'center' });

  // Divider Line below Header
  doc.setDrawColor(cardBorder[0], cardBorder[1], cardBorder[2]);
  doc.setLineWidth(0.4);
  doc.line(15, 36, 195, 36);

  // Crimson accent rule
  doc.setDrawColor(red[0], red[1], red[2]);
  doc.setLineWidth(0.8);
  doc.line(15, 36, 50, 36);

  // --- LOGISTICS DISPATCH METADATA STRIP ---
  let y = 39;
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.setDrawColor(cardBorder[0], cardBorder[1], cardBorder[2]);
  doc.roundedRect(15, y, 180, 16, 1.5, 1.5, 'FD');

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text('TENDER DATE', 20, y + 5);
  doc.text('SERVICE CLASS', 60, y + 5);
  doc.text('ASSIGNED COURIER', 105, y + 5);
  doc.text('VEHICLE TYPE', 145, y + 5);
  doc.text('BILLING TERMS', 172, y + 5);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(new Date(order.created_at).toLocaleDateString('en-CA'), 20, y + 11.5);

  const isUrgent =
    order.delivery_time_option === 'urgent' ||
    order.delivery_time_option === 'asap' ||
    order.delivery_time_option === '1-2h';
  doc.setTextColor(isUrgent ? red[0] : 15, isUrgent ? red[1] : 23, isUrgent ? red[2] : 42);
  doc.text(isUrgent ? 'URGENT (DIRECT)' : 'SAME-DAY EXPEDITED', 60, y + 11.5);

  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(order.assigned_driver_name || 'Fleet Dispatched', 105, y + 11.5);
  doc.text(order.vehicle_name || 'Cargo Van', 145, y + 11.5);

  // Explicitly NO DOLLARS: Legal Billing Terms indicator
  doc.setTextColor(16, 185, 129); // Green
  doc.text('PREPAID', 172, y + 11.5);

  // --- SHIPPER (ORIGIN) & CONSIGNEE (DESTINATION) BLOCKS ---
  y = 59;
  const colW = 88;
  const pickupLines = doc.splitTextToSize(order.pickup_address, 65);
  const deliveryLines = doc.splitTextToSize(order.delivery_address, 65);
  const cardHeight = Math.max(58, Math.max(pickupLines.length, deliveryLines.length) * 4.2 + 42);

  // --- SHIPPER / CONSIGNOR CARD ---
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(cardBorder[0], cardBorder[1], cardBorder[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(15, y, colW, cardHeight, 1.5, 1.5, 'FD');

  // Shipper Header Bar
  doc.setFillColor(tableHeaderBg[0], tableHeaderBg[1], tableHeaderBg[2]);
  doc.roundedRect(15, y, colW, 7, 1.5, 1.5, 'FD');
  doc.rect(15, y + 4, colW, 3, 'F'); // flatten bottom corners
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(red[0], red[1], red[2]);
  doc.text('1. SHIPPER / CONSIGNOR (PICKUP ORIGIN)', 19, y + 5);

  let sY = y + 12;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text('COMPANY / NAME:', 19, sY);
  doc.setFontSize(8.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(order.company_name || order.customer_name, 45, sY);

  sY += 5;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text('ON-SITE CONTACT:', 19, sY);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(
    `${order.pickup_contact_name || order.customer_name} (Tel: ${order.pickup_contact_phone || order.customer_phone})`,
    45,
    sY
  );

  sY += 5;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text('PICKUP ADDRESS:', 19, sY);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(pickupLines, 45, sY);
  sY += pickupLines.length * 4.2;

  if (order.pickup_unit) {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
    doc.text('UNIT / BAY #:', 19, sY);
    doc.setFontSize(8);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(order.pickup_unit, 45, sY);
    sY += 5;
  }

  if (order.pickup_notes) {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(red[0], red[1], red[2]);
    doc.text('PICKUP NOTES:', 19, sY);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textBody[0], textBody[1], textBody[2]);
    const pNotes = doc.splitTextToSize(order.pickup_notes, 42);
    doc.text(pNotes, 45, sY);
    sY += pNotes.length * 4;
  }

  sY += 5;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text('SERVICE REGION:', 19, sY);
  doc.setFontSize(7.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(order.service_area || 'GTA Central', 45, sY);

  // --- CONSIGNEE / RECEIVER CARD ---
  const cX = 107;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(cardBorder[0], cardBorder[1], cardBorder[2]);
  doc.roundedRect(cX, y, colW, cardHeight, 1.5, 1.5, 'FD');

  // Consignee Header Bar
  doc.setFillColor(tableHeaderBg[0], tableHeaderBg[1], tableHeaderBg[2]);
  doc.roundedRect(cX, y, colW, 7, 1.5, 1.5, 'FD');
  doc.rect(cX, y + 4, colW, 3, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(red[0], red[1], red[2]);
  doc.text('2. CONSIGNEE / RECEIVER (DESTINATION)', cX + 4, y + 5);

  let dY = y + 12;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text('RECEIVING SITE:', cX + 4, dY);
  doc.setFontSize(8.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(order.delivery_contact_name ? `${order.delivery_contact_name} (Site)` : (order.company_name || order.customer_name || 'Receiving Consignee'), cX + 31, dY);

  dY += 5;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text('ATTENTION TO:', cX + 4, dY);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  const waybillRecvName = order.delivery_contact_name || order.customer_name || 'Receiving Consignee';
  const waybillRecvPhone = order.delivery_contact_phone || order.customer_phone || 'On File';
  doc.text(
    `${waybillRecvName} (Tel: ${waybillRecvPhone})`,
    cX + 31,
    dY
  );

  dY += 5;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text('DELIVER TO:', cX + 4, dY);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(deliveryLines, cX + 31, dY);
  dY += deliveryLines.length * 4.2;

  if (order.delivery_unit) {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
    doc.text('SUITE / DOCK:', cX + 4, dY);
    doc.setFontSize(8);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(order.delivery_unit, cX + 31, dY);
    dY += 5;
  }

  if (order.delivery_notes) {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(red[0], red[1], red[2]);
    doc.text('DOCK / GATE NOTES:', cX + 4, dY);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textBody[0], textBody[1], textBody[2]);
    const dNotes = doc.splitTextToSize(order.delivery_notes, 53);
    doc.text(dNotes, cX + 31, dY);
    dY += dNotes.length * 4;
  }

  dY += 5;
  const insideKmWb = order.inside_gta_km !== undefined ? order.inside_gta_km : (order.service_area === 'Ontario-Wide' ? 0 : order.distance_km);
  const outsideKmWb = order.outside_gta_km !== undefined ? order.outside_gta_km : (order.service_area === 'Ontario-Wide' ? order.distance_km : 0);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text('ROUTE DISTANCE:', cX + 4, dY);
  doc.setFontSize(7.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(`${order.distance_km} km (${insideKmWb} km GTA / ${outsideKmWb} km Outside)`, cX + 31, dY);

  // --- CARGO MANIFEST & LOGISTICS SPECIFICATIONS TABLE ---
  y += cardHeight + 4;
  doc.setFillColor(tableHeaderBg[0], tableHeaderBg[1], tableHeaderBg[2]);
  doc.setDrawColor(cardBorder[0], cardBorder[1], cardBorder[2]);
  doc.rect(15, y, 180, 7.5, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('ITEM #', 19, y + 5);
  doc.text('PIECES / UNITS', 34, y + 5);
  doc.text('PACKAGING TYPE', 65, y + 5);
  doc.text('DESCRIPTION OF ARTICLES / COMMODITY', 105, y + 5);
  doc.text('WEIGHT (LBS / KG)', 160, y + 5);
  doc.text('CLASS', 186, y + 5);

  y += 7.5;
  doc.setFillColor(255, 255, 255);
  doc.rect(15, y, 180, 8.5, 'F');
  doc.setDrawColor(cardBorder[0], cardBorder[1], cardBorder[2]);
  doc.rect(15, y - 7.5, 180, 16, 'S');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('01', 20, y + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.text(`${order.quantity || 1} Handling Unit(s)`, 34, y + 5.5);

  const pkgLabel = (order.item_type || 'General Freight').replace(/_/g, ' ').toUpperCase();
  doc.text(pkgLabel, 65, y + 5.5);

  const descLabel = order.item_description
    ? order.item_description
    : `${pkgLabel} - Commercial Freight Transport`;
  const truncatedDesc = doc.splitTextToSize(descLabel, 50)[0] || descLabel;
  doc.text(truncatedDesc, 105, y + 5.5);

  const kgWeight = Math.round(Number(order.weight_lbs || 50) * 0.453592);
  doc.setFont('helvetica', 'bold');
  doc.text(`${order.weight_lbs || 50} lbs (${kgWeight} kg)`, 160, y + 5.5);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129); // Green Non-Haz
  doc.text('NON-HAZ', 186, y + 5.5);

  // Special Handling Instructions Box
  y += 11;
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.setDrawColor(cardBorder[0], cardBorder[1], cardBorder[2]);
  doc.roundedRect(15, y, 180, 14, 1.5, 1.5, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(red[0], red[1], red[2]);
  doc.text('SPECIAL DISPATCH, SECUREMENT & HANDLING DIRECTIVES:', 19, y + 4.5);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textBody[0], textBody[1], textBody[2]);
  const directives =
    order.custom_instructions ||
    'Standard professional carriage. Keep dry, protect from precipitation. Ensure cargo is fully secured with ratchet straps/load bars before vehicle dispatch.';
  const dirLines = doc.splitTextToSize(directives, 172);
  doc.text(dirLines, 19, y + 9);

  // --- CHAIN OF CUSTODY & LEGAL SIGNATURES SECTION (3 COLUMNS) ---
  y += 18;
  const sigColW = 58;
  const sigH = 34;

  // Title for Signatures
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('LEGAL EXECUTION, TENDER OF GOODS & CHAIN OF CUSTODY', 15, y);

  y += 3;

  // Box 1: Shipper Tender & Certification
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(cardBorder[0], cardBorder[1], cardBorder[2]);
  doc.roundedRect(15, y, sigColW, sigH, 1.5, 1.5, 'FD');

  doc.setFillColor(tableHeaderBg[0], tableHeaderBg[1], tableHeaderBg[2]);
  doc.roundedRect(15, y, sigColW, 5.5, 1.5, 1.5, 'FD');
  doc.rect(15, y + 3, sigColW, 2.5, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('1. SHIPPER TENDER & CERTIFICATION', 18, y + 4);

  doc.setFontSize(5.8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text('Certified articles are properly classified, packaged & labeled in good order for carriage.', 18, y + 8.5, {
    maxWidth: sigColW - 6,
  });

  doc.setFontSize(6.8);
  doc.setTextColor(textBody[0], textBody[1], textBody[2]);
  doc.text(`Shipper: ${order.pickup_contact_name || order.customer_name}`, 18, y + 17);
  doc.line(18, y + 27, 15 + sigColW - 6, y + 27);
  doc.setFontSize(6);
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text('Authorized Shipper Signature & Date', 18, y + 30.5);

  // Box 2: Carrier / Driver Acceptance
  const dX = 15 + sigColW + 3;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(cardBorder[0], cardBorder[1], cardBorder[2]);
  doc.roundedRect(dX, y, sigColW, sigH, 1.5, 1.5, 'FD');

  doc.setFillColor(tableHeaderBg[0], tableHeaderBg[1], tableHeaderBg[2]);
  doc.roundedRect(dX, y, sigColW, 5.5, 1.5, 1.5, 'FD');
  doc.rect(dX, y + 3, sigColW, 2.5, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('2. CARRIER / DRIVER ACCEPTANCE', dX + 3, y + 4);

  doc.setFontSize(5.8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text('Carrier acknowledges receipt of goods in apparent good order for transport to destination.', dX + 3, y + 8.5, {
    maxWidth: sigColW - 6,
  });

  doc.setFontSize(6.8);
  doc.setTextColor(textBody[0], textBody[1], textBody[2]);
  doc.text(`Driver: ${order.assigned_driver_name || 'Fleet Courier'}`, dX + 3, y + 17);
  doc.text(`Vehicle: ${order.vehicle_name}`, dX + 3, y + 21);
  doc.line(dX + 3, y + 27, dX + sigColW - 6, y + 27);
  doc.setFontSize(6);
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text('Courier Driver Signature & Date', dX + 3, y + 30.5);

  // Box 3: Consignee Delivery Sign-Off (Proof of Delivery)
  const rX = dX + sigColW + 3;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(cardBorder[0], cardBorder[1], cardBorder[2]);
  doc.roundedRect(rX, y, sigColW, sigH, 1.5, 1.5, 'FD');

  doc.setFillColor(tableHeaderBg[0], tableHeaderBg[1], tableHeaderBg[2]);
  doc.roundedRect(rX, y, sigColW, 5.5, 1.5, 1.5, 'FD');
  doc.rect(rX, y + 3, sigColW, 2.5, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(red[0], red[1], red[2]);
  doc.text('3. CONSIGNEE DELIVERY (POD)', rX + 3, y + 4);

  doc.setFontSize(5.8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text('Received shipment complete and in apparent good condition without shortage or damage.', rX + 3, y + 8.5, {
    maxWidth: sigColW - 6,
  });

  if (order.proof_of_delivery?.signature_url) {
    try {
      doc.addImage(order.proof_of_delivery.signature_url, 'PNG', rX + 6, y + 13, 44, 12);
    } catch (_) {}
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129); // Green
    doc.text(`Signed by: ${order.proof_of_delivery.recipient_name || 'Consignee'}`, rX + 3, y + 27);
    doc.setFontSize(5.5);
    doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
    const dTime = order.proof_of_delivery.delivered_at
      ? new Date(order.proof_of_delivery.delivered_at).toLocaleString('en-CA')
      : 'Delivered';
    doc.text(`POD Verified: ${dTime}`, rX + 3, y + 31);
  } else {
    doc.line(rX + 3, y + 27, rX + sigColW - 6, y + 27);
    doc.setFontSize(6);
    doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
    doc.text('Consignee Signature, Print Name & Date', rX + 3, y + 30.5);
  }

  // --- STATUTORY CONDITIONS OF CARRIAGE (ONTARIO MTO STANDARD) ---
  y += sigH + 5;
  doc.setDrawColor(cardBorder[0], cardBorder[1], cardBorder[2]);
  doc.setLineWidth(0.2);
  doc.line(15, y, 195, y);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('STATUTORY CONDITIONS OF CARRIAGE & LIMITATION OF CARRIER LIABILITY (ONTARIO REGULATIONS)', 15, y + 3.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.6);
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  const termsText =
    '1. RECEIVED subject to the standard conditions of carriage and published tariffs of FlashDrop Express in effect on date of tender. ' +
    '2. LIMITATION OF LIABILITY: Unless a higher declared value is specifically stated on the face of this waybill by the shipper prior to carriage and supplemental valuation charge paid, the amount of any loss or damage for which FlashDrop Express may be liable (whether resulting from negligence or otherwise) is strictly limited to a maximum of $2.00 per pound ($4.41 per kilogram) computed on total weight of shipment pursuant to the Ontario Highway Traffic Act and applicable commercial transport regulations. ' +
    '3. CLAIMS: Notice of loss or apparent damage must be made in writing to Carrier within 48 hours of delivery, and formal substantiated claim within thirty (30) days from tender date. ' +
    '4. CONCEALED DAMAGE: Any concealed loss or damage must be reported within twenty-four (24) hours of receipt with original packing materials retained for inspection. ' +
    '5. JURISDICTION: This contract of carriage is governed solely by the laws of the Province of Ontario and the federal laws of Canada applicable therein.';
  const splitTerms = doc.splitTextToSize(termsText, 180);
  doc.text(splitTerms, 15, y + 7.5);

  // --- FOOTER BRANDING ---
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.rect(0, 282, 210, 15, 'F');
  doc.setDrawColor(cardBorder[0], cardBorder[1], cardBorder[2]);
  doc.line(0, 282, 210, 282);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(red[0], red[1], red[2]);
  doc.text('FLASHDROP EXPRESS  •  OFFICIAL COMMERCIAL TRANSPORT WAYBILL', 105, 287.5, { align: 'center' });

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text(
    `Carrier: ${parentCo}  •  Dispatch Hotline: ${settings.phone || '+1 (647) 804-9775'}  •  Tracking Ref: ${order.order_number}`,
    105,
    292,
    { align: 'center' }
  );

  // Save the PDF
  doc.save(`FlashDrop_Waybill_${order.order_number}.pdf`);
}


