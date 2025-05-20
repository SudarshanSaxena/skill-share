import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '../../../lib/auth'
import { PrismaClient } from '@/app/generated/prisma'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    // For example, list tasks owned by this user (requester)
    const tasks = await prisma.task.findMany({
      // where: {
      //   userId: user.id,
      // },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(tasks)
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching tasks' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { category, name, description, expectedStartDate, expectedWorkingHours, hourlyRate, currency } = body

    if (!category || !name || !description || !hourlyRate || !currency) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
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

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    return NextResponse.json({ message: 'Error creating task' }, { status: 500 })
  }
}
