import { NextResponse } from 'next/server'
import { comparePassword, generateToken } from '@/lib/auth'
import { serialize } from 'cookie'
import { logger } from '@/lib/logger'
import { z } from 'zod' // <-- Add this import
import { prisma } from '@/lib/prisma'


// Define Zod schema for login payload
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
})

export async function POST(req: Request) {
  try {
    logger(req, '[LOGIN]-Request:', req)

    const body = await req.json()
    logger(req, '[LOGIN]-Parsed body:', body)

    // Validate request body using Zod
    const result = loginSchema.safeParse(body)
    if (!result.success) {
      const validationErrorResponse = NextResponse.json(
        { message: 'Validation Error', errors: result.error.flatten().fieldErrors },
        { status: 400 }
      )
      logger(req, '[LOGIN]-Validation error response:', validationErrorResponse)
      return validationErrorResponse
    }
    const { email, password } = result.data
    logger(req, '[LOGIN]-Variables:', { email, password })

    const user = await prisma.user.findUnique({ where: { email } })
    logger(req, '[LOGIN]-User from DB:', user)
    if (!user) {
      const invalidUserResponse = NextResponse.json({ message: 'Invalid credentials' }, { status: 401 })
      logger(req, '[LOGIN]-Invalid user response:', invalidUserResponse)
      return invalidUserResponse
    }

    const valid = await comparePassword(password, user.passwordHash)
    logger(req, '[LOGIN]-Password valid:', valid)
    if (!valid) {
      const invalidPasswordResponse = NextResponse.json({ message: 'Invalid credentials' }, { status: 401 })
      logger(req, '[LOGIN]-Invalid password response:', invalidPasswordResponse)
      return invalidPasswordResponse
    }

    const token = generateToken(user)
    logger(req, '[LOGIN]-Generated token:', token)
    const cookie = serialize('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
      sameSite: 'lax',
    })
    logger(req, '[LOGIN]-Serialized cookie:', cookie)

    const loginSuccessResponse = NextResponse.json({ message: 'Login successful' }, { status: 200 })
    loginSuccessResponse.headers.set('Set-Cookie', cookie)
    logger(req, '[LOGIN]-Success response:', loginSuccessResponse)
    return loginSuccessResponse
  } catch (err: any) {
    if (err.status && err.errors) {
      const validationErrorResponse = NextResponse.json({ message: 'Validation Error', errors: err.errors }, { status: err.status })
      logger(req, '[LOGIN]-Validation error response:', validationErrorResponse)
      return validationErrorResponse
    }
    logger(req, '[LOGIN]-Internal server error:', err)
    const internalErrorResponse = NextResponse.json({ message: 'Internal Server Error', error: String(err) }, { status: 500 })
    logger(req, '[LOGIN]-Error response:', internalErrorResponse)
    return internalErrorResponse
  }
}
