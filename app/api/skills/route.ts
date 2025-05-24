import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { PrismaClient } from '@/app/generated/prisma'

const prisma = new PrismaClient()

export async function GET(req: Request) {
  console.log('[SKILL_GET] Incoming request:', req)
  const user = await getUserFromRequest(req)
  console.log('[SKILL_GET] User from request:', user)

  if (!user || user.role !== 'provider') {
    const unauthorizedResponse = NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    console.log('[SKILL_GET] Unauthorized response:', unauthorizedResponse)
    return unauthorizedResponse
  }

  try {
    const skills = await prisma.skill.findMany({
      where: { providerId: user.id },
    })
    console.log('[SKILL_GET] Skills from DB:', skills)

    const skillsResponse = NextResponse.json({ skills })
    console.log('[SKILL_GET] Success response:', skillsResponse)
    return skillsResponse
  } catch (err) {
    console.error('[SKILL_GET] Error fetching skills:', err)
    const errorResponse = NextResponse.json({ message: 'Failed to fetch skills' }, { status: 500 })
    console.log('[SKILL_GET] Error response:', errorResponse)
    return errorResponse
  }
}

export async function POST(req: NextRequest) {
  console.log('[SKILL_CREATE] Incoming request:', req)
  const user = await getUserFromRequest(req)
  console.log('[SKILL_CREATE] User from request:', user)

  if (!user || user.role !== 'provider') {
    const unauthorizedResponse = NextResponse.json({ message: 'Unauthorized' }, { status: 403 })
    console.log('[SKILL_CREATE] Unauthorized response:', unauthorizedResponse)
    return unauthorizedResponse
  }

  try {
    const body = await req.json()
    console.log('[SKILL_CREATE] Parsed body:', body)
    const { category, experience, natureOfWork, hourlyRate } = body
    console.log('[SKILL_CREATE] Variables:', { category, experience, natureOfWork, hourlyRate })

    const skill = await prisma.skill.create({
      data: {
        providerId: user.id,
        category,
        experience,
        natureOfWork,
        hourlyRate: parseFloat(hourlyRate),
      },
    })
    console.log('[SKILL_CREATE] Created skill:', skill)

    const skillCreatedResponse = NextResponse.json(skill, { status: 201 })
    console.log('[SKILL_CREATE] Success response:', skillCreatedResponse)
    return skillCreatedResponse
  } catch (err) {
    console.error('[SKILL_CREATE] Error creating skill:', err)
    const errorResponse = NextResponse.json({ message: 'Failed to create skill', error: String(err) }, { status: 500 })
    console.log('[SKILL_CREATE] Error response:', errorResponse)
    return errorResponse
  }
}
