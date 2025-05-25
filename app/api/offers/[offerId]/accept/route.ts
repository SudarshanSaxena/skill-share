import { PrismaClient } from '@/app/generated/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

const prisma = new PrismaClient()

type Context = {
  params: { offerId: string }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { offerId: string } }
) {
  try {
    logger(req, '[ACCEPT_OFFER] Incoming request:', req)

    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    logger(req, '[ACCEPT_OFFER] Authorization token:', token)
    if (!token) {
      const unauthorizedResponse = NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
      logger(req, '[ACCEPT_OFFER] Unauthorized response:', unauthorizedResponse)
      return unauthorizedResponse
    }

    const user = await getUserFromRequest(req)
    logger(req, '[ACCEPT_OFFER] User from request:', user)
    if (!user) {
      const unauthorizedUserResponse = NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
      logger(req, '[ACCEPT_OFFER] Unauthorized user response:', unauthorizedUserResponse)
      return unauthorizedUserResponse
    }

    const { offerId } = params
    logger(req, '[ACCEPT_OFFER] Params:', params)
    logger(req, '[ACCEPT_OFFER] Offer ID:', offerId)

    // Fetch offer with task details
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: { task: true }
    })
    logger(req, '[ACCEPT_OFFER] Offer from DB:', offer)

    if (!offer) {
      const offerNotFoundResponse = NextResponse.json({ message: 'Offer not found' }, { status: 404 })
      logger(req, '[ACCEPT_OFFER] Offer not found response:', offerNotFoundResponse)
      return offerNotFoundResponse
    }

    // Only the task owner (user) can accept offers
    if (offer.task.userId !== user.id) {
      const forbiddenResponse = NextResponse.json({ message: 'Forbidden' }, { status: 403 })
      logger(req, '[ACCEPT_OFFER] Forbidden response:', forbiddenResponse)
      return forbiddenResponse
    }

    // Only pending offers can be accepted
    if (offer.status !== 'pending') {
      const notPendingResponse = NextResponse.json({ message: 'Offer is not pending' }, { status: 400 })
      logger(req, '[ACCEPT_OFFER] Not pending response:', notPendingResponse)
      return notPendingResponse
    }

    // Update offer status to accepted
    const updatedOffer = await prisma.offer.update({
      where: { id: offerId },
      data: { status: 'accepted' }
    })
    logger(req, '[ACCEPT_OFFER] Updated offer to accepted:', updatedOffer)

    // Update other offers for the same task to rejected
    const rejectedOffers = await prisma.offer.updateMany({
      where: { taskId: offer.taskId, id: { not: offerId }, status: 'pending' },
      data: { status: 'rejected' }
    })
    logger(req, '[ACCEPT_OFFER] Rejected other offers:', rejectedOffers)

    // Update task status to in_progress
    const updatedTask = await prisma.task.update({
      where: { id: offer.taskId },
      data: { status: 'in_progress' }
    })
    logger(req, '[ACCEPT_OFFER] Updated task to in_progress:', updatedTask)

    const offerAcceptedResponse = NextResponse.json({ message: 'Offer accepted' })
    logger(req, '[ACCEPT_OFFER] Offer accepted response:', offerAcceptedResponse)
    return offerAcceptedResponse

  } catch (error) {
    logger(req, '[ACCEPT_OFFER] Error accepting offer:', error)
    const errorResponse = NextResponse.json({ message: 'Internal server error' }, { status: 500 })
    logger(req, '[ACCEPT_OFFER] Error response:', errorResponse)
    return errorResponse
  }
}
