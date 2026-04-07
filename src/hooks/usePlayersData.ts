import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { ClienteGlobal } from '../types/database.types'
import { useAuth } from '../contexts/AuthContext'
import { useBranch } from '../contexts/BranchContext'

export function usePlayersData() {
    const { session } = useAuth()
    const { activeClub, loadingBranch } = useBranch()
    const [players, setPlayers] = useState<ClienteGlobal[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchPlayers = useCallback(async () => {
        if (!session || !activeClub) return

        try {
            setLoading(true)
            setError(null)

            const { data, error: fetchError } = await supabase
                .from('clientes_globales')
                .select('*')
                .eq('club_id', activeClub.id)
                .eq('activo', true)
                .order('nombre')
                .order('apellido')

            if (fetchError) throw fetchError

            setPlayers(data as ClienteGlobal[])
        } catch (err: any) {
            console.error("Error fetching players:", err)
            setError(err.message || 'Error cargando jugadores')
        } finally {
            setLoading(false)
        }
    }, [session, activeClub])

    useEffect(() => {
        let isMounted = true

        if (session && activeClub && isMounted) {
            fetchPlayers()
        } else if (!loadingBranch && (!session || !activeClub) && isMounted) {
            setLoading(false)
        }

        return () => {
            isMounted = false
        }
    }, [session, activeClub, loadingBranch, fetchPlayers])

    return { players, loading, error, refreshPlayers: fetchPlayers }
}
