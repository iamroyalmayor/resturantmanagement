// Currency configuration
export const CURRENCY_SYMBOL = '#';
export const CURRENCY_CODE = 'NGN'; // Nigerian Naira or your preferred currency

// Currency formatting utilities
export const formatCurrency = (amount: number): string => {
  return `${CURRENCY_SYMBOL}${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const parseCurrency = (currencyString: string): number => {
  return parseFloat(currencyString.replace(CURRENCY_SYMBOL, '').replace(/,/g, ''));
};