// Currency formatting utility for Indian Rupees (INR)
export const formatCurrency = (amount) => {
  const numericAmount = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0
  }).format(numericAmount);
};

// Date formatting utility (e.g. DD/MM/YYYY)
export const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
};

// Input date formatting for <input type="date" /> (YYYY-MM-DD)
export const formatDateForInput = (dateString) => {
  if (!dateString) return new Date().toISOString().split('T')[0];
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return new Date().toISOString().split('T')[0];
  return date.toISOString().split('T')[0];
};

// Return badge color classes based on PaymentMode
export const getPaymentModeBadgeClass = (mode) => {
  const normalized = (mode || '').toLowerCase();
  if (normalized === 'cash') return 'badge-cash';
  if (normalized === 'online') return 'badge-online';
  return 'badge-secondary';
};

// Return badge color classes based on User Role
export const getRoleBadgeClass = (role) => {
  const normalized = (role || '').toLowerCase();
  if (normalized === 'admin') return 'badge-admin';
  return 'badge-member';
};
