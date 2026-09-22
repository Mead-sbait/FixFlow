import bcrypt from 'bcrypt'
import { User } from '../models/index.js'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

type RegisterInput = {
  name: string
  email: string
  password: string
}

export async function registerUser(input: RegisterInput) {
  const passwordHash = await bcrypt.hash(input.password, 12)

  const user = await User.create({
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    passwordHash,
    role: 'user',
  })

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
  }
}

type LoginInput = {
  email: string
  password: string
}

export async function loginUser(input: LoginInput) {
  const email = input.email.trim().toLowerCase()

  const user = await User.findOne({ email }).select('+passwordHash')

  if (!user) {
    throw new Error('Invalid email or password')
  }

  const passwordMatches = await bcrypt.compare(
    input.password,
    user.passwordHash
  )

  if (!passwordMatches) {
    throw new Error('Invalid email or password')
  }
  const accessToken = jwt.sign(
    { role: user.role },
    env.jwtSecret,
    {
      subject: user._id.toString(),
      expiresIn: '1h',
      algorithm: 'HS256',
    }
  )

  return {
    accessToken,
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    },
  }
 
}