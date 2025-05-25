'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import router from 'next/router'
import { useState } from 'react'

interface AuthFormProps {
  type: 'signup' | 'login'
}

export default function AuthForm({ type }: AuthFormProps) {
  const router = useRouter()
  const [userType, setUserType] = useState<'user' | 'provider'>('user')
  const [loading, setLoading] = useState<boolean>(false)
  const [providerType, setProviderType] = useState<'individual' | 'company'>('individual')

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    userType: 'user',
    providerType: 'individual',
    firstName: '',
    lastName: '',
    companyName: '',
    phoneNumber: '',
    businessTaxNumber: '',
    mobile: '',
    streetNumber: '',
    streetName: '',
    city: '',
    state: '',
    postalCode: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const endpoint = type === 'signup' ? '/api/auth/signup' : '/api/auth/login'

    const headers: any = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-call-stack-id': crypto.randomUUID() }, // Use Web Crypto API for trace ID
      body: JSON.stringify({ ...formData, userType, providerType }),
    }

    if (type !== 'signup') {
      headers['credentials'] = 'include' // Include credentials for login
    }

    setLoading(true)
    const res = await fetch(endpoint, headers)

    if (res.ok) {
      setLoading(false)
      alert(`${type} successful`)
      router.push('/tasks') // Redirect to dashboard or home page
    } else {
      setLoading(false)
      const err = await res.json()
      alert(err.message || 'Something went wrong')
    }
  }

  return (
    <>
      {loading && <div className="text-center">Loading...</div>}
      {loading && <div className="text-center">Welcome to the platform!</div>}
      {loading && <div className="text-center">Please fill in the form below:</div>}

      {!loading &&
        <form onSubmit={handleSubmit} className="space-y-4 max-w-xl mx-auto mt-10">
          <h1 className="text-2xl font-bold">{type === 'signup' ? 'Signup' : 'Login'}</h1>

          {/* Email always required */}
          <label className="block">
            Email:
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full p-2 border"
            />
          </label>

          {type === 'signup' && (
            <>
              {/* User Type */}
              <label className="block">
                User Type:
                <select
                  name="userType"
                  value={userType}
                  onChange={(e) => setUserType(e.target.value as 'user' | 'provider')}
                  className="w-full p-2 border"
                >
                  <option value="user">User</option>
                  <option value="provider">Provider</option>
                </select>
              </label>

              {/* Provider Type - Only if provider */}
              {userType === 'provider' && (
                <label className="block">
                  Provider Type:
                  <select
                    name="providerType"
                    value={providerType}
                    onChange={(e) => setProviderType(e.target.value as 'individual' | 'company')}
                    className="w-full p-2 border"
                  >
                    <option value="individual">Individual</option>
                    <option value="company">Company</option>
                  </select>
                </label>
              )}

              {/* Individual Fields */}
              {(userType === 'user' || (userType === 'provider' && providerType === 'individual')) && (
                <>
                  <label className="block">
                    First Name:
                    <input name="firstName" value={formData.firstName} onChange={handleChange} className="w-full p-2 border" />
                  </label>
                  <label className="block">
                    Last Name:
                    <input name="lastName" value={formData.lastName} onChange={handleChange} className="w-full p-2 border" />
                  </label>
                  <label className="block">
                    Mobile:
                    <input name="mobile" value={formData.mobile} onChange={handleChange} className="w-full p-2 border" />
                  </label>
                  <label className="block">
                    Street Number:
                    <input name="streetNumber" value={formData.streetNumber} onChange={handleChange} className="w-full p-2 border" />
                  </label>
                  <label className="block">
                    Street Name:
                    <input name="streetName" value={formData.streetName} onChange={handleChange} className="w-full p-2 border" />
                  </label>
                  <label className="block">
                    City/Suburb:
                    <input name="city" value={formData.city} onChange={handleChange} className="w-full p-2 border" />
                  </label>
                  <label className="block">
                    State:
                    <input name="state" value={formData.state} onChange={handleChange} className="w-full p-2 border" />
                  </label>
                  <label className="block">
                    Postal Code:
                    <input name="postalCode" value={formData.postalCode} onChange={handleChange} className="w-full p-2 border" />
                  </label>
                </>
              )}

              {/* Company Fields */}
              {userType === 'provider' && providerType === 'company' && (
                <>
                  <label className="block">
                    Company Name:
                    <input name="companyName" value={formData.companyName} onChange={handleChange} className="w-full p-2 border" />
                  </label>
                  <label className="block">
                    Phone Number:
                    <input name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="w-full p-2 border" />
                  </label>
                  <label className="block">
                    Business Tax Number:
                    <input name="businessTaxNumber" value={formData.businessTaxNumber} maxLength={10} onChange={handleChange} className="w-full p-2 border" />
                  </label>
                  <label className="block">
                    Representative First Name:
                    <input name="firstName" value={formData.firstName} onChange={handleChange} className="w-full p-2 border" />
                  </label>
                  <label className="block">
                    Representative Last Name:
                    <input name="lastName" value={formData.lastName} onChange={handleChange} className="w-full p-2 border" />
                  </label>
                  <label className="block">
                    Mobile:
                    <input name="mobile" value={formData.mobile} onChange={handleChange} className="w-full p-2 border" />
                  </label>
                  {/* Address optional */}
                  <label className="block">
                    Street Number (optional):
                    <input name="streetNumber" value={formData.streetNumber} onChange={handleChange} className="w-full p-2 border" />
                  </label>
                  <label className="block">
                    Street Name (optional):
                    <input name="streetName" value={formData.streetName} onChange={handleChange} className="w-full p-2 border" />
                  </label>
                  <label className="block">
                    City/Suburb (optional):
                    <input name="city" value={formData.city} onChange={handleChange} className="w-full p-2 border" />
                  </label>
                  <label className="block">
                    State (optional):
                    <input name="state" value={formData.state} onChange={handleChange} className="w-full p-2 border" />
                  </label>
                  <label className="block">
                    Postal Code (optional):
                    <input name="postalCode" value={formData.postalCode} onChange={handleChange} className="w-full p-2 border" />
                  </label>
                </>
              )}
            </>
          )}

          {/* Password always required */}
          <label className="block">
            Password:
            <input type="password" name="password" value={formData.password} onChange={handleChange} className="w-full p-2 border" required />
          </label>

          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
            {type === 'signup' ? 'Create Account' : 'Login'}
          </button>

          {type === 'login' && (
            <div>
              <Link href="/signup">
                <button type="button" className="bg-blue-600 text-white px-4 py-2 rounded">
                  Signup
                </button>
              </Link>
            </div>
          )}
        </form>
      }
    </>
  )
}
