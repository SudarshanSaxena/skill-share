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
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const user = await getUserFromRequest(req)
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const { offerId } = params

    // Fetch offer with task details
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: { task: true }
    })

    if (!offer) return NextResponse.json({ message: 'Offer not found' }, { status: 404 })

    // Only the task owner (user) can accept offers
    if (offer.task.userId !== user.id) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    // Only pending offers can be accepted
    if (offer.status !== 'pending') {
      return NextResponse.json({ message: 'Offer is not pending' }, { status: 400 })
    }

    // Update offer status to accepted
    await prisma.offer.update({
      where: { id: offerId },
      data: { status: 'accepted' }
    })

    // Update other offers for the same task to rejected
    await prisma.offer.updateMany({
      where: { taskId: offer.taskId, id: { not: offerId }, status: 'pending' },
      data: { status: 'rejected' }
    })

    // Update task status to in_progress
    await prisma.task.update({
      where: { id: offer.taskId },
      data: { status: 'in_progress' }
    })

    return NextResponse.json({ message: 'Offer accepted' })

  } catch (error) {
    console.error('Error accepting offer:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
