'use client'

import { useState, useEffect } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

interface TaskFormProps {
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

export default function TaskForm({ type, taskId, initialData, onSuccess }: TaskFormProps) {
  const [formData, setFormData] = useState({
    category: '',
    name: '',
    description: '',
    expectedWorkingHours: '',
    hourlyRate: '',
    currency: 'USD',
    status: 'open',
  })

  // Store expectedStartDate as a Date object for react-datepicker
  const [expectedStartDate, setExpectedStartDate] = useState<Date | null>(null)

  useEffect(() => {
    if (initialData) {
      setFormData({
        category: initialData.category,
        name: initialData.name,
        description: initialData.description,
        expectedWorkingHours: initialData.expectedWorkingHours?.toString() || '',
        hourlyRate: initialData.hourlyRate.toString(),
        currency: initialData.currency,
        status: initialData.status || 'open',
      })

      if (initialData.expectedStartDate) {
        setExpectedStartDate(new Date(initialData.expectedStartDate))
      }
    }
  }, [initialData])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const endpoint = type === 'create' ? '/api/tasks' : `/api/tasks/${taskId}`

    const res = await fetch(endpoint, {
      method: type === 'create' ? 'POST' : 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
      },
      body: JSON.stringify({
        category: formData.category,
        name: formData.name,
        description: formData.description,
        expectedStartDate: expectedStartDate ? expectedStartDate.toISOString() : null,
        expectedWorkingHours: formData.expectedWorkingHours ? parseInt(formData.expectedWorkingHours) : null,
        hourlyRate: parseFloat(formData.hourlyRate),
        currency: formData.currency,
        status: formData.status,
      }),
    })

    if (res.ok) {
      alert(`Task ${type === 'create' ? 'created' : 'updated'} successfully`)
      if (onSuccess) onSuccess()
    } else {
      const errorData = await res.json()
      alert(errorData.message || 'Something went wrong')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto p-4 space-y-4 border rounded shadow">
      <h2 className="text-xl font-semibold">{type === 'create' ? 'Create Task' : 'Update Task'}</h2>

      <label className="block">
        Category:
        <input
          name="category"
          value={formData.category}
          onChange={handleChange}
          required
          className="w-full border p-2 rounded"
        />
      </label>

      <label className="block">
        Name:
        <input
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full border p-2 rounded"
        />
      </label>

      <label className="block">
        Description:
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          rows={4}
          className="w-full border p-2 rounded"
        />
      </label>

      <label className="block">
        Expected Start Date:
        <DatePicker
          selected={expectedStartDate}
          onChange={(date:any) => setExpectedStartDate(date)}
          dateFormat="yyyy-MM-dd"
          className="w-full border p-2 rounded"
          placeholderText="Select start date"
          isClearable
        />
      </label>

      <label className="block">
        Expected Working Hours:
        <input
          type="number"
          name="expectedWorkingHours"
          value={formData.expectedWorkingHours}
          onChange={handleChange}
          min={0}
          className="w-full border p-2 rounded"
        />
      </label>

      <label className="block">
        Hourly Rate:
        <input
          type="number"
          name="hourlyRate"
          value={formData.hourlyRate}
          onChange={handleChange}
          required
          min={0}
          step="0.01"
          className="w-full border p-2 rounded"
        />
      </label>

      <label className="block">
        Currency:
        <select name="currency" value={formData.currency} onChange={handleChange} className="w-full border p-2 rounded">
          <option value="USD">USD</option>
          <option value="AUD">AUD</option>
          <option value="SGD">SGD</option>
          <option value="INR">INR</option>
        </select>
      </label>

      {type === 'update' && (
        <label className="block">
          Status:
          <select name="status" value={formData.status} onChange={handleChange} className="w-full border p-2 rounded">
            <option value="open">Open</option>
            <option value="offered">Offered</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
        </label>
      )}

      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
        {type === 'create' ? 'Create Task' : 'Update Task'}
      </button>
    </form>
  )
}
