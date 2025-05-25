'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Skill {
  id: string
  category: string
  experience: string
  natureOfWork: 'online' | 'onsite'
  hourlyRate: number
}

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function fetchSkills() {
      const res = await fetch('/api/skills', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          'x-api-call-stack-id': crypto.randomUUID(), // Use Web Crypto API for trace ID
        },
      })

      if (res.ok) {
        const data = await res.json()
        console.log('Fetched skills:', data)
        setSkills(data.skills)
      } else {
        alert('Failed to load skills')
      }
      setLoading(false)
    }

    fetchSkills()
  }, [])

  if (loading) return <p>Loading skills...</p>

  return (
    <div className="max-w-3xl mx-auto mt-10">
      <h1 className="text-3xl font-bold mb-6">My Skills</h1>

      <button
        className="mb-4 bg-blue-600 text-white px-4 py-2 rounded"
        onClick={() => router.push('/skills/new')}
      >
        Add New Skill
      </button>

      {skills.length === 0 ? (
        <p>No skills found.</p>
      ) : (
        <ul className="space-y-3">
          {skills.map((skill) => (
            <li
              key={skill.id}
              className="p-4 border rounded flex justify-between items-center cursor-pointer"
              onClick={() => router.push(`/skills/${skill.id}/edit`)}
            >
              <div>
                <p className="font-semibold">{skill.category}</p>
                <p>{skill.experience} years — {skill.natureOfWork}</p>
                <p>${skill.hourlyRate} / hour</p>
              </div>
              <button
                onClick={async (e) => {
                  e.stopPropagation()
                  if (confirm('Are you sure you want to delete this skill?')) {
                    const res = await fetch(`/api/skills/${skill.id}`, {
                      method: 'DELETE',
                      headers: {
                        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
                      },
                    })
                    if (res.ok) {
                      setSkills(skills.filter((s) => s.id !== skill.id))
                    } else {
                      alert('Failed to delete skill')
                    }
                  }
                }}
                className="bg-red-600 text-white px-3 py-1 rounded"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
