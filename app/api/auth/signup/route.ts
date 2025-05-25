import { NextResponse } from 'next/server'
import { hashPassword } from '@/lib/auth'
import { PrismaClient } from '@/app/generated/prisma'
import { logger } from '@/lib/logger'
import { z } from 'zod' // <-- Add this import

const prisma = new PrismaClient()

// Define Zod schema for signup payload
const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  userType: z.enum(['user', 'provider']),
  providerType: z.string().optional().nullable(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  companyName: z.string().optional().nullable(),
  phoneNumber: z.string().optional().nullable(),
  businessTaxNumber: z.string().optional().nullable(),
  mobile: z.string().optional().nullable(),
  streetNumber: z.string().optional().nullable(),
  streetName: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
})

export async function POST(req: Request) {
  try {
    logger(req, '[SIGNUP] Incoming request:', req)

    const body = await req.json()
    logger(req, '[SIGNUP] Parsed body:', body)

    // Validate request body using Zod
    const result = signupSchema.safeParse(body)
    if (!result.success) {
      const validationErrorResponse = NextResponse.json(
        { message: 'Validation Error', errors: result.error.flatten().fieldErrors },
        { status: 400 }
      )
      logger(req, '[SIGNUP] Validation error response:', validationErrorResponse)
      return validationErrorResponse
    }

    const {
      email,
      password,
      userType,
      providerType,
      firstName,
      lastName,
      companyName,
      phoneNumber,
      businessTaxNumber,
      mobile,
      streetNumber,
      streetName,
      city,
      state,
      postalCode,
    } = result.data

    logger(req, '[SIGNUP] Variables:', {
      email,
      password,
      userType,
      providerType,
      firstName,
      lastName,
      companyName,
      phoneNumber,
      businessTaxNumber,
      mobile,
      streetNumber,
      streetName,
      city,
      state,
      postalCode,
    })

    const existingUser = await prisma.user.findUnique({ where: { email } })
    logger(req, '[SIGNUP] Existing user:', existingUser)
    if (existingUser) {
      const userExistsResponse = NextResponse.json({ message: 'User already exists' }, { status: 400 })
      logger(req, '[SIGNUP] User exists response:', userExistsResponse)
      return userExistsResponse
    }

    const passwordHash = await hashPassword(password)
    logger(req, '[SIGNUP] Password hash:', passwordHash)

    const createdUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        userType,
        providerType: userType === 'provider' ? (providerType as any as import('@/app/generated/prisma').ProviderType) : null,
        firstName,
        lastName,
        companyName: userType === 'provider' && providerType === 'company' ? companyName : null,
        phoneNumber: userType === 'provider' && providerType === 'company' ? phoneNumber : null,
        businessTaxNumber: userType === 'provider' && providerType === 'company' ? businessTaxNumber : null,
        mobile,
        streetNumber,
        streetName,
        city,
        state,
        postalCode,
      },
    })
    logger(req, '[SIGNUP] Created user:', createdUser)

    const signupSuccessResponse = NextResponse.json({ message: 'User created', userId: createdUser.id }, { status: 201 })
    logger(req, '[SIGNUP] Success response:', signupSuccessResponse)
    return signupSuccessResponse
  } catch (err) {
    logger(req, '[SIGNUP] Error in POST /api/auth/signup:', err)
    const errorResponse = NextResponse.json({ message: 'Internal Server Error', error: String(err) }, { status: 500 })
    logger(req, '[SIGNUP] Error response:', errorResponse)
    return errorResponse
  }
}
