// app/api/skills/[id]/route.ts

import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { PrismaClient } from '@/app/generated/prisma'
import { logger } from '@/lib/logger'

const prisma = new PrismaClient()

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  logger(req, '[SKILL_UPDATE] Incoming request:', req)
  logger(req, '[SKILL_UPDATE] Params:', params)

  const user = await getUserFromRequest(req)
  logger(req, '[SKILL_UPDATE] User from request:', user)

  if (!user || user.role !== 'provider') {
    const unauthorizedResponse = NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    logger(req, '[SKILL_UPDATE] Unauthorized response:', unauthorizedResponse)
    return unauthorizedResponse
  }

  const skillId = params.id
  logger(req, '[SKILL_UPDATE] Skill ID:', skillId)

  try {
    const skill = await prisma.skill.findUnique({ where: { id: skillId } })
    logger(req, '[SKILL_UPDATE] Skill from DB:', skill)

    if (!skill || skill.providerId !== user.id) {
      const notFoundResponse = NextResponse.json({ message: 'Skill not found or access denied' }, { status: 404 })
      logger(req, '[SKILL_UPDATE] Not found or access denied response:', notFoundResponse)
      return notFoundResponse
    }

    const body = await req.json()
    logger(req, '[SKILL_UPDATE] Parsed body:', body)
    const { category, experience, natureOfWork, hourlyRate } = body
    logger(req, '[SKILL_UPDATE] Variables:', { category, experience, natureOfWork, hourlyRate })

    const updatedSkill = await prisma.skill.update({
      where: { id: skillId },
      data: {
        category,
        experience,
        natureOfWork,
        hourlyRate,
      },
    })
    logger(req, '[SKILL_UPDATE] Updated skill:', updatedSkill)

    const successResponse = NextResponse.json({ message: 'Skill updated', skill: updatedSkill })
    logger(req, '[SKILL_UPDATE] Success response:', successResponse)
    return successResponse
  } catch (err) {
    logger(req, '[SKILL_UPDATE] Error updating skill:', err)
    const errorResponse = NextResponse.json({ message: 'Failed to update skill' }, { status: 500 })
    logger(req, '[SKILL_UPDATE] Error response:', errorResponse)
    return errorResponse
  }
}
