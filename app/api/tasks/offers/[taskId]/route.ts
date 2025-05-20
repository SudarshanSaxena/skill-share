import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { PrismaClient } from '@/app/generated/prisma'

const prisma = new PrismaClient()

export async function GET(req: NextRequest, { params }: { params: { taskId: string } }) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const { taskId } = params

    // Optional: Verify the task exists and user has access
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    })
    if (!task) {
      return NextResponse.json({ message: 'Task not found' }, { status: 404 })
    }

    // Fetch all offers for the task
    const offers = await prisma.offer.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(offers)
  } catch (error) {
    console.error('Error fetching offers:', error)
    return NextResponse.json({ message: 'Error fetching offers' }, { status: 500 })
  }
}
