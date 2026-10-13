import axios from 'axios'
import { store } from '../app/store'

export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api' })

api.interceptors.request.use((config) => {
  const token = store.getState().auth.token
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  return config
})
