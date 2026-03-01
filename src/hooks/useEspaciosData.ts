import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Espacio } from '../types/database.types'
import { useAuth } from '../contexts/AuthContext'
import { useBranch } from '../contexts/BranchContext'

export function useEspaciosData() {
    const { session } = useAuth()
    const { activeClub } = useBranch()
    const [espacios, setEspacios] = useState<Espacio[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchEspacios = async () => {
        if (!session || !activeClub) return

        try {
            setLoading(true)
            setError(null)

            const { data, error: fetchError } = await supabase
                .from('espacios')
                .select('*, club_deportes(nombre)')
                .eq('club_id', activeClub.id)
                .order('nombre')

            if (fetchError) throw fetchError

            setEspacios((data as any[]).map(row => ({
                ...row,
                caracteristicas: row.caracteristicas || {}
            })))
        } catch (err: any) {
            console.error("Error fetching espacios:", err)
            setError(err.message || 'Error cargando espacios')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        let isMounted = true

        if (session && activeClub && isMounted) {
            fetchEspacios()
        }

        return () => {
            isMounted = false
        }
    }, [session, activeClub])

    return { espacios, loading, error, refreshEspacios: fetchEspacios }
}
