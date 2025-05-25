'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface SkillFormProps {
  type: 'create' | 'update'
  skillId?: string
  initialData?: {
    category: string
    experience: string
    natureOfWork: 'online' | 'onsite'
    hourlyRate: number
  }
}

export default function SkillForm({ type, skillId, initialData }: SkillFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    category: '',
    experience: '',
    natureOfWork: 'online',
    hourlyRate: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (initialData) {
      setFormData({
        category: initialData.category,
        experience: initialData.experience,
        natureOfWork: initialData.natureOfWork,
        hourlyRate: String(initialData.hourlyRate),
      })
    }
  }, [initialData])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const validateForm = () => {
    if (!formData.category.trim()) return 'Category is required.'
    if (!formData.experience.trim()) return 'Experience is required.'
    if (!formData.natureOfWork) return 'Nature of Work is required.'
    if (!formData.hourlyRate || Number(formData.hourlyRate) <= 0) return 'Hourly Rate must be a positive number.'
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    try {
      const endpoint = type === 'create' ? '/api/skills' : `/api/skills/${skillId}`
      const res = await fetch(endpoint, {
        method: type === 'create' ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          'x-api-call-stack-id': crypto.randomUUID(), // Use Web Crypto API for trace ID
        },
        body: JSON.stringify({
          ...formData,
          hourlyRate: parseFloat(formData.hourlyRate),
        }),
      })

      const result = await res.json()

      if (res.ok) {
        alert(`${type === 'create' ? 'Skill created' : 'Skill updated'} successfully`)
        // Redirect or clear form
        router.push('/skills') // Assuming you have a skill listing page at /skills
      } else {
        setError(result.message || 'Something went wrong')
      }
    } catch (err) {
      setError('Failed to submit form. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto mt-10 space-y-4">
      <h2 className="text-2xl font-semibold">{type === 'create' ? 'Add Skill' : 'Update Skill'}</h2>

      {error && <p className="text-red-600">{error}</p>}

      <label className="block">
        Category:
        <input
          name="category"
          value={formData.category}
          onChange={handleChange}
          required
          className="w-full border p-2"
          disabled={loading}
        />
      </label>

      <label className="block">
        Experience:
        <input
          name="experience"
          value={formData.experience}
          onChange={handleChange}
          required
          className="w-full border p-2"
          disabled={loading}
        />
      </label>

      <label className="block">
        Nature of Work:
        <select
          name="natureOfWork"
          value={formData.natureOfWork}
          onChange={handleChange}
          className="w-full border p-2"
          disabled={loading}
        >
          <option value="online">Online</option>
          <option value="onsite">Onsite</option>
        </select>
      </label>

      <label className="block">
        Hourly Rate:
        <input
          type="number"
          name="hourlyRate"
          value={formData.hourlyRate}
          onChange={handleChange}
          required
          min="0"
          step="0.01"
          className="w-full border p-2"
          disabled={loading}
        />
      </label>

      <button
        type="submit"
        disabled={loading}
        className={`px-4 py-2 rounded text-white ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
      >
        {loading ? (type === 'create' ? 'Creating...' : 'Updating...') : type === 'create' ? 'Create Skill' : 'Update Skill'}
      </button>
    </form>
  )
}
