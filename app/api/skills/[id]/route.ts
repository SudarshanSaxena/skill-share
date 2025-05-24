// app/api/skills/[id]/route.ts

import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { PrismaClient } from '@/app/generated/prisma'

const prisma = new PrismaClient()

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  console.log('[SKILL_UPDATE] Incoming request:', req)
  console.log('[SKILL_UPDATE] Params:', params)

  const user = await getUserFromRequest(req)
  console.log('[SKILL_UPDATE] User from request:', user)

  if (!user || user.role !== 'provider') {
    const unauthorizedResponse = NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    console.log('[SKILL_UPDATE] Unauthorized response:', unauthorizedResponse)
    return unauthorizedResponse
  }

  const skillId = params.id
  console.log('[SKILL_UPDATE] Skill ID:', skillId)

  try {
    const skill = await prisma.skill.findUnique({ where: { id: skillId } })
    console.log('[SKILL_UPDATE] Skill from DB:', skill)

    if (!skill || skill.providerId !== user.id) {
      const notFoundResponse = NextResponse.json({ message: 'Skill not found or access denied' }, { status: 404 })
      console.log('[SKILL_UPDATE] Not found or access denied response:', notFoundResponse)
      return notFoundResponse
    }

    const body = await req.json()
    console.log('[SKILL_UPDATE] Parsed body:', body)
    const { category, experience, natureOfWork, hourlyRate } = body
    console.log('[SKILL_UPDATE] Variables:', { category, experience, natureOfWork, hourlyRate })

    const updatedSkill = await prisma.skill.update({
      where: { id: skillId },
      data: {
        category,
        experience,
        natureOfWork,
        hourlyRate,
      },
    })
    console.log('[SKILL_UPDATE] Updated skill:', updatedSkill)

    const successResponse = NextResponse.json({ message: 'Skill updated', skill: updatedSkill })
    console.log('[SKILL_UPDATE] Success response:', successResponse)
    return successResponse
  } catch (err) {
    console.error('[SKILL_UPDATE] Error updating skill:', err)
    const errorResponse = NextResponse.json({ message: 'Failed to update skill' }, { status: 500 })
    console.log('[SKILL_UPDATE] Error response:', errorResponse)
    return errorResponse
  }
}
