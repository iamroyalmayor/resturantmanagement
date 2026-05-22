import { appConfig } from '../config/app';

export const CURRENCY_SYMBOL = appConfig.currencySymbol;
export const CURRENCY_CODE = appConfig.currencyCode;

export const formatCurrency = (amount: number): string => {
  return `${CURRENCY_SYMBOL}${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const parseCurrency = (currencyString: string): number => {
  return parseFloat(currencyString.replace(CURRENCY_SYMBOL, '').replace(/,/g, ''));
};
