import { PrismaClient } from '@/app/generated/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function PUT(req: NextRequest, { params }: { params: { offerId: string } }) {
  try {
    console.log('[REJECT_OFFER] Incoming request:', req)

    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    console.log('[REJECT_OFFER] Authorization token:', token)
    if (!token) {
      const unauthorizedResponse = NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
      console.log('[REJECT_OFFER] Unauthorized response:', unauthorizedResponse)
      return unauthorizedResponse
    }

    const user = await getUserFromRequest(req)
    console.log('[REJECT_OFFER] User from request:', user)
    if (!user) {
      const unauthorizedUserResponse = NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
      console.log('[REJECT_OFFER] Unauthorized user response:', unauthorizedUserResponse)
      return unauthorizedUserResponse
    }

    const { offerId } = params
    console.log('[REJECT_OFFER] Params:', params)
    console.log('[REJECT_OFFER] Offer ID:', offerId)

    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: { task: true }
    })
    console.log('[REJECT_OFFER] Offer from DB:', offer)

    if (!offer) {
      const offerNotFoundResponse = NextResponse.json({ message: 'Offer not found' }, { status: 404 })
      console.log('[REJECT_OFFER] Offer not found response:', offerNotFoundResponse)
      return offerNotFoundResponse
    }

    if (offer.task.userId !== user.id) {
      const forbiddenResponse = NextResponse.json({ message: 'Forbidden' }, { status: 403 })
      console.log('[REJECT_OFFER] Forbidden response:', forbiddenResponse)
      return forbiddenResponse
    }

    if (offer.status !== 'pending') {
      const notPendingResponse = NextResponse.json({ message: 'Offer is not pending' }, { status: 400 })
      console.log('[REJECT_OFFER] Not pending response:', notPendingResponse)
      return notPendingResponse
    }

    const updatedOffer = await prisma.offer.update({
      where: { id: offerId },
      data: { status: 'rejected' }
    })
    console.log('[REJECT_OFFER] Updated offer to rejected:', updatedOffer)

    // Optionally, if no more pending offers left, revert task status to 'open'
    const pendingOffers = await prisma.offer.count({
      where: { taskId: offer.taskId, status: 'pending' }
    })
    console.log('[REJECT_OFFER] Pending offers count:', pendingOffers)

    if (pendingOffers === 0) {
      const reopenedTask = await prisma.task.update({
        where: { id: offer.taskId },
        data: { status: 'open' }
      })
      console.log('[REJECT_OFFER] Task status reverted to open:', reopenedTask)
    }

    const offerRejectedResponse = NextResponse.json({ message: 'Offer rejected' })
    console.log('[REJECT_OFFER] Offer rejected response:', offerRejectedResponse)
    return offerRejectedResponse

  } catch (error) {
    console.error('[REJECT_OFFER] Error rejecting offer:', error)
    const errorResponse = NextResponse.json({ message: 'Internal server error' }, { status: 500 })
    console.log('[REJECT_OFFER] Error response:', errorResponse)
    return errorResponse
  }
}
