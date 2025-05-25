import { NextResponse } from 'next/server'
import { hashPassword } from '@/lib/auth'
import { PrismaClient } from '@/app/generated/prisma'
import { logger } from '@/lib/logger'

const prisma = new PrismaClient()

export async function POST(req: Request) {
  try {
    logger(req, '[SIGNUP] Incoming request:', req)

    const body = await req.json()
    logger(req, '[SIGNUP] Parsed body:', body)

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
    } = body

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
        providerType: userType === 'provider' ? providerType : null,
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
