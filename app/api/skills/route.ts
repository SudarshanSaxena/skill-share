import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { PrismaClient } from '@/app/generated/prisma'
import { logger } from '@/lib/logger'
import { z } from 'zod' // <-- Add this import

const prisma = new PrismaClient()

// Define Zod schema for skill creation payload
const skillCreateSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  experience: z.number().int().min(0, 'Experience must be a non-negative integer'),
  natureOfWork: z.enum(['online', 'onsite'], { required_error: 'Nature of work is required' }),
  hourlyRate: z.number().min(0, 'Hourly rate must be a non-negative number'),
})

export async function GET(req: Request) {
  logger(req, '[SKILL_GET] Incoming request:', req)
  const user = await getUserFromRequest(req)
  logger(req, '[SKILL_GET] User from request:', user)

  if (!user || user.role !== 'provider') {
    const unauthorizedResponse = NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    logger(req, '[SKILL_GET] Unauthorized response:', unauthorizedResponse)
    return unauthorizedResponse
  }

  try {
    const skills = await prisma.skill.findMany({
      where: { providerId: user.id },
    })
    logger(req, '[SKILL_GET] Skills from DB:', skills)

    const skillsResponse = NextResponse.json({ skills })
    logger(req, '[SKILL_GET] Success response:', skillsResponse)
    return skillsResponse
  } catch (err) {
    logger(req, '[SKILL_GET] Error fetching skills:', err)
    const errorResponse = NextResponse.json({ message: 'Failed to fetch skills' }, { status: 500 })
    logger(req, '[SKILL_GET] Error response:', errorResponse)
    return errorResponse
  }
}

export async function POST(req: NextRequest) {
  logger(req, '[SKILL_CREATE] Incoming request:', req)
  const user = await getUserFromRequest(req)
  logger(req, '[SKILL_CREATE] User from request:', user)

  if (!user || user.role !== 'provider') {
    const unauthorizedResponse = NextResponse.json({ message: 'Unauthorized' }, { status: 403 })
    logger(req, '[SKILL_CREATE] Unauthorized response:', unauthorizedResponse)
    return unauthorizedResponse
  }

  try {
    const body = await req.json()
    logger(req, '[SKILL_CREATE] Parsed body:', body)

    // Validate request body using Zod
    const result = skillCreateSchema.safeParse(body)
    if (!result.success) {
      const validationErrorResponse = NextResponse.json(
        { message: 'Validation Error', errors: result.error.flatten().fieldErrors },
        { status: 400 }
      )
      logger(req, '[SKILL_CREATE] Validation error response:', validationErrorResponse)
      return validationErrorResponse
    }

    const { category, experience, natureOfWork, hourlyRate } = result.data
    logger(req, '[SKILL_CREATE] Variables:', { category, experience, natureOfWork, hourlyRate })

    const skill = await prisma.skill.create({
      data: {
        providerId: user.id,
        category,
        experience,
        natureOfWork,
        hourlyRate,
      },
    })
    logger(req, '[SKILL_CREATE] Created skill:', skill)

    const skillCreatedResponse = NextResponse.json(skill, { status: 201 })
    logger(req, '[SKILL_CREATE] Success response:', skillCreatedResponse)
    return skillCreatedResponse
  } catch (err) {
    logger(req, '[SKILL_CREATE] Error creating skill:', err)
    const errorResponse = NextResponse.json({ message: 'Failed to create skill', error: String(err) }, { status: 500 })
    logger(req, '[SKILL_CREATE] Error response:', errorResponse)
    return errorResponse
  }
}
