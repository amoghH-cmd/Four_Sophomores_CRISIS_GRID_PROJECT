export const PRIORITY_COLORS = {
  CRITICAL: '#ff3030',
  HIGH:     '#ff8c00',
  MEDIUM:   '#ffd600',
};

export const TYPE_COLORS = {
  medical: '#4fc3f7',
  food:    '#00e676',
  rescue:  '#ff8c00',
};

export const TYPE_ICONS = {
  medical: '🏥',
  food:    '🍞',
  rescue:  '🚁',
};

export const STATUS_COLORS = {
  pending:     '#7a8099',
  assigned:    '#4fc3f7',
  'in-progress': '#00e676',
  completed:   '#444',
};

export function formatTime(isoStr) {
  return new Date(isoStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function formatEta(mins) {
  if (mins === null || mins === undefined) return '—';
  if (mins === 0) return 'ON SITE';
  return `${mins}m`;
}
