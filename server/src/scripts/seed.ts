import bcrypt from 'bcrypt'
import { connectDatabase, disconnectDatabase } from '../config/db.js'
import { Category, User } from '../models/index.js'

try {
  await connectDatabase()
  await Category.init()
  for (const name of ['Electrical', 'Plumbing', 'HVAC', 'Furniture', 'General Maintenance']) {
    await Category.updateOne({ name }, { $setOnInsert: { name } }, { upsert: true })
  }
  console.log('Categories seeded successfully.')

  // registration only creates normal users, so the first admin has to come from here
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const adminPassword = process.env.ADMIN_PASSWORD
  if (adminEmail && adminPassword) {
    const existing = await User.findOne({ email: adminEmail }).select('role')
    if (!existing) {
      await User.create({
        name: process.env.ADMIN_NAME ?? 'Admin',
        email: adminEmail,
        passwordHash: await bcrypt.hash(adminPassword, 12),
        role: 'admin'
      })
      console.log(`Admin account created for ${adminEmail}.`)
    } else if (existing.role !== 'admin') {
      await User.updateOne({ _id: existing._id }, { role: 'admin' })
      console.log(`${adminEmail} promoted to admin.`)
    } else {
      console.log('Admin account already exists.')
    }
  }
} catch {
  console.error('Seed failed. Check MongoDB connectivity and configuration.')
  process.exitCode = 1
} finally {
  await disconnectDatabase()
}
