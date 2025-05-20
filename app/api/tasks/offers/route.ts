import { PrismaClient } from '@/app/generated/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

const prisma = new PrismaClient()


export async function GET(req: NextRequest, { params }: { params: { taskId: string } }) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const user = await getUserFromRequest(req)
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const { taskId } = params

    // Get the task to verify the user is the owner or a provider who made the offer
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { offers: true }
    })

    if (!task) return NextResponse.json({ message: 'Task not found' }, { status: 404 })

    // Authorization check: 
    // Allow if user is the task owner or if user is a provider who made an offer on this task
    if (user.userType === 'user' && task.userId !== user.id) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    if (user.userType === 'provider') {
      const providerOffer = await prisma.offer.findFirst({
        where: { taskId, providerId: user.id }
      })
      if (!providerOffer) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
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

    return NextResponse.json({ offers })

  } catch (error) {
    console.error('Error fetching offers:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
