export function formatDate(dateString?: string): string {
  if (!dateString) return 'Not set';
  try {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
    return dateString;
  } catch {
    return dateString;
  }
}

export function formatShortDate(dateString?: string): string {
  if (!dateString) return '--';
  try {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
    return dateString;
  } catch {
    return dateString;
  }
}

export function calculateWeeksBetween(start?: string, end?: string): number {
  if (!start || !end) return 0;
  try {
    const d1 = new Date(start).getTime();
    const d2 = new Date(end).getTime();
    const diffDays = Math.ceil(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24));
    return Math.max(1, Math.round(diffDays / 7));
  } catch {
    return 0;
  }
}
