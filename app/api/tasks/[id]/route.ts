import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '../../../../lib/auth'
import { PrismaClient } from '@/app/generated/prisma'

const prisma = new PrismaClient()

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const taskId = params.id

  try {
    const body = await req.json()
    const { category, name, description, expectedStartDate, expectedWorkingHours, hourlyRate, currency, status } = body

    const task = await prisma.task.findUnique({ where: { id: taskId } })
    if (!task) return NextResponse.json({ message: 'Task not found' }, { status: 404 })
    if (task.userId !== user.id) return NextResponse.json({ message: 'Forbidden' }, { status: 403 })

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        category,
        name,
        description,
        expectedStartDate: expectedStartDate ? new Date(expectedStartDate) : null,
        expectedWorkingHours,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
        currency,
        status,
      },
    })

    return NextResponse.json(updatedTask)
  } catch (error) {
    return NextResponse.json({ message: 'Error updating task' }, { status: 500 })
  }
}
