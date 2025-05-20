// lib/auth.ts
import { parse } from 'cookie'
import { User } from '@/app/generated/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key' // store in .env in real app

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10)
}

export async function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

export function generateToken(user: User) {
  const payload = { id: user.id, email: user.email, role: user.userType }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}



export async function getUserFromRequest(req: Request) {
  const cookieHeader = req.headers.get('cookie')
  if (!cookieHeader) return null

  const cookies = parse(cookieHeader)
  const token = cookies.token
  if (!token) return null

  try {
    const payload = jwt.verify(token, JWT_SECRET) as any
    return payload
  } catch {
    return null
  }
}
