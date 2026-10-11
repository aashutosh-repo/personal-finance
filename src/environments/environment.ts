export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080',
  apiEndpoints: {
    auth: '/api/v1/auth',
    user: '/api/v1/auth/user',
    transactions: '/api/v2/transactions',
    income: '/api/v1/income',
    budgets: '/api/v1/budgets',
    analytics: '/api/v1/analytics',
    payments: '/api/payments',
    chatbot: '/api/bot',
    aiResearch: '/api/ai',
    stocks: '/api/stocks',
    stockSyncJobs: '/api/stocks/sync-jobs',
    stockAnalysis: '/api/v1/stocks'
  }
};
