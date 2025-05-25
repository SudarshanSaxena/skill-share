import { PrismaClient } from '@/app/generated/prisma'
import { getUserFromRequest } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { z } from 'zod' // <-- Add this import

const prisma = new PrismaClient()

// Define Zod schema for offer creation payload
const offerSchema = z.object({
  taskId: z.string().min(1, 'Task ID is required'),
  price: z.preprocess((val) => typeof val === 'string' ? parseFloat(val) : val, z.number({ invalid_type_error: 'Price must be a number' })),
  message: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    logger(req, '[OFFER_CREATE] Incoming request:', req)

    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    logger(req, '[OFFER_CREATE] Authorization token:', token)
    if (!token) {
      const unauthorizedResponse = NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
      logger(req, '[OFFER_CREATE] Unauthorized response:', unauthorizedResponse)
      return unauthorizedResponse
    }

    const user = await getUserFromRequest(req)
    logger(req, '[OFFER_CREATE] User from request:', user)
    if (!user || user.role !== 'provider') {
      const forbiddenResponse = NextResponse.json({ message: 'Only providers can make offers' }, { status: 403 })
      logger(req, '[OFFER_CREATE] Forbidden response:', forbiddenResponse)
      return forbiddenResponse
    }

    const body = await req.json()
    logger(req, '[OFFER_CREATE] Parsed body:', body)

    // Validate request body using Zod
    const result = offerSchema.safeParse(body)
    if (!result.success) {
      const validationErrorResponse = NextResponse.json(
        { message: 'Validation Error', errors: result.error.flatten().fieldErrors },
        { status: 400 }
      )
      logger(req, '[OFFER_CREATE] Validation error response:', validationErrorResponse)
      return validationErrorResponse
    }

    const { taskId, price, message } = result.data

    // Check if task exists and is open
    const task = await prisma.task.findUnique({ where: { id: taskId } })
    logger(req, '[OFFER_CREATE] Task from DB:', task)
    if (!task) {
      const taskNotFoundResponse = NextResponse.json({ message: 'Task not found' }, { status: 404 })
      logger(req, '[OFFER_CREATE] Task Not Found response:', taskNotFoundResponse)
      return taskNotFoundResponse
    }
    if (task.status !== 'open') {
      const taskNotOpenResponse = NextResponse.json({ message: 'Task is not open for offers' }, { status: 400 })
      logger(req, '[OFFER_CREATE] Task Not Open response:', taskNotOpenResponse)
      return taskNotOpenResponse
    }

    // Check if provider already made an offer for this task
    const existingOffer = await prisma.offer.findFirst({
      where: { taskId, providerId: user.id }
    })
    logger(req, '[OFFER_CREATE] Existing offer:', existingOffer)
    if (existingOffer) {
      const alreadyOfferedResponse = NextResponse.json({ message: 'You already made an offer for this task' }, { status: 400 })
      logger(req, '[OFFER_CREATE] Already Offered response:', alreadyOfferedResponse)
      return alreadyOfferedResponse
    }

    // Create the offer
    const offer = await prisma.offer.create({
      data: {
        taskId,
        providerId: user.id,
        price,
        message,
        status: 'pending',
      }
    })
    logger(req, '[OFFER_CREATE] Created offer:', offer)

    const offerCreatedResponse = NextResponse.json({ offer }, { status: 201 })
    logger(req, '[OFFER_CREATE] Offer Created response:', offerCreatedResponse)
    return offerCreatedResponse

  } catch (error) {
    logger(req, '[OFFER_CREATE] Error creating offer:', error)
    const errorResponse = NextResponse.json({ message: 'Internal server error' }, { status: 500 })
    logger(req, '[OFFER_CREATE] Error response:', errorResponse)
    return errorResponse
  }
}
