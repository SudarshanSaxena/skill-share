import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { PrismaClient } from '@/app/generated/prisma'
import { logger } from '@/lib/logger'

const prisma = new PrismaClient()

export async function GET(req: NextRequest, { params }: { params: { taskId: string } }) {
  logger(req, '[TASK_OFFERS_BY_ID_GET] Incoming request:', req)
  logger(req, '[TASK_OFFERS_BY_ID_GET] Params:', params)

  const user = await getUserFromRequest(req)
  logger(req, '[TASK_OFFERS_BY_ID_GET] User from request:', user)
  if (!user) {
    const unauthorizedResponse = NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    logger(req, '[TASK_OFFERS_BY_ID_GET] Unauthorized response:', unauthorizedResponse)
    return unauthorizedResponse
  }

  try {
    const { taskId } = params
    logger(req, '[TASK_OFFERS_BY_ID_GET] Task ID:', taskId)

    // Optional: Verify the task exists and user has access
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    })
    logger(req, '[TASK_OFFERS_BY_ID_GET] Task from DB:', task)
    if (!task) {
      const taskNotFoundResponse = NextResponse.json({ message: 'Task not found' }, { status: 404 })
      logger(req, '[TASK_OFFERS_BY_ID_GET] Task not found response:', taskNotFoundResponse)
      return taskNotFoundResponse
    }

    // Fetch all offers for the task
    const offers = await prisma.offer.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' }
    })
    logger(req, '[TASK_OFFERS_BY_ID_GET] Offers from DB:', offers)

    const offersResponse = NextResponse.json(offers)
    logger(req, '[TASK_OFFERS_BY_ID_GET] Success response:', offersResponse)
    return offersResponse
  } catch (error) {
    logger(req, '[TASK_OFFERS_BY_ID_GET] Error fetching offers:', error)
    const errorResponse = NextResponse.json({ message: 'Error fetching offers' }, { status: 500 })
    logger(req, '[TASK_OFFERS_BY_ID_GET] Error response:', errorResponse)
    return errorResponse
  }
}
