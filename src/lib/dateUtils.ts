/**
 * Date formatting helpers for orders across FlashDrop Express portals
 * Handles YYYY-MM-DD schedule strings without UTC timezone shifting,
 * as well as standard ISO-8601 timestamps.
 */

export function formatScheduleDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  try {
    const trimmed = String(dateStr).trim();
    // Check for YYYY-MM-DD format
    const parts = trimmed.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2].split('T')[0], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
    const d = new Date(trimmed);
    if (isNaN(d.getTime())) return trimmed;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return String(dateStr);
  }
}

export function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    const datePart = d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const timePart = d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return `${datePart} at ${timePart}`;
  } catch {
    return String(dateStr);
  }
}

export function formatTimeOnly(dateStr?: string | null): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return String(dateStr);
  }
}

/**
 * Formats a 24-hr time string (e.g. "11:00", "13:30") to standard Canadian 12-hr format ("11:00 AM", "1:30 PM")
 */
export function formatTimeSlot(timeStr?: string | null): string {
  if (!timeStr) return '';
  const trimmed = String(timeStr).trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (match) {
    let hour = parseInt(match[1], 10);
    const min = match[2];
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return `${hour}:${min} ${ampm}`;
  }
  return trimmed;
}

/**
 * Formats an ISO date string or timestamp into a concise, readable placement label (e.g. "Sep 23, 2026 • 2:45 PM")
 */
export function formatPlacedAt(dateStr?: string | null): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    const datePart = d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const timePart = d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return `${datePart} • ${timePart}`;
  } catch {
    return String(dateStr);
  }
}

