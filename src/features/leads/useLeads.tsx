import { useEffect, useState } from 'react'
import type { Lead } from '@/types'

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLeads = async () => {
    setLoading(true)
    try {
      const res = await fetch('http://localhost:8080/leads/')
      if (res.ok) {
        const data = await res.json()
        console.log("data", data);
        setLeads(data.data)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeads()
  }, [])

  return { leads, loading, fetchLeads }
}
