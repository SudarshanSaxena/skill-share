import { PrismaClient } from '@/app/generated/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

const prisma = new PrismaClient()

export async function GET(req: NextRequest, { params }: { params: { taskId: string } }) {
  logger(req, '[TASK_OFFERS_GET] Incoming request:', req)
  logger(req, '[TASK_OFFERS_GET] Params:', params)

  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    logger(req, '[TASK_OFFERS_GET] Authorization token:', token)
    if (!token) {
      const unauthorizedTokenResponse = NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
      logger(req, '[TASK_OFFERS_GET] Unauthorized token response:', unauthorizedTokenResponse)
      return unauthorizedTokenResponse
    }

    const user = await getUserFromRequest(req)
    logger(req, '[TASK_OFFERS_GET] User from request:', user)
    if (!user) {
      const unauthorizedUserResponse = NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
      logger(req, '[TASK_OFFERS_GET] Unauthorized user response:', unauthorizedUserResponse)
      return unauthorizedUserResponse
    }

    const { taskId } = params
    logger(req, '[TASK_OFFERS_GET] Task ID:', taskId)

    // Get the task to verify the user is the owner or a provider who made the offer
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { offers: true }
    })
    logger(req, '[TASK_OFFERS_GET] Task from DB:', task)

    if (!task) {
      const taskNotFoundResponse = NextResponse.json({ message: 'Task not found' }, { status: 404 })
      logger(req, '[TASK_OFFERS_GET] Task not found response:', taskNotFoundResponse)
      return taskNotFoundResponse
    }

    // Authorization check: 
    // Allow if user is the task owner or if user is a provider who made an offer on this task
    if (user.userType === 'user' && task.userId !== user.id) {
      const forbiddenOwnerResponse = NextResponse.json({ message: 'Forbidden' }, { status: 403 })
      logger(req, '[TASK_OFFERS_GET] Forbidden owner response:', forbiddenOwnerResponse)
      return forbiddenOwnerResponse
    }

    if (user.userType === 'provider') {
      const providerOffer = await prisma.offer.findFirst({
        where: { taskId, providerId: user.id }
      })
      logger(req, '[TASK_OFFERS_GET] Provider offer:', providerOffer)
      if (!providerOffer) {
        const forbiddenProviderResponse = NextResponse.json({ message: 'Forbidden' }, { status: 403 })
        logger(req, '[TASK_OFFERS_GET] Forbidden provider response:', forbiddenProviderResponse)
        return forbiddenProviderResponse
      }
    }

    // Fetch offers with provider info
    const offers = await prisma.offer.findMany({
      where: { taskId },
      include: {
        provider: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            providerType: true,
            companyName: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    logger(req, '[TASK_OFFERS_GET] Offers from DB:', offers)

    const offersResponse = NextResponse.json({ offers })
    logger(req, '[TASK_OFFERS_GET] Success response:', offersResponse)
    return offersResponse

  } catch (error) {
    logger(req, '[TASK_OFFERS_GET] Error fetching offers:', error)
    const errorResponse = NextResponse.json({ message: 'Internal server error' }, { status: 500 })
    logger(req, '[TASK_OFFERS_GET] Error response:', errorResponse)
    return errorResponse
  }
}
