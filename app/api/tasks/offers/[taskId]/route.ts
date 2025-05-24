import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { PrismaClient } from '@/app/generated/prisma'

const prisma = new PrismaClient()

export async function GET(req: NextRequest, { params }: { params: { taskId: string } }) {
  console.log('[TASK_OFFERS_BY_ID_GET] Incoming request:', req)
  console.log('[TASK_OFFERS_BY_ID_GET] Params:', params)

  const user = await getUserFromRequest(req)
  console.log('[TASK_OFFERS_BY_ID_GET] User from request:', user)
  if (!user) {
    const unauthorizedResponse = NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    console.log('[TASK_OFFERS_BY_ID_GET] Unauthorized response:', unauthorizedResponse)
    return unauthorizedResponse
  }

  try {
    const { taskId } = params
    console.log('[TASK_OFFERS_BY_ID_GET] Task ID:', taskId)

    // Optional: Verify the task exists and user has access
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    })
    console.log('[TASK_OFFERS_BY_ID_GET] Task from DB:', task)
    if (!task) {
      const taskNotFoundResponse = NextResponse.json({ message: 'Task not found' }, { status: 404 })
      console.log('[TASK_OFFERS_BY_ID_GET] Task not found response:', taskNotFoundResponse)
      return taskNotFoundResponse
    }

    // Fetch all offers for the task
    const offers = await prisma.offer.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' }
    })
    console.log('[TASK_OFFERS_BY_ID_GET] Offers from DB:', offers)

    const offersResponse = NextResponse.json(offers)
    console.log('[TASK_OFFERS_BY_ID_GET] Success response:', offersResponse)
    return offersResponse
  } catch (error) {
    console.error('[TASK_OFFERS_BY_ID_GET] Error fetching offers:', error)
    const errorResponse = NextResponse.json({ message: 'Error fetching offers' }, { status: 500 })
    console.log('[TASK_OFFERS_BY_ID_GET] Error response:', errorResponse)
    return errorResponse
  }
}
