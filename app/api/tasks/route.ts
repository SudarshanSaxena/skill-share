import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '../../../lib/auth'
import { PrismaClient } from '@/app/generated/prisma'
import { logger } from '@/lib/logger'

const prisma = new PrismaClient()

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
    const { category, name, description, expectedStartDate, expectedWorkingHours, hourlyRate, currency } = body
    logger(req, '[TASK_CREATE] Variables:', { category, name, description, expectedStartDate, expectedWorkingHours, hourlyRate, currency })

    if (!category || !name || !description || !hourlyRate || !currency) {
      const missingFieldsResponse = NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
      logger(req, '[TASK_CREATE] Missing fields response:', missingFieldsResponse)
      return missingFieldsResponse
    }

    const task = await prisma.task.create({
      data: {
        userId: user.id,
        category,
        name,
        description,
        expectedStartDate: expectedStartDate ? new Date(expectedStartDate) : null,
        expectedWorkingHours,
        hourlyRate: parseFloat(hourlyRate),
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
