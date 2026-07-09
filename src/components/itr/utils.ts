import { ENV } from '@/conf'

export const getItrTaxCalculation = async (acc_id: string) => {
  const response = await fetch(
    `${ENV.VITE_BACKEND_BASE_URL}/accounts/r1xcrm-tax-calculation/${acc_id}`,
    { credentials: 'include' },
  )
  if (!response.ok) {
    throw new Error('Failed to fetch date range')
  }
  const data = await response.json()
  return data.data
}

export const getItrBalanceSheet = async (acc_id: string) => {
  const response = await fetch(
    `${ENV.VITE_BACKEND_BASE_URL}/accounts/r1xcrm-balance_sheet/${acc_id}`,
    { credentials: 'include' },
  )
  if (!response.ok) {
    throw new Error('Failed to fetch date range')
  }
  const data = await response.json()
  return data.data
}

export const getItrProfitAndLoss = async (acc_id: string) => {
  const response = await fetch(
    `${ENV.VITE_BACKEND_BASE_URL}/accounts/r1xcrm-profit-and-loss-statement/${acc_id}`,
    { credentials: 'include' },
  )
  if (!response.ok) {
    throw new Error('Failed to fetch date range')
  }
  const data = await response.json()
  return data.data
}

export const getItrRatioAnalysis = async (acc_id: string) => {
  const response = await fetch(
    `${ENV.VITE_BACKEND_BASE_URL}/accounts/r1xcrm-ratio-analysis/${acc_id}`,
    { credentials: 'include' },
  )
  if (!response.ok) {
    throw new Error('Failed to fetch date range')
  }
  const data = await response.json()
  return data.data
}
