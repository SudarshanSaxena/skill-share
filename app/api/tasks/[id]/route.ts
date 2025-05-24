import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '../../../../lib/auth'
import { PrismaClient } from '@/app/generated/prisma'

const prisma = new PrismaClient()

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  console.log('[TASK_UPDATE] Incoming request:', req)
  console.log('[TASK_UPDATE] Params:', params)

  const user = await getUserFromRequest(req)
  console.log('[TASK_UPDATE] User from request:', user)
  if (!user) {
    const unauthorizedResponse = NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    console.log('[TASK_UPDATE] Unauthorized response:', unauthorizedResponse)
    return unauthorizedResponse
  }

  const taskId = params.id
  console.log('[TASK_UPDATE] Task ID:', taskId)

  try {
    const body = await req.json()
    console.log('[TASK_UPDATE] Parsed body:', body)
    const { category, name, description, expectedStartDate, expectedWorkingHours, hourlyRate, currency, status } = body
    console.log('[TASK_UPDATE] Variables:', { category, name, description, expectedStartDate, expectedWorkingHours, hourlyRate, currency, status })

    const task = await prisma.task.findUnique({ where: { id: taskId } })
    console.log('[TASK_UPDATE] Task from DB:', task)
    if (!task) {
      const taskNotFoundResponse = NextResponse.json({ message: 'Task not found' }, { status: 404 })
      console.log('[TASK_UPDATE] Task not found response:', taskNotFoundResponse)
      return taskNotFoundResponse
    }
    if (task.userId !== user.id) {
      const forbiddenResponse = NextResponse.json({ message: 'Forbidden' }, { status: 403 })
      console.log('[TASK_UPDATE] Forbidden response:', forbiddenResponse)
      return forbiddenResponse
    }

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
    console.log('[TASK_UPDATE] Updated task:', updatedTask)

    const successResponse = NextResponse.json(updatedTask)
    console.log('[TASK_UPDATE] Success response:', successResponse)
    return successResponse
  } catch (error) {
    console.error('[TASK_UPDATE] Error updating task:', error)
    const errorResponse = NextResponse.json({ message: 'Error updating task' }, { status: 500 })
    console.log('[TASK_UPDATE] Error response:', errorResponse)
    return errorResponse
  }
}
