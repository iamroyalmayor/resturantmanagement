export const appConfig = {
  appName: import.meta.env.VITE_APP_NAME || 'RestaurantOS',
  companyName: import.meta.env.VITE_COMPANY_NAME || 'Quant Technologies Ltd',
  companyEmail: import.meta.env.VITE_COMPANY_EMAIL || 'support@quanttechnologiesltd.cloud',
  supportEmail: import.meta.env.VITE_SUPPORT_EMAIL || 'admin@restaurantos.com',
  whatsappNumber: import.meta.env.VITE_WHATSAPP_NUMBER || '2347037261277',
  domain: import.meta.env.VITE_DOMAIN || 'http://localhost:5173',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  enableMockData: import.meta.env.VITE_ENABLE_MOCK_DATA !== 'false',
  currencySymbol: import.meta.env.VITE_CURRENCY_SYMBOL || '#',
  currencyCode: import.meta.env.VITE_CURRENCY_CODE || 'NGN',
  taxRate: parseFloat(import.meta.env.VITE_TAX_RATE || '0.085'),
  serviceCharge: parseFloat(import.meta.env.VITE_SERVICE_CHARGE || '0.18'),
  defaultTimezone: import.meta.env.VITE_DEFAULT_TIMEZONE || 'UTC+1',
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
} as const;

export type AppConfig = typeof appConfig;
