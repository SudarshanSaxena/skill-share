import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '../../../../lib/auth'
import { PrismaClient } from '@/app/generated/prisma'
import { logger } from '@/lib/logger'

const prisma = new PrismaClient()

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  logger(req, '[TASK_UPDATE] Incoming request:', req)
  logger(req, '[TASK_UPDATE] Params:', params)

  const user = await getUserFromRequest(req)
  logger(req, '[TASK_UPDATE] User from request:', user)
  if (!user) {
    const unauthorizedResponse = NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    logger(req, '[TASK_UPDATE] Unauthorized response:', unauthorizedResponse)
    return unauthorizedResponse
  }

  const taskId = params.id
  logger(req, '[TASK_UPDATE] Task ID:', taskId)

  try {
    const body = await req.json()
    logger(req, '[TASK_UPDATE] Parsed body:', body)
    const { category, name, description, expectedStartDate, expectedWorkingHours, hourlyRate, currency, status } = body
    logger(req, '[TASK_UPDATE] Variables:', { category, name, description, expectedStartDate, expectedWorkingHours, hourlyRate, currency, status })

    const task = await prisma.task.findUnique({ where: { id: taskId } })
    logger(req, '[TASK_UPDATE] Task from DB:', task)
    if (!task) {
      const taskNotFoundResponse = NextResponse.json({ message: 'Task not found' }, { status: 404 })
      logger(req, '[TASK_UPDATE] Task not found response:', taskNotFoundResponse)
      return taskNotFoundResponse
    }
    if (task.userId !== user.id) {
      const forbiddenResponse = NextResponse.json({ message: 'Forbidden' }, { status: 403 })
      logger(req, '[TASK_UPDATE] Forbidden response:', forbiddenResponse)
      return forbiddenResponse
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        category,
        name,
        description,
        expectedStartDate: expectedStartDate ? new Date(expectedStartDate) : null,
        expectedWorkingHours,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
        currency,
        status,
      },
    })
    logger(req, '[TASK_UPDATE] Updated task:', updatedTask)

    const successResponse = NextResponse.json(updatedTask)
    logger(req, '[TASK_UPDATE] Success response:', successResponse)
    return successResponse
  } catch (error) {
    logger(req, '[TASK_UPDATE] Error updating task:', error)
    const errorResponse = NextResponse.json({ message: 'Error updating task' }, { status: 500 })
    logger(req, '[TASK_UPDATE] Error response:', errorResponse)
    return errorResponse
  }
}
