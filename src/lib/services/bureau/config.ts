export const BUREAU_CONFIG = {
  activeProvider: process.env.BUREAU_PROVIDER || 'moffin',
  baseUrl: process.env.BUREAU_BASE_URL || 'https://api.bureau.com',
  apiKey: process.env.BUREAU_API_KEY,
  moffin: {
    apiUrl: process.env.MOFFIN_API_URL || 'https://api.moffin.com',
    apiToken: process.env.MOFFIN_API_TOKEN
  },
  kiban: {
    apiUrl: process.env.KIBAN_API_URL || 'https://api.kiban.com',
    apiToken: process.env.KIBAN_API_TOKEN
  }
} as const; 