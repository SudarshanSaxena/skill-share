import { PrismaClient } from '@/app/generated/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const user = await getUserFromRequest(req)
    console.log('User from request:', user)
    if (!user || user.role !== 'provider') {
      return NextResponse.json({ message: 'Only providers can make offers' }, { status: 403 })
    }

    const { taskId, price, message } = await req.json()

    if (!taskId) return NextResponse.json({ message: 'Task ID is required' }, { status: 400 })

    if (price === undefined || isNaN(price)) {
      return NextResponse.json({ message: 'Price is required and must be a number' }, { status: 400 })
    }

    // Check if task exists and is open
    const task = await prisma.task.findUnique({ where: { id: taskId } })
    if (!task) return NextResponse.json({ message: 'Task not found' }, { status: 404 })
    if (task.status !== 'open') return NextResponse.json({ message: 'Task is not open for offers' }, { status: 400 })

    // Check if provider already made an offer for this task
    const existingOffer = await prisma.offer.findFirst({
      where: { taskId, providerId: user.id }
    })
    if (existingOffer) return NextResponse.json({ message: 'You already made an offer for this task' }, { status: 400 })

    // Create the offer
    const offer = await prisma.offer.create({
      data: {
        taskId,
        providerId: user.id,
        price: parseFloat(price),
        message,
        status: 'pending',
      }
    })

    // Optionally, update task status to 'offered' if first offer
    // if (task.status === 'open') {
    //   await prisma.task.update({
    //     where: { id: taskId },
    //     data: { status: 'offered' }
    //   })
    // }

    return NextResponse.json({ offer }, { status: 201 })

  } catch (error) {
    console.error('Error creating offer:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
