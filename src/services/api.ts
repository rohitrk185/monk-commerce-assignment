// src/services/api.ts
import axios from 'axios'
import type { ApiProduct } from '../types'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'https://stageapi.monkcommerce.app/task/products'
const API_KEY = import.meta.env.VITE_MONK_API_KEY

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'x-api-key': API_KEY,
  },
})

if (!API_KEY) {
  console.warn(
    'API Key not found. Please set VITE_MONK_API_KEY in your .env file.'
  )
}

export const fetchProducts = async (
  searchTerm: string = '',
  page: number = 1,
  limit: number = 10
): Promise<ApiProduct[]> => {
  if (!API_KEY) {
    console.error('API Key is missing.')
    return []
  }
  try {
    const response = await apiClient.get<ApiProduct[]>('/search', {
      params: {
        search: searchTerm,
        page: page,
        limit: limit,
      },
    })
    // Assign a temporary localId based on API IDs for initial tracking
    return response.data.map((product) => ({
      ...product,
      variants: product.variants.map((variant) => ({
        ...variant,
        localId: `${product.id}-${variant.id}`, // Create local ID
      })),
    }))
  } catch (error) {
    console.error('Error fetching products:', error)
    // Improve error handling (e.g., throw error, return specific error object)
    return []
  }
}
