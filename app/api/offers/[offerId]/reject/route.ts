import { PrismaClient } from '@/app/generated/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function PUT(req: NextRequest, { params }: { params: { offerId: string } }) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const user = await getUserFromRequest(req)
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const { offerId } = params

    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: { task: true }
    })

    if (!offer) return NextResponse.json({ message: 'Offer not found' }, { status: 404 })

    if (offer.task.userId !== user.id) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    if (offer.status !== 'pending') {
      return NextResponse.json({ message: 'Offer is not pending' }, { status: 400 })
    }

    await prisma.offer.update({
      where: { id: offerId },
      data: { status: 'rejected' }
    })

    // Optionally, if no more pending offers left, revert task status to 'open'
    const pendingOffers = await prisma.offer.count({
      where: { taskId: offer.taskId, status: 'pending' }
    })

    if (pendingOffers === 0) {
      await prisma.task.update({
        where: { id: offer.taskId },
        data: { status: 'open' }
      })
    }

    return NextResponse.json({ message: 'Offer rejected' })

  } catch (error) {
    console.error('Error rejecting offer:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
