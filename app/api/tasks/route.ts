import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '../../../lib/auth'
import { PrismaClient } from '@/app/generated/prisma'
import { logger } from '@/lib/logger'
import { z } from 'zod' // <-- Add this import

const prisma = new PrismaClient()

// Define Zod schema for task creation payload
const taskCreateSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  expectedStartDate: z.string().optional().nullable(),
  expectedWorkingHours: z.number().int().optional().nullable(),
  hourlyRate: z.preprocess((val) => typeof val === 'string' ? parseFloat(val) : val, z.number({ invalid_type_error: 'Hourly rate must be a number' })),
  currency: z.string().min(1, 'Currency is required'),
})

export async function GET(req: NextRequest) {
  logger(req, '[TASK_GET] Incoming request:', req)
  const user = await getUserFromRequest(req)
  logger(req, '[TASK_GET] User from request:', user)
  if (!user) {
    const unauthorizedResponse = NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    logger(req, '[TASK_GET] Unauthorized response:', unauthorizedResponse)
    return unauthorizedResponse
  }

  try {
    const tasks = await prisma.task.findMany({
      // where: {
      //   userId: user.id,
      // },
      orderBy: { createdAt: 'desc' },
    })
    logger(req, '[TASK_GET] Tasks from DB:', tasks)
    const tasksResponse = NextResponse.json(tasks)
    logger(req, '[TASK_GET] Success response:', tasksResponse)
    return tasksResponse
  } catch (error) {
    logger(req, '[TASK_GET] Error fetching tasks:', error)
    const errorResponse = NextResponse.json({ message: 'Error fetching tasks' }, { status: 500 })
    logger(req, '[TASK_GET] Error response:', errorResponse)
    return errorResponse
  }
}

export async function POST(req: NextRequest) {
  logger(req, '[TASK_CREATE] Incoming request:', req)
  const user = await getUserFromRequest(req)
  logger(req, '[TASK_CREATE] User from request:', user)
  if (!user) {
    const unauthorizedResponse = NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    logger(req, '[TASK_CREATE] Unauthorized response:', unauthorizedResponse)
    return unauthorizedResponse
  }

  try {
    const body = await req.json()
    logger(req, '[TASK_CREATE] Parsed body:', body)

    // Validate request body using Zod
    const result = taskCreateSchema.safeParse(body)
    if (!result.success) {
      const validationErrorResponse = NextResponse.json(
        { message: 'Validation Error', errors: result.error.flatten().fieldErrors },
        { status: 400 }
      )
      logger(req, '[TASK_CREATE] Validation error response:', validationErrorResponse)
      return validationErrorResponse
    }

    const { category, name, description, expectedStartDate, expectedWorkingHours, hourlyRate, currency } = result.data
    logger(req, '[TASK_CREATE] Variables:', { category, name, description, expectedStartDate, expectedWorkingHours, hourlyRate, currency })

    const task = await prisma.task.create({
      data: {
        userId: user.id,
        category,
        name,
        description,
        expectedStartDate: expectedStartDate ? new Date(expectedStartDate) : null,
        expectedWorkingHours,
        hourlyRate,
        currency,
        status: 'open',
      },
    })
    logger(req, '[TASK_CREATE] Created task:', task)

    const taskCreatedResponse = NextResponse.json(task, { status: 201 })
    logger(req, '[TASK_CREATE] Success response:', taskCreatedResponse)
    return taskCreatedResponse
  } catch (error) {
    logger(req, '[TASK_CREATE] Error creating task:', error)
    const errorResponse = NextResponse.json({ message: 'Error creating task' }, { status: 500 })
    logger(req, '[TASK_CREATE] Error response:', errorResponse)
    return errorResponse
  }
}
