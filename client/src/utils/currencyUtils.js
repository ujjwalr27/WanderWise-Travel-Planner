const currencies = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' }
];

export const getSupportedCurrencies = () => currencies;

export const formatCurrency = (amount, currencyCode = 'USD') => {
  const currency = currencies.find(c => c.code === currencyCode) || currencies[0];
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const getCurrencySymbol = (currencyCode = 'USD') => {
  const currency = currencies.find(c => c.code === currencyCode);
  return currency ? currency.symbol : '$';
};

export const parseCurrency = (value) => {
  if (!value) return 0;
  return parseFloat(value.replace(/[^0-9.-]+/g, ''));
};

export const calculateTotalCost = (activities) => {
  if (!activities || !Array.isArray(activities)) return 0;
  
  return activities.reduce((total, activity) => {
    if (activity.cost?.amount) {
      return total + activity.cost.amount;
    }
    return total;
  }, 0);
}; 