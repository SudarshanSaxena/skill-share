import { PrismaClient } from '@/app/generated/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

const prisma = new PrismaClient()

type Context = {
  params: { offerId: string }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { offerId: string } }
) {
  try {
    console.log('[ACCEPT_OFFER] Incoming request:', req)

    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    console.log('[ACCEPT_OFFER] Authorization token:', token)
    if (!token) {
      const unauthorizedResponse = NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
      console.log('[ACCEPT_OFFER] Unauthorized response:', unauthorizedResponse)
      return unauthorizedResponse
    }

    const user = await getUserFromRequest(req)
    console.log('[ACCEPT_OFFER] User from request:', user)
    if (!user) {
      const unauthorizedUserResponse = NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
      console.log('[ACCEPT_OFFER] Unauthorized user response:', unauthorizedUserResponse)
      return unauthorizedUserResponse
    }

    const { offerId } = params
    console.log('[ACCEPT_OFFER] Params:', params)
    console.log('[ACCEPT_OFFER] Offer ID:', offerId)

    // Fetch offer with task details
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: { task: true }
    })
    console.log('[ACCEPT_OFFER] Offer from DB:', offer)

    if (!offer) {
      const offerNotFoundResponse = NextResponse.json({ message: 'Offer not found' }, { status: 404 })
      console.log('[ACCEPT_OFFER] Offer not found response:', offerNotFoundResponse)
      return offerNotFoundResponse
    }

    // Only the task owner (user) can accept offers
    if (offer.task.userId !== user.id) {
      const forbiddenResponse = NextResponse.json({ message: 'Forbidden' }, { status: 403 })
      console.log('[ACCEPT_OFFER] Forbidden response:', forbiddenResponse)
      return forbiddenResponse
    }

    // Only pending offers can be accepted
    if (offer.status !== 'pending') {
      const notPendingResponse = NextResponse.json({ message: 'Offer is not pending' }, { status: 400 })
      console.log('[ACCEPT_OFFER] Not pending response:', notPendingResponse)
      return notPendingResponse
    }

    // Update offer status to accepted
    const updatedOffer = await prisma.offer.update({
      where: { id: offerId },
      data: { status: 'accepted' }
    })
    console.log('[ACCEPT_OFFER] Updated offer to accepted:', updatedOffer)

    // Update other offers for the same task to rejected
    const rejectedOffers = await prisma.offer.updateMany({
      where: { taskId: offer.taskId, id: { not: offerId }, status: 'pending' },
      data: { status: 'rejected' }
    })
    console.log('[ACCEPT_OFFER] Rejected other offers:', rejectedOffers)

    // Update task status to in_progress
    const updatedTask = await prisma.task.update({
      where: { id: offer.taskId },
      data: { status: 'in_progress' }
    })
    console.log('[ACCEPT_OFFER] Updated task to in_progress:', updatedTask)

    const offerAcceptedResponse = NextResponse.json({ message: 'Offer accepted' })
    console.log('[ACCEPT_OFFER] Offer accepted response:', offerAcceptedResponse)
    return offerAcceptedResponse

  } catch (error) {
    console.error('[ACCEPT_OFFER] Error accepting offer:', error)
    const errorResponse = NextResponse.json({ message: 'Internal server error' }, { status: 500 })
    console.log('[ACCEPT_OFFER] Error response:', errorResponse)
    return errorResponse
  }
}
