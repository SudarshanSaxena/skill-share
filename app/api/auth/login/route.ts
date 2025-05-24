import { NextResponse } from 'next/server'
import { comparePassword, generateToken } from '@/lib/auth'
import { PrismaClient } from '@/app/generated/prisma'
import { serialize } from 'cookie'

const prisma = new PrismaClient()

export async function POST(req: Request) {
  try {
    console.log('Incoming request:', req)

    const body = await req.json()
    console.log('Parsed body:', body)

    const { email, password } = body
    console.log('Email:', email)
    console.log('Password:', password)

    const user = await prisma.user.findUnique({ where: { email } })
    console.log('User from DB:', user)

    if (!user) {
      const res = NextResponse.json({ message: 'Invalid credentials' }, { status: 401 })
      console.log('Response:', res)
      return res
    }

    const valid = await comparePassword(password, user.passwordHash)
    console.log('Password valid:', valid)

    if (!valid) {
      const res = NextResponse.json({ message: 'Invalid credentials' }, { status: 401 })
      console.log('Response:', res)
      return res
    }

    const token = generateToken(user)
    console.log('Generated token:', token)

    // Create cookie with JWT token
    const cookie = serialize('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
      sameSite: 'lax',
    })
    console.log('Serialized cookie:', cookie)

    const response = NextResponse.json({ message: 'Login successful' }, { status: 200 })
    response.headers.set('Set-Cookie', cookie)
    console.log('Final response:', response)

    return response
  } catch (err) {
    console.error('Error in POST /api/auth/login:', err)
    return NextResponse.json({ message: 'Internal Server Error', error: String(err) }, { status: 500 })
  }
}
