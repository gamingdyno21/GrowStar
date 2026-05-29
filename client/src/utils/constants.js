export const TRANSACTION_TYPES = ['Income', 'Expense', 'Investment', 'Transfer'];

export const TRANSACTION_CATEGORIES = [
  'Salary',
  'Dividends',
  'Interests',
  'Rent',
  'Utilities',
  'Food',
  'Shopping',
  'Travel',
  'Medical',
  'Taxes',
  'Stocks',
  'Bonds',
  'Mutual Funds',
  'Gold',
  'Savings Account',
  'Self Transfer',
  'Other',
];

export const ACCOUNT_STATUSES = ['Pending', 'Approved', 'Rejected'];

export const REGEX_PATTERNS = {
  PAN: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
  AADHAAR: /^\d{12}$/,
  PHONE: /^\d{10}$/,
};
