import 'dotenv/config'

const required = ['MONGODB_URI', 'JWT_SECRET'] as const
for (const key of required) if (!process.env[key]) console.warn(`Missing environment variable: ${key}`)

export const env = {
  port: Number(process.env.PORT ?? 3000),
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  mongodbUri: process.env.MONGODB_URI ?? '',
  jwtSecret: process.env.JWT_SECRET ?? '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1h'
}
