import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useBranch } from '../contexts/BranchContext'
import { useAuth } from '../contexts/AuthContext'

export interface CategoriaArticulo {
    id: string;
    club_id: string;
    nombre: string;
    descripcion?: string | null;
    estado: boolean;
    created_at?: string;
}

export function useCategoriasData() {
    const { activeClub, loadingBranch } = useBranch()
    const { session } = useAuth()
    const [categorias, setCategorias] = useState<CategoriaArticulo[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchCategorias = useCallback(async () => {
        if (!session || !activeClub) {
            if (!loadingBranch) {
                setCategorias([])
                setLoading(false)
            }
            return
        }

        try {
            setLoading(true)
            const { data, error: fetchError } = await supabase
                .from('categorias_articulos')
                .select('*')
                .eq('club_id', activeClub.id)
                .order('nombre')

            if (fetchError) throw fetchError
            setCategorias(data || [])
            setError(null)
        } catch (err: any) {
            console.error('Error fetching categorias:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [activeClub, session, loadingBranch])

    useEffect(() => {
        fetchCategorias()
    }, [fetchCategorias])

    return {
        categorias,
        loading,
        error,
        refreshCategorias: fetchCategorias
    }
}
