import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useBranch } from '../contexts/BranchContext'
import { useAuth } from '../contexts/AuthContext'
import { CategoriaArticulo } from './useCategoriasData'

export interface Articulo {
    id: string;
    club_id: string;
    categoria_id: string;
    nombre: string;
    precio: number;
    controla_stock: boolean;
    stock_actual: number;
    activo: boolean;
    created_at?: string;
    // Joined data
    categoria?: CategoriaArticulo;
}

export function useArticulosData() {
    const { activeClub } = useBranch()
    const { session } = useAuth()
    const [articulos, setArticulos] = useState<Articulo[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchArticulos = useCallback(async () => {
        if (!session || !activeClub) {
            setArticulos([])
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            const { data, error: fetchError } = await supabase
                .from('articulos')
                .select(`
                    *,
                    categoria:categorias_articulos(id, nombre, descripcion, estado)
                `)
                .eq('club_id', activeClub.id)
                .order('nombre')

            if (fetchError) throw fetchError

            // Format joined data if necessary
            setArticulos(data || [])
            setError(null)
        } catch (err: any) {
            console.error('Error fetching articulos:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [activeClub, session])

    useEffect(() => {
        fetchArticulos()
    }, [fetchArticulos])

    return {
        articulos,
        loading,
        error,
        refreshArticulos: fetchArticulos
    }
}
