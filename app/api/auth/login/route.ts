import { NextResponse } from 'next/server'
import { comparePassword, generateToken } from '@/lib/auth'
import { PrismaClient } from '@/app/generated/prisma'
import { serialize } from 'cookie'

const prisma = new PrismaClient()

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password } = body

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 })
    }

    const valid = await comparePassword(password, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 })
    }

    const token = generateToken(user)

    // Create cookie with JWT token
    const cookie = serialize('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
      sameSite: 'lax',
    })

    const response = NextResponse.json({ message: 'Login successful' }, { status: 200 })
    response.headers.set('Set-Cookie', cookie)

    return response
  } catch (err) {
    return NextResponse.json({ message: 'Internal Server Error', error: String(err) }, { status: 500 })
  }
}
