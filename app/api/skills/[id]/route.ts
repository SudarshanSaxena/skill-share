// app/api/skills/[id]/route.ts

import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { PrismaClient } from '@/app/generated/prisma'

const prisma = new PrismaClient()

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const user = await getUserFromRequest(req)

  if (!user || user.role !== 'provider') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const skillId = params.id

  try {
    const skill = await prisma.skill.findUnique({ where: { id: skillId } })

    if (!skill || skill.providerId !== user.id) {
      return NextResponse.json({ message: 'Skill not found or access denied' }, { status: 404 })
    }

    const body = await req.json()
    const { category, experience, natureOfWork, hourlyRate } = body

    const updatedSkill = await prisma.skill.update({
      where: { id: skillId },
      data: {
        category,
        experience,
        natureOfWork,
        hourlyRate,
      },
    })

    return NextResponse.json({ message: 'Skill updated', skill: updatedSkill })
  } catch (err) {
    return NextResponse.json({ message: 'Failed to update skill' }, { status: 500 })
  }
}
