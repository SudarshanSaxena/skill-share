import { NextResponse } from 'next/server'
import { hashPassword } from '@/lib/auth'
import { PrismaClient } from '@/app/generated/prisma'

const prisma = new PrismaClient()

export async function POST(req: Request) {
  try {
    const body = await req.json()

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

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ message: 'User already exists' }, { status: 400 })
    }

    const passwordHash = await hashPassword(password)

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

    return NextResponse.json({ message: 'User created', userId: user.id }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ message: 'Internal Server Error', error: String(err) }, { status: 500 })
  }
}
