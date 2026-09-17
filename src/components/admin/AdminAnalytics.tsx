import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  BarChart3,
  Calendar,
  DollarSign,
  Truck,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  Users,
  Package,
  MapPin,
  Percent,
  Compass,
  ArrowUpRight,
  ShieldCheck,
  Building,
  Car,
  AlertCircle,
} from 'lucide-react';
import { Order, Driver } from '../../types/order';

interface AdminAnalyticsProps {
  orders: Order[];
  drivers: Driver[];
  onNavigate?: (tab: string, param?: any) => void;
}

type TimeHorizon = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all';
type MetricView = 'revenue' | 'volume';

export const AdminAnalytics: React.FC<AdminAnalyticsProps> = ({ orders, drivers, onNavigate }) => {
  const [timeHorizon, setTimeHorizon] = useState<TimeHorizon>('month');
  const [selectedDriverId, setSelectedDriverId] = useState<string>('all');
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [metricView, setMetricView] = useState<MetricView>('revenue');
  const [hoveredDataIndex, setHoveredDataIndex] = useState<number | null>(null);

  // Determine current date limits
  const now = new Date();

  // Filter orders by Time Horizon, Driver, and Zone
  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      const orderDate = new Date(ord.created_at);

      // Driver Filter
      if (selectedDriverId !== 'all') {
        if (ord.assigned_driver_id !== selectedDriverId) return false;
      }

      // Zone Filter
      if (selectedZone !== 'all') {
        if (!ord.service_area || ord.service_area.toLowerCase() !== selectedZone.toLowerCase()) return false;
      }

      // Time Horizon Filter
      if (timeHorizon === 'all') return true;

      if (timeHorizon === 'today') {
        return (
          orderDate.getDate() === now.getDate() &&
          orderDate.getMonth() === now.getMonth() &&
          orderDate.getFullYear() === now.getFullYear()
        );
      }

      if (timeHorizon === 'week') {
        const diffTime = Math.abs(now.getTime() - orderDate.getTime());
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        return diffDays <= 7;
      }

      if (timeHorizon === 'month') {
        const diffTime = Math.abs(now.getTime() - orderDate.getTime());
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        return diffDays <= 30;
      }

      if (timeHorizon === 'quarter') {
        const diffTime = Math.abs(now.getTime() - orderDate.getTime());
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        return diffDays <= 90;
      }

      if (timeHorizon === 'year') {
        return orderDate.getFullYear() === now.getFullYear();
      }

      return true;
    });
  }, [orders, timeHorizon, selectedDriverId, selectedZone, now]);

  // Aggregate Executive KPIs
  const kpis = useMemo(() => {
    const totalOrders = filteredOrders.length;
    const completedOrders = filteredOrders.filter((o) => o.order_status === 'delivered');
    const inTransitOrders = filteredOrders.filter((o) =>
      ['accepted', 'en_route_pickup', 'picked_up', 'in_transit'].includes(o.order_status)
    );
    const quotingOrders = filteredOrders.filter((o) =>
      ['submitted', 'quote_sent'].includes(o.order_status)
    );
    const cancelledOrders = filteredOrders.filter((o) =>
      ['cancelled', 'cancellation_requested'].includes(o.order_status)
    );

    const grossRevenue = filteredOrders.reduce((sum, o) => sum + (o.total_price || 0), 0);
    const totalDiscounts = filteredOrders.reduce((sum, o) => sum + (o.discount_amount || 0), 0);
    const totalTax = filteredOrders.reduce((sum, o) => sum + (o.tax_amount || 0), 0);
    const totalDistanceKm = filteredOrders.reduce((sum, o) => sum + (o.distance_km || 0), 0);
    const averageOrderValue = totalOrders > 0 ? grossRevenue / totalOrders : 0;
    const completionRate = totalOrders > 0 ? (completedOrders.length / totalOrders) * 100 : 0;

    // Proof of delivery compliance among delivered orders
    const deliveredWithPhoto = completedOrders.filter((o) => !!o.proof_of_delivery?.photo_url).length;
    const podComplianceRate = completedOrders.length > 0 ? (deliveredWithPhoto / completedOrders.length) * 100 : 100;

    return {
      totalOrders,
      completedOrdersCount: completedOrders.length,
      inTransitCount: inTransitOrders.length,
      quotingCount: quotingOrders.length,
      cancelledCount: cancelledOrders.length,
      grossRevenue,
      totalDiscounts,
      totalTax,
      totalDistanceKm,
      averageOrderValue,
      completionRate,
      podComplianceRate,
    };
  }, [filteredOrders]);

  // Generate Interactive Time Series Chart Data based on selected horizon
  const chartData = useMemo(() => {
    if (timeHorizon === 'today') {
      // 8 time buckets: 6 AM to 9 PM in 2-hour increments
      const buckets = [
        { label: '6am-8am', startH: 6, endH: 8, revenue: 0, orders: 0, discounts: 0 },
        { label: '8am-10am', startH: 8, endH: 10, revenue: 0, orders: 0, discounts: 0 },
        { label: '10am-12pm', startH: 10, endH: 12, revenue: 0, orders: 0, discounts: 0 },
        { label: '12pm-2pm', startH: 12, endH: 14, revenue: 0, orders: 0, discounts: 0 },
        { label: '2pm-4pm', startH: 14, endH: 16, revenue: 0, orders: 0, discounts: 0 },
        { label: '4pm-6pm', startH: 16, endH: 18, revenue: 0, orders: 0, discounts: 0 },
        { label: '6pm-8pm', startH: 18, endH: 20, revenue: 0, orders: 0, discounts: 0 },
        { label: 'Night/After', startH: 20, endH: 24, revenue: 0, orders: 0, discounts: 0 },
      ];

      filteredOrders.forEach((o) => {
        const h = new Date(o.created_at).getHours();
        const b = buckets.find((b) => h >= b.startH && h < b.endH) || buckets[buckets.length - 1];
        b.revenue += o.total_price || 0;
        b.orders += 1;
        b.discounts += o.discount_amount || 0;
      });

      return buckets;
    }

    if (timeHorizon === 'week') {
      // Last 7 days
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const buckets: { label: string; dateStr: string; revenue: number; orders: number; discounts: number }[] = [];

      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayName = days[d.getDay()];
        const dateStr = d.toISOString().split('T')[0];
        buckets.push({
          label: `${dayName} ${d.getDate()}`,
          dateStr,
          revenue: 0,
          orders: 0,
          discounts: 0,
        });
      }

      filteredOrders.forEach((o) => {
        const orderDateStr = o.created_at.split('T')[0];
        const b = buckets.find((b) => b.dateStr === orderDateStr);
        if (b) {
          b.revenue += o.total_price || 0;
          b.orders += 1;
          b.discounts += o.discount_amount || 0;
        }
      });

      return buckets;
    }

    if (timeHorizon === 'month') {
      // 4 weekly buckets in the last 30 days
      const buckets = [
        { label: 'Week 1 (1-7d)', dayMin: 22, dayMax: 30, revenue: 0, orders: 0, discounts: 0 },
        { label: 'Week 2 (8-14d)', dayMin: 15, dayMax: 21, revenue: 0, orders: 0, discounts: 0 },
        { label: 'Week 3 (15-21d)', dayMin: 8, dayMax: 14, revenue: 0, orders: 0, discounts: 0 },
        { label: 'Week 4 (Past 7d)', dayMin: 0, dayMax: 7, revenue: 0, orders: 0, discounts: 0 },
      ];

      filteredOrders.forEach((o) => {
        const diffTime = Math.abs(now.getTime() - new Date(o.created_at).getTime());
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        const b = buckets.find((b) => diffDays >= b.dayMin && diffDays <= b.dayMax) || buckets[buckets.length - 1];
        b.revenue += o.total_price || 0;
        b.orders += 1;
        b.discounts += o.discount_amount || 0;
      });

      return buckets;
    }

    if (timeHorizon === 'quarter') {
      // 3 calendar months of the active quarter
      const currentMonth = now.getMonth();
      const qStartMonth = Math.floor(currentMonth / 3) * 3;
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      const buckets = [
        { label: monthNames[qStartMonth], monthIndex: qStartMonth, revenue: 0, orders: 0, discounts: 0 },
        { label: monthNames[qStartMonth + 1], monthIndex: qStartMonth + 1, revenue: 0, orders: 0, discounts: 0 },
        { label: monthNames[qStartMonth + 2], monthIndex: qStartMonth + 2, revenue: 0, orders: 0, discounts: 0 },
      ];

      filteredOrders.forEach((o) => {
        const m = new Date(o.created_at).getMonth();
        const b = buckets.find((b) => b.monthIndex === m);
        if (b) {
          b.revenue += o.total_price || 0;
          b.orders += 1;
          b.discounts += o.discount_amount || 0;
        }
      });

      return buckets;
    }

    // Default for 'year' or 'all': 12 months
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const buckets = monthNames.map((name, idx) => ({
      label: name,
      monthIndex: idx,
      revenue: 0,
      orders: 0,
      discounts: 0,
    }));

    filteredOrders.forEach((o) => {
      const m = new Date(o.created_at).getMonth();
      if (buckets[m]) {
        buckets[m].revenue += o.total_price || 0;
        buckets[m].orders += 1;
        buckets[m].discounts += o.discount_amount || 0;
      }
    });

    return buckets;
  }, [filteredOrders, timeHorizon, now]);

  // Compute Maximum Value for SVG Bar Scaling
  const maxChartVal = useMemo(() => {
    const vals = chartData.map((d) => (metricView === 'revenue' ? d.revenue : d.orders));
    const max = Math.max(...vals, 1);
    return metricView === 'revenue' ? Math.ceil(max * 1.15) : Math.max(max + 2, 5);
  }, [chartData, metricView]);

  // Fleet Courier Leaderboard
  const courierStats = useMemo(() => {
    return drivers.map((driver) => {
      const driverOrders = filteredOrders.filter((o) => o.assigned_driver_id === driver.id);
      const completed = driverOrders.filter((o) => o.order_status === 'delivered');
      const inFlight = driverOrders.filter((o) =>
        ['accepted', 'en_route_pickup', 'picked_up', 'in_transit'].includes(o.order_status)
      );
      const grossRevenue = completed.reduce((sum, o) => sum + (o.total_price || 0), 0);
      const totalKm = driverOrders.reduce((sum, o) => sum + (o.distance_km || 0), 0);
      const withPod = completed.filter((o) => !!o.proof_of_delivery?.photo_url).length;
      const podRate = completed.length > 0 ? (withPod / completed.length) * 100 : 100;

      return {
        id: driver.id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        vehicle: driver.vehicle_type,
        role: driver.staff_role || 'Courier',
        assignedCount: driverOrders.length,
        completedCount: completed.length,
        inFlightCount: inFlight.length,
        grossRevenue,
        totalKm,
        podRate,
      };
    }).sort((a, b) => b.completedCount - a.completedCount || b.grossRevenue - a.grossRevenue);
  }, [drivers, filteredOrders]);

  // Vehicle Category Demand Breakdown
  const vehicleStats = useMemo(() => {
    const categories: { [key: string]: { name: string; count: number; revenue: number } } = {
      car: { name: 'Car / Sedan', count: 0, revenue: 0 },
      suv_minivan: { name: 'SUV / Minivan', count: 0, revenue: 0 },
      van: { name: 'Van', count: 0, revenue: 0 },
      cargo_van: { name: 'Cargo Van', count: 0, revenue: 0 },
      truck: { name: 'Box Truck / Heavy', count: 0, revenue: 0 },
      van_suv: { name: 'Minivan / SUV (Legacy)', count: 0, revenue: 0 },
    };

    filteredOrders.forEach((o) => {
      const slug = o.vehicle_slug || 'cargo_van';
      if (!categories[slug]) {
        categories[slug] = { name: o.vehicle_name || slug, count: 0, revenue: 0 };
      }
      categories[slug].count += 1;
      categories[slug].revenue += o.total_price || 0;
    });

    return Object.values(categories).sort((a, b) => b.count - a.count);
  }, [filteredOrders]);

  // Geographic Service Area Demand
  const zoneStats = useMemo(() => {
    const zones: { [key: string]: { name: string; count: number; revenue: number } } = {
      core: { name: 'Toronto Downtown & Core GTA', count: 0, revenue: 0 },
      outer: { name: 'Peel, York & Outer GTA', count: 0, revenue: 0 },
      extended: { name: 'Halton, Durham & Extended Ontario', count: 0, revenue: 0 },
    };

    filteredOrders.forEach((o) => {
      const areaKey = (o.service_area || 'core').toLowerCase();
      if (zones[areaKey]) {
        zones[areaKey].count += 1;
        zones[areaKey].revenue += o.total_price || 0;
      } else {
        zones.core.count += 1;
        zones.core.revenue += o.total_price || 0;
      }
    });

    return Object.values(zones);
  }, [filteredOrders]);

  // 1-Click CSV Report Exporter
  const handleExportCsv = () => {
    if (filteredOrders.length === 0) {
      alert('No orders found matching the current reporting criteria.');
      return;
    }

    const headers = [
      'Order Number',
      'Date Created',
      'Customer Name',
      'Customer Email',
      'Customer Phone',
      'Assigned Driver',
      'Status',
      'Pickup Address',
      'Delivery Address',
      'Distance (KM)',
      'Vehicle Type',
      'Base Price CAD',
      'Excess Distance CAD',
      'Urgency Surcharge CAD',
      'Discount Amount CAD',
      'Discount Type',
      'Subtotal CAD',
      'HST Tax (13%) CAD',
      'Total Price CAD',
      'Payment Status',
      'POD Recipient',
      'POD Timestamp',
    ];

    const rows = filteredOrders.map((o) => {
      const pod = o.proof_of_delivery;
      return [
        o.order_number,
        new Date(o.created_at).toISOString(),
        `"${(o.customer_name || '').replace(/"/g, '""')}"`,
        o.customer_email || '',
        o.customer_phone || '',
        `"${(o.assigned_driver_name || 'Unassigned').replace(/"/g, '""')}"`,
        o.order_status,
        `"${(o.pickup_address || '').replace(/"/g, '""')}"`,
        `"${(o.delivery_address || '').replace(/"/g, '""')}"`,
        o.distance_km || 0,
        `"${(o.vehicle_name || '').replace(/"/g, '""')}"`,
        (o.base_price || 0).toFixed(2),
        (o.excess_km_charge || 0).toFixed(2),
        (o.delivery_type_charge || 0).toFixed(2),
        (o.discount_amount || 0).toFixed(2),
        `"${(o.discount_type || '').replace(/"/g, '""')}"`,
        (o.subtotal || 0).toFixed(2),
        (o.tax_amount || 0).toFixed(2),
        (o.total_price || 0).toFixed(2),
        o.payment_status,
        pod?.recipient_name ? `"${pod.recipient_name.replace(/"/g, '""')}"` : '',
        pod?.delivered_at || '',
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `FlashDrop_Analytics_Report_${timeHorizon}_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header & Reporting Controls Bar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-gradient-to-br from-red-600 to-amber-600 text-white rounded-xl shadow-xs">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-['Outfit'] flex items-center space-x-2">
                  <span>Dispatch &amp; Commercial Analytics Hub</span>
                  <span className="text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Live Ledger
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Real-time business intelligence, driver fulfillment velocity, revenue trends, and capacity utilization.
                </p>
              </div>
            </div>
          </div>

          {/* Export Action */}
          <div className="flex items-center space-x-2 self-start lg:self-auto">
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-4 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer shadow-xs"
              title="Download full dataset in Excel / CSV format"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV Report</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar: Time Horizon & Driver Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Time Horizon Pills */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setTimeHorizon('today')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                timeHorizon === 'today'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setTimeHorizon('week')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                timeHorizon === 'week'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              This Week (7d)
            </button>
            <button
              type="button"
              onClick={() => setTimeHorizon('month')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                timeHorizon === 'month'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              This Month (30d)
            </button>
            <button
              type="button"
              onClick={() => setTimeHorizon('quarter')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                timeHorizon === 'quarter'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Quarterly (90d)
            </button>
            <button
              type="button"
              onClick={() => setTimeHorizon('year')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                timeHorizon === 'year'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Year {now.getFullYear()}
            </button>
            <button
              type="button"
              onClick={() => setTimeHorizon('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                timeHorizon === 'all'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Time
            </button>
          </div>

          {/* Drill-down Filters: Driver & Zone */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Courier Filter */}
            <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1 text-xs">
              <Truck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <select
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
                className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer text-xs pr-1"
              >
                <option value="all">All Couriers ({drivers.length})</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} {d.staff_role ? `(${d.staff_role})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Zone Filter */}
            <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1 text-xs">
              <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" />
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer text-xs pr-1"
              >
                <option value="all">All GTA Zones</option>
                <option value="core">Toronto Downtown Core</option>
                <option value="outer">Peel / York Outer GTA</option>
                <option value="extended">Halton / Extended Ontario</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* EXECUTIVE KPI SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Gross Sales */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Gross Sales Volume</span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
              ${kpis.grossRevenue.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-400 font-bold ml-1">CAD</span>
          </div>
          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 text-slate-500">
            <span>HST Tax (13%): <strong className="text-slate-800">${kpis.totalTax.toFixed(2)}</strong></span>
            <span className="text-emerald-700 font-bold">Net: ${(kpis.grossRevenue - kpis.totalTax).toFixed(2)}</span>
          </div>
        </div>

        {/* Card 2: Completed Shipments */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Completed Runs</span>
            <div className="p-2 bg-blue-50 text-blue-700 rounded-xl border border-blue-200">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
              {kpis.completedOrdersCount}
            </span>
            <span className="text-[11px] text-slate-500 font-medium ml-1.5">
              of {kpis.totalOrders} order{kpis.totalOrders === 1 ? '' : 's'}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 text-slate-500">
            <span>Fulfillment Rate:</span>
            <span className="text-blue-700 font-black">{kpis.completionRate.toFixed(1)}%</span>
          </div>
        </div>

        {/* Card 3: Average Order Value & Distance */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Avg Ticket / Order</span>
            <div className="p-2 bg-purple-50 text-purple-700 rounded-xl border border-purple-200">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
              ${kpis.averageOrderValue.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-400 font-bold ml-1">CAD</span>
          </div>
          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 text-slate-500">
            <span>Total Fleet Log:</span>
            <span className="text-purple-800 font-bold">{kpis.totalDistanceKm.toFixed(1)} KM</span>
          </div>
        </div>

        {/* Card 4: Customer Retention & Discounts Granted */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Loyalty Savings</span>
            <div className="p-2 bg-amber-50 text-amber-700 rounded-xl border border-amber-200">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-black text-emerald-700 font-mono">
              ${kpis.totalDiscounts.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-400 font-bold ml-1">CAD</span>
          </div>
          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 text-slate-500">
            <span>POD Photo Rate:</span>
            <span className="text-emerald-800 font-bold">{kpis.podComplianceRate.toFixed(0)}% verified</span>
          </div>
        </div>
      </div>

      {/* INTERACTIVE GRAPHICAL CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MAIN CHART: REVENUE & SHIPMENT VOLUME OVER TIME */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h4 className="text-sm font-bold text-slate-900 font-['Outfit'] uppercase tracking-wider flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-red-600" />
                <span>Financial Velocity &amp; Fulfillment Timeline</span>
              </h4>
              <p className="text-[11px] text-slate-500">
                Interactive earnings and shipment progression grouped across the {timeHorizon} window.
              </p>
            </div>

            {/* Metric Toggle: Revenue vs Orders */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 self-start sm:self-auto text-xs font-bold">
              <button
                type="button"
                onClick={() => setMetricView('revenue')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  metricView === 'revenue' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Revenue ($ CAD)
              </button>
              <button
                type="button"
                onClick={() => setMetricView('volume')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  metricView === 'volume' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Delivery Volume (#)
              </button>
            </div>
          </div>

          {/* Interactive SVG Bar Chart Container */}
          <div className="relative pt-4 pb-2">
            <div className="h-64 sm:h-72 w-full flex items-end justify-between gap-2 px-2 sm:px-4 border-b border-slate-200">
              {chartData.map((d, idx) => {
                const val = metricView === 'revenue' ? d.revenue : d.orders;
                const heightPct = maxChartVal > 0 ? Math.max((val / maxChartVal) * 100, 4) : 4;
                const isHovered = hoveredDataIndex === idx;

                return (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
                    onMouseEnter={() => setHoveredDataIndex(idx)}
                    onMouseLeave={() => setHoveredDataIndex(null)}
                  >
                    {/* Hover Tooltip Card */}
                    {isHovered && (
                      <div className="absolute bottom-full mb-2 z-20 bg-slate-900 text-white rounded-xl px-3 py-2 text-[11px] shadow-xl space-y-1 w-max pointer-events-none animate-fade-in border border-slate-700">
                        <div className="font-bold text-slate-200 border-b border-slate-800 pb-1">
                          {d.label}
                        </div>
                        <div className="flex justify-between space-x-3 text-slate-300">
                          <span>Revenue:</span>
                          <strong className="text-emerald-400 font-mono">${d.revenue.toFixed(2)} CAD</strong>
                        </div>
                        <div className="flex justify-between space-x-3 text-slate-300">
                          <span>Orders:</span>
                          <strong className="text-white font-mono">{d.orders} run{d.orders === 1 ? '' : 's'}</strong>
                        </div>
                        {d.discounts > 0 && (
                          <div className="flex justify-between space-x-3 text-amber-300">
                            <span>Discounts:</span>
                            <strong className="font-mono">-${d.discounts.toFixed(2)}</strong>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Value label above bar if non-zero */}
                    {val > 0 && (
                      <span className="text-[10px] font-mono font-bold text-slate-600 mb-1 opacity-80 group-hover:opacity-100 group-hover:text-red-700 transition truncate">
                        {metricView === 'revenue' ? `$${Math.round(val)}` : val}
                      </span>
                    )}

                    {/* Animated Bar with Brand Crimson / Emerald Gradient */}
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full max-w-[48px] rounded-t-xl transition-all duration-300 shadow-sm ${
                        val === 0
                          ? 'bg-slate-200/70'
                          : isHovered
                          ? 'bg-gradient-to-t from-red-600 to-amber-500 shadow-md ring-2 ring-red-400/50 scale-102'
                          : metricView === 'revenue'
                          ? 'bg-gradient-to-t from-[#C5161D] to-red-500 hover:from-red-600 hover:to-amber-500'
                          : 'bg-gradient-to-t from-blue-700 to-indigo-500 hover:from-blue-600 hover:to-indigo-400'
                      }`}
                    />

                    {/* X-Axis Time Label */}
                    <div className="mt-2 text-[10px] font-bold text-slate-500 group-hover:text-slate-900 transition truncate text-center w-full">
                      {d.label.split(' ')[0]}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Scale legend */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 px-2">
              <span>0 {metricView === 'revenue' ? 'CAD' : 'Orders'}</span>
              <span>Peak: {metricView === 'revenue' ? `$${maxChartVal.toFixed(0)} CAD` : `${maxChartVal} Orders`}</span>
            </div>
          </div>
        </div>

        {/* DONUT & STATUS FULFILLMENT BREAKDOWN */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-1 border-b border-slate-100 pb-3">
            <h4 className="text-sm font-bold text-slate-900 font-['Outfit'] uppercase tracking-wider flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Shipment Fulfillment Ratio</span>
            </h4>
            <p className="text-[11px] text-slate-500">
              Live lifecycle distribution across current reporting window.
            </p>
          </div>

          {/* Status Breakdown Progress Bars */}
          <div className="space-y-3.5 my-auto">
            {/* Delivered */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-emerald-900 flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Delivered (Verified POD)</span>
                </span>
                <span className="font-mono font-bold text-slate-900">
                  {kpis.completedOrdersCount} ({kpis.totalOrders > 0 ? Math.round((kpis.completedOrdersCount / kpis.totalOrders) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  style={{ width: `${kpis.totalOrders > 0 ? (kpis.completedOrdersCount / kpis.totalOrders) * 100 : 0}%` }}
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                />
              </div>
            </div>

            {/* In-Transit */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-blue-900 flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span>In-Transit / En Route</span>
                </span>
                <span className="font-mono font-bold text-slate-900">
                  {kpis.inTransitCount} ({kpis.totalOrders > 0 ? Math.round((kpis.inTransitCount / kpis.totalOrders) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  style={{ width: `${kpis.totalOrders > 0 ? (kpis.inTransitCount / kpis.totalOrders) * 100 : 0}%` }}
                  className="bg-blue-500 h-full rounded-full transition-all duration-500"
                />
              </div>
            </div>

            {/* Quoted / Pending Approval */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-amber-900 flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>Quotes &amp; Pending Approval</span>
                </span>
                <span className="font-mono font-bold text-slate-900">
                  {kpis.quotingCount} ({kpis.totalOrders > 0 ? Math.round((kpis.quotingCount / kpis.totalOrders) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  style={{ width: `${kpis.totalOrders > 0 ? (kpis.quotingCount / kpis.totalOrders) * 100 : 0}%` }}
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                />
              </div>
            </div>

            {/* Cancelled */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-slate-700 flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  <span>Cancelled Orders</span>
                </span>
                <span className="font-mono font-bold text-slate-900">
                  {kpis.cancelledCount} ({kpis.totalOrders > 0 ? Math.round((kpis.cancelledCount / kpis.totalOrders) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  style={{ width: `${kpis.totalOrders > 0 ? (kpis.cancelledCount / kpis.totalOrders) * 100 : 0}%` }}
                  className="bg-slate-400 h-full rounded-full transition-all duration-500"
                />
              </div>
            </div>
          </div>

          {/* Bottom Dispatch Compliance Callout */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] text-slate-600 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>{kpis.podComplianceRate.toFixed(0)}% POD Compliance:</strong> Delivery photos and receiver sign-offs are archived and audit-ready.
            </span>
          </div>
        </div>
      </div>

      {/* DRIVER PERFORMANCE LEADERBOARD & VEHICLE DEMAND SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FLEET DRIVER PERFORMANCE LEADERBOARD (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="space-y-0.5">
              <h4 className="text-sm font-bold text-slate-900 font-['Outfit'] uppercase tracking-wider flex items-center space-x-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Courier Fleet Performance Leaderboard</span>
              </h4>
              <p className="text-[11px] text-slate-500">
                Driver ranking by completed deliveries, gross revenue generated, and digital POD compliance.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Courier Name</th>
                  <th className="py-2.5 px-3">Vehicle</th>
                  <th className="py-2.5 px-3 text-center">Completed</th>
                  <th className="py-2.5 px-3 text-center">In Flight</th>
                  <th className="py-2.5 px-3 text-right">Revenue Generated</th>
                  <th className="py-2.5 px-3 text-center">POD %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {courierStats.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      No courier activity recorded in this time horizon.
                    </td>
                  </tr>
                ) : (
                  courierStats.map((c, rank) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                            rank === 0 ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {rank + 1}
                          </span>
                          <div>
                            <span className="font-bold text-slate-900 block">{c.name}</span>
                            <span className="text-[10px] text-slate-500">{c.role}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-medium text-slate-800">{c.vehicle || 'Fleet Van'}</span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-black font-mono text-slate-900">{c.completedCount}</span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {c.inFlightCount > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 text-[10px] font-bold">
                            {c.inFlightCount} active
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="font-mono font-bold text-slate-900">${c.grossRevenue.toFixed(2)} CAD</span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.podRate === 100
                            ? 'bg-emerald-100 text-emerald-900'
                            : 'bg-amber-100 text-amber-900'
                        }`}>
                          {c.podRate.toFixed(0)}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* VEHICLE DEMAND & SERVICE AREA UTILIZATION (1 col) */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5 flex flex-col justify-between">
          <div className="space-y-1 border-b border-slate-100 pb-3">
            <h4 className="text-sm font-bold text-slate-900 font-['Outfit'] uppercase tracking-wider flex items-center space-x-2">
              <Car className="w-4 h-4 text-purple-600" />
              <span>Vehicle Class Demand</span>
            </h4>
            <p className="text-[11px] text-slate-500">
              Fleet equipment utilization across customer orders.
            </p>
          </div>

          <div className="space-y-3">
            {vehicleStats.map((v, i) => {
              const pct = kpis.totalOrders > 0 ? Math.round((v.count / kpis.totalOrders) * 100) : 0;
              return (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-800">{v.name}</span>
                    <span className="font-mono text-slate-900">
                      <strong>{v.count}</strong> orders ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className="bg-purple-600 h-full rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* GTA Geographic Zones Breakdown */}
          <div className="pt-4 border-t border-slate-100 space-y-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              GTA Geographic Route Distribution
            </span>
            <div className="space-y-2 text-xs">
              {zoneStats.map((z, idx) => (
                <div key={idx} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-slate-800 font-medium text-[11px] truncate max-w-[180px]">{z.name}</span>
                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-slate-900">{z.count} runs</span>
                    <span className="text-[10px] text-slate-500 block font-mono">${z.revenue.toFixed(0)} CAD</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
