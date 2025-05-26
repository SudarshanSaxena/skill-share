export interface AuthFormProps {
  type: 'signup' | 'login'
}

export interface Provider {
  id: string
  firstName?: string | null
  lastName?: string | null
  providerType?: 'individual' | 'company' | null
  companyName?: string | null
}

export interface OfferList {
  id: string
  status: string
  createdAt: string
  provider: Provider
}

export interface OffersListProps {
  taskId: string
}

export interface SkillFormProps {
  type: 'create' | 'update'
  skillId?: string
  initialData?: {
    category: string
    experience: string
    natureOfWork: 'online' | 'onsite'
    hourlyRate: number
  }
}

export interface TaskFormProps {
  type: 'create' | 'update'
  taskId?: string
  initialData?: {
    category: string
    name: string
    description: string
    expectedStartDate?: string
    expectedWorkingHours?: number
    hourlyRate: number
    currency: 'USD' | 'AUD' | 'SGD' | 'INR'
    status?: string
  }
  onSuccess?: () => void
}

export interface Task {
  id: string
  category: string
  name: string
  description: string
  expectedStartDate?: string
  expectedWorkingHours?: number
  hourlyRate: number
  currency: string
  status: string
}

export interface Offer {
  id: string
  providerId: string
  taskId: string
  price: number
  message: string
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: string
}

export interface Skill {
  id: string
  category: string
  experience: string
  natureOfWork: 'online' | 'onsite'
  hourlyRate: number
}

export interface SkillEditPageProps {
  params: { id: string }
}