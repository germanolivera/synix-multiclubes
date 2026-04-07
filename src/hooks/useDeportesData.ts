import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Deporte } from '../types/database.types'
import { useAuth } from '../contexts/AuthContext'
import { useBranch } from '../contexts/BranchContext'

export function useDeportesData() {
    const { session } = useAuth()
    const { activeClub, loadingBranch } = useBranch()
    const [deportes, setDeportes] = useState<Deporte[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchDeportes = useCallback(async () => {
        if (!session || !activeClub) return

        try {
            setLoading(true)
            setError(null)

            const { data, error: fetchError } = await supabase
                .from('club_deportes')
                .select('*')
                .eq('club_id', activeClub.id)
                .eq('activo', true)
                .order('nombre')

            if (fetchError) throw fetchError

            setDeportes((data as any[]).map(row => ({
                ...row,
                niveles_posibles: row.niveles_posibles || []
            })))
        } catch (err: any) {
            console.error("Error fetching deportes:", err)
            setError(err.message || 'Error cargando deportes')
        } finally {
            setLoading(false)
        }
    }, [session, activeClub])

    useEffect(() => {
        let isMounted = true
        if (session && activeClub && isMounted) {
            fetchDeportes()
        } else if (!loadingBranch && (!session || !activeClub) && isMounted) {
            setLoading(false)
        }
        return () => { isMounted = false }
    }, [session, activeClub, loadingBranch, fetchDeportes])

    return { deportes, loading, error, refreshDeportes: fetchDeportes }
}
