import mongoose from 'mongoose'
import { env } from './env.js'

export async function connectDatabase() {
  if (!env.mongodbUri) throw new Error('MONGODB_URI is required')
  await mongoose.connect(env.mongodbUri, { serverSelectionTimeoutMS: 5000 })
}

export async function disconnectDatabase() {
  await mongoose.disconnect()
}
