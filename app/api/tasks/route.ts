import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '../../../lib/auth'
import { PrismaClient } from '@/app/generated/prisma'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  console.log('[TASK_GET] Incoming request:', req)
  const user = await getUserFromRequest(req)
  console.log('[TASK_GET] User from request:', user)
  if (!user) {
    const unauthorizedResponse = NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    console.log('[TASK_GET] Unauthorized response:', unauthorizedResponse)
    return unauthorizedResponse
  }

  try {
    const tasks = await prisma.task.findMany({
      // where: {
      //   userId: user.id,
      // },
      orderBy: { createdAt: 'desc' },
    })
    console.log('[TASK_GET] Tasks from DB:', tasks)
    const tasksResponse = NextResponse.json(tasks)
    console.log('[TASK_GET] Success response:', tasksResponse)
    return tasksResponse
  } catch (error) {
    console.error('[TASK_GET] Error fetching tasks:', error)
    const errorResponse = NextResponse.json({ message: 'Error fetching tasks' }, { status: 500 })
    console.log('[TASK_GET] Error response:', errorResponse)
    return errorResponse
  }
}

export async function POST(req: NextRequest) {
  console.log('[TASK_CREATE] Incoming request:', req)
  const user = await getUserFromRequest(req)
  console.log('[TASK_CREATE] User from request:', user)
  if (!user) {
    const unauthorizedResponse = NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    console.log('[TASK_CREATE] Unauthorized response:', unauthorizedResponse)
    return unauthorizedResponse
  }

  try {
    const body = await req.json()
    console.log('[TASK_CREATE] Parsed body:', body)
    const { category, name, description, expectedStartDate, expectedWorkingHours, hourlyRate, currency } = body
    console.log('[TASK_CREATE] Variables:', { category, name, description, expectedStartDate, expectedWorkingHours, hourlyRate, currency })

    if (!category || !name || !description || !hourlyRate || !currency) {
      const missingFieldsResponse = NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
      console.log('[TASK_CREATE] Missing fields response:', missingFieldsResponse)
      return missingFieldsResponse
    }

    const task = await prisma.task.create({
      data: {
        userId: user.id,
        category,
        name,
        description,
        expectedStartDate: expectedStartDate ? new Date(expectedStartDate) : null,
        expectedWorkingHours,
        hourlyRate: parseFloat(hourlyRate),
        currency,
        status: 'open',
      },
    })
    console.log('[TASK_CREATE] Created task:', task)

    const taskCreatedResponse = NextResponse.json(task, { status: 201 })
    console.log('[TASK_CREATE] Success response:', taskCreatedResponse)
    return taskCreatedResponse
  } catch (error) {
    console.error('[TASK_CREATE] Error creating task:', error)
    const errorResponse = NextResponse.json({ message: 'Error creating task' }, { status: 500 })
    console.log('[TASK_CREATE] Error response:', errorResponse)
    return errorResponse
  }
}
