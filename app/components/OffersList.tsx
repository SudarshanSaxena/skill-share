'use client'

import { useEffect, useState } from 'react'

interface Provider {
  id: string
  firstName?: string | null
  lastName?: string | null
  providerType?: 'individual' | 'company' | null
  companyName?: string | null
}

interface Offer {
  id: string
  status: string
  createdAt: string
  provider: Provider
}

interface OffersListProps {
  taskId: string
}

export default function OffersList({ taskId }: OffersListProps) {
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchOffers() {
      setLoading(true)
      setError('')
      try {
        const token = localStorage.getItem('token') || ''
        const res = await fetch(`/api/offers/task/${taskId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        if (!res.ok) {
          const errorData = await res.json()
          setError(errorData.message || 'Failed to fetch offers')
          setLoading(false)
          return
        }
        const data = await res.json()
        setOffers(data.offers)
      } catch (err) {
        setError('Failed to fetch offers')
      } finally {
        setLoading(false)
      }
    }

    fetchOffers()
  }, [taskId])

  if (loading) return <p>Loading offers...</p>
  if (error) return <p className="text-red-600">{error}</p>
  if (offers.length === 0) return <p>No offers found for this task.</p>

  return (
    <div className="space-y-4">
      {offers.map((offer) => (
        <div key={offer.id} className="border p-4 rounded shadow">
          <p>
            <strong>Provider:</strong>{' '}
            {offer.provider.providerType === 'company'
              ? offer.provider.companyName || 'Company Provider'
              : `${offer.provider.firstName || ''} ${offer.provider.lastName || ''}`}
          </p>
          <p>
            <strong>Status:</strong> {offer.status}
          </p>
          <p>
            <strong>Offered on:</strong> {new Date(offer.createdAt).toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
  )
}
