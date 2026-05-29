export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const formatAadhaar = (val) => {
  // Format to 12-digit numeric, remove non-digits
  const clean = val.replace(/\D/g, '');
  return clean.slice(0, 12);
};

export const formatPAN = (val) => {
  // Format to capital alphanumeric
  const clean = val.replace(/[^a-zA-Z0-9]/g, '');
  return clean.toUpperCase().slice(0, 10);
};

export const formatPhone = (val) => {
  const clean = val.replace(/\D/g, '');
  return clean.slice(0, 10);
};
