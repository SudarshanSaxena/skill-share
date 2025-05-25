'use client'

import { useEffect, useState } from 'react'
import TaskForm from './TaskForm'

interface Task {
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

interface Offer {
  id: string
  providerId: string
  taskId: string
  price: number
  message: string
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: string
}

export default function TaskList() {
  const [loading, setLoading] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [offers, setOffers] = useState<Offer[]>([])
  const [loadingOffers, setLoadingOffers] = useState(false)

  // New states for making an offer
  const [offerPrice, setOfferPrice] = useState('')
  const [offerMessage, setOfferMessage] = useState('')
  const [submittingOffer, setSubmittingOffer] = useState(false)

  const fetchTasks = async () => {
    setLoading(true)
    const res = await fetch('/api/tasks', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        'x-api-call-stack-id': crypto.randomUUID(), // Use Web Crypto API for trace ID
      },
    })
    if (res.ok) {
      setLoading(false)
      const data = await res.json()
      setTasks(data)
    } else {
      setLoading(false)
      alert('Failed to fetch tasks')
    }
  }

  const fetchOffers = async (taskId: string) => {
    setLoadingOffers(true)
    const res = await fetch(`/api/tasks/offers/${taskId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
      },
    })
    if (res.ok) {
      setLoadingOffers(false)
      const data = await res.json()
      setOffers(data)
    } else {
      alert('Failed to fetch offers')
      setOffers([])
    }
    setLoadingOffers(false)
  }

  const handleMakeOffer = async () => {
    if (!offerPrice || isNaN(Number(offerPrice))) {
      alert('Enter a valid price')
      return
    }

    setSubmittingOffer(true)
    setLoadingOffers(true)
    const res = await fetch('/api/offers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
      },
      body: JSON.stringify({
        taskId: selectedTask?.id,
        price: parseFloat(offerPrice),
        message: offerMessage,
      }),
    })

    if (res.ok) {
      setLoading(false)
      alert('Offer submitted!')
      setOfferPrice('')
      setOfferMessage('')
      fetchOffers(selectedTask!.id)
    } else {
      setLoading(false)
      const error = await res.json()
      alert(error.message || 'Failed to submit offer')
    }

    setSubmittingOffer(false)
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  useEffect(() => {
    if (selectedTask?.id) {
      fetchOffers(selectedTask.id)
    } else {
      setOffers([])
    }
  }, [selectedTask])

  const actionOffer = async (offer: Offer, action: 'accept' | 'reject') => {
    const url = `/api/offers/${offer.id}/${action}`;
    setLoading(true)
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
      },
    });
    if (res.ok) {
      setLoading
      alert(`Offer ${action}ed!`);
      if (selectedTask?.id) {
        fetchOffers(selectedTask.id);
      }
    } else {
      setLoading(false)
      const error = await res.json();
      alert(error.message || `Failed to ${action} offer`);
    }
  };

  return (
    <>
    {loading && <div className="text-center">Loading...</div>}
      {loading && <div className="text-center">Welcome to the platform!</div>}
      {loading && <div className="text-center">Please be patient</div>}

    {!loading && <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Task List</h1>

      {!editingTask && !selectedTask && (
        <button
          className="mb-4 bg-green-600 text-white px-4 py-2 rounded"
          onClick={() => setEditingTask({} as Task)}
        >
          + New Task
        </button>
      )}

      {editingTask ? (
        <TaskForm
          type={editingTask.id ? 'update' : 'create'}
          taskId={editingTask.id}
          initialData={
            editingTask.id
              ? {
                  ...editingTask,
                  currency: editingTask.currency as 'USD' | 'AUD' | 'SGD' | 'INR',
                }
              : undefined
          }
          onSuccess={() => {
            setEditingTask(null)
            fetchTasks()
          }}
        />
      ) : (
        <>
          <table className="w-full border-collapse border">
            <thead>
              <tr>
                <th className="border p-2">Category</th>
                <th className="border p-2">Name</th>
                <th className="border p-2">Hourly Rate</th>
                <th className="border p-2">Status</th>
                <th className="border p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center p-4">
                    No tasks found.
                  </td>
                </tr>
              ) : (
                tasks.map((task) => (
                  <tr
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className="cursor-pointer"
                  >
                    <td className="border p-2">{task.category}</td>
                    <td className="border p-2">{task.name}</td>
                    <td className="border p-2">
                      {task.hourlyRate} {task.currency}
                    </td>
                    <td className="border p-2">{task.status}</td>
                    <td className="border p-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingTask(task)
                        }}
                        className="bg-blue-600 text-white px-2 py-1 rounded"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {selectedTask && (
            <div className="mt-6 p-4 border rounded shadow">
              <button
                className="mb-4 bg-gray-400 text-white px-3 py-1 rounded"
                onClick={() => setSelectedTask(null)}
              >
                Close Details
              </button>

              <h2 className="text-xl font-semibold mb-2">{selectedTask.name}</h2>
              <p><strong>Category:</strong> {selectedTask.category}</p>
              <p><strong>Description:</strong> {selectedTask.description}</p>
              <p>
                <strong>Expected Start Date:</strong>{' '}
                {selectedTask.expectedStartDate
                  ? new Date(selectedTask.expectedStartDate).toLocaleDateString()
                  : 'N/A'}
              </p>
              <p><strong>Expected Working Hours:</strong> {selectedTask.expectedWorkingHours ?? 'N/A'}</p>
              <p>
                <strong>Hourly Rate:</strong> {selectedTask.hourlyRate} {selectedTask.currency}
              </p>
              <p><strong>Status:</strong> {selectedTask.status}</p>

              {selectedTask.status === 'open' && (
                <div className="mt-4 p-4 border rounded">
                  <h3 className="text-lg font-semibold mb-2">Make an Offer</h3>
                  <div className="mb-2">
                    <label className="block font-medium mb-1">Price</label>
                    <input
                      type="number"
                      value={offerPrice}
                      onChange={(e) => setOfferPrice(e.target.value)}
                      className="w-full border px-2 py-1 rounded"
                    />
                  </div>
                  <div className="mb-2">
                    <label className="block font-medium mb-1">Message (optional)</label>
                    <textarea
                      value={offerMessage}
                      onChange={(e) => setOfferMessage(e.target.value)}
                      className="w-full border px-2 py-1 rounded"
                      rows={3}
                    />
                  </div>
                  <button
                    onClick={handleMakeOffer}
                    disabled={submittingOffer}
                    className="bg-green-600 text-white px-4 py-2 rounded"
                  >
                    {submittingOffer ? 'Submitting...' : 'Submit Offer'}
                  </button>
                </div>
              )}

              <hr className="my-4" />

              <h3 className="text-lg font-semibold mb-2">Offers</h3>
              {loadingOffers ? (
                <p>Loading offers...</p>
              ) : offers.length === 0 ? (
                <p>No offers made for this task yet.</p>
              ) : (
                <ul>
                  {offers.map((offer) => (
                    <>
                    <li key={offer.id} className="mb-2 border p-2 rounded">
                      <p><strong>Price:</strong> {offer.price}</p>
                      <p><strong>Message:</strong> {offer.message}</p>
                      <p><strong>Status:</strong> {offer.status}</p>
                      <p><small>Created: {new Date(offer.createdAt).toLocaleString()}</small></p>
                    </li>
                    <button
                        onClick={(e) => {
                          e.stopPropagation()
                          actionOffer(offer,'accept')
                        }}
                        className="bg-green-600 text-white px-2 py-1 rounded"
                      >
                        Accept
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          actionOffer(offer,'reject')
                        }}
                        className="bg-red-600 text-white px-2 py-1 rounded"
                      >
                        Reject
                      </button>
                    </>
                    
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </div>}
    </>
  )
}
