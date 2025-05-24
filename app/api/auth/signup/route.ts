import { NextResponse } from 'next/server'
import { hashPassword } from '@/lib/auth'
import { PrismaClient } from '@/app/generated/prisma'

const prisma = new PrismaClient()

export async function POST(req: Request) {
  try {
    console.log('Incoming request:', req)

    const body = await req.json()
    console.log('Parsed body:', body)

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

    console.log('Variables:', {
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

    const existing = await prisma.user.findUnique({ where: { email } })
    console.log('Existing user:', existing)
    if (existing) {
      const res = NextResponse.json({ message: 'User already exists' }, { status: 400 })
      console.log('Response:', res)
      return res
    }

    const passwordHash = await hashPassword(password)
    console.log('Password hash:', passwordHash)

    const user = await prisma.user.create({
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
    console.log('Created user:', user)

    const response = NextResponse.json({ message: 'User created', userId: user.id }, { status: 201 })
    console.log('Final response:', response)
    return response
  } catch (err) {
    console.error('Error in POST /api/auth/signup:', err)
    return NextResponse.json({ message: 'Internal Server Error', error: String(err) }, { status: 500 })
  }
}
