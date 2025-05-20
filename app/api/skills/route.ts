import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { PrismaClient } from '@/app/generated/prisma'

const prisma = new PrismaClient()

export async function GET(req: Request) {
  const user = await getUserFromRequest(req)

  if (!user || user.role !== 'provider') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const skills = await prisma.skill.findMany({
      where: { providerId: user.id },
    })

    return NextResponse.json({ skills })
  } catch (err) {
    return NextResponse.json({ message: 'Failed to fetch skills' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  console.log('User from request:', user)

  if (!user || user.role !== 'provider') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { category, experience, natureOfWork, hourlyRate } = body

    const skill = await prisma.skill.create({
      data: {
        providerId: user.id,
        category,
        experience,
        natureOfWork,
        hourlyRate: parseFloat(hourlyRate),
      },
    })

    return NextResponse.json(skill, { status: 201 })
  } catch (err) {
    return NextResponse.json({ message: 'Failed to create skill', error: String(err) }, { status: 500 })
  }
}
