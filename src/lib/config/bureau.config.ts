export const BUREAU_CONFIG = {
  activeProvider: process.env.BUREAU_PROVIDER || 'kiban', // 'kiban' | 'moffin'
  moffin: {
    apiUrl: 'https://app.moffin.mx/api/v1',
    apiToken: process.env.MOFFIN_API_TOKEN
  }
}; 