import { connectDatabase, disconnectDatabase } from '../config/db.js'
import { Category } from '../models/index.js'

try {
  await connectDatabase()
  await Category.init()
  for (const name of ['Electrical', 'Plumbing', 'HVAC', 'Furniture', 'General Maintenance']) {
    await Category.updateOne({ name }, { $setOnInsert: { name } }, { upsert: true })
  }
  console.log('Categories seeded successfully.')
} catch {
  console.error('Category seed failed. Check MongoDB connectivity and configuration.')
  process.exitCode = 1
} finally {
  await disconnectDatabase()
}
