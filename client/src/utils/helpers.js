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

export const getProfileCompletionProgress = (user) => {
  if (!user) return 0;
  if (user.profileCompleted) return 100;
  
  // Calculate completion percentage based on the required fields
  const fields = [
    { name: 'Profile Photo', value: user.profilePic, weight: 20 },
    { name: 'Full Name', value: user.fullName, weight: 15 },
    { name: 'Email Address', value: user.email, weight: 15 },
    { name: 'Mobile Number', value: user.phone || user.phoneNumber, weight: 15 },
    { name: 'Residential Address', value: user.address, weight: 15 },
    { name: 'Date of Birth', value: user.dob, weight: 20 }
  ];

  let total = 0;
  fields.forEach(f => {
    if (f.value && String(f.value).trim() !== '') {
      total += f.weight;
    }
  });

  return total;
};
