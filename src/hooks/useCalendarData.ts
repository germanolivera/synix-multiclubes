import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Espacio, Sesion, Actividad, Deporte } from '../types/database.types'
import { useAuth } from '../contexts/AuthContext'
import { useBranch } from '../contexts/BranchContext'

export function useCalendarData(selectedDate: Date) {
    const { session } = useAuth()
    const { activeClub, loadingBranch } = useBranch()
    const [espacios, setEspacios] = useState<Espacio[]>([])
    const [sesiones, setSesiones] = useState<Sesion[]>([])
    const [actividades, setActividades] = useState<Actividad[]>([])
    const [deportes, setDeportes] = useState<Deporte[]>([])
    const [empleados, setEmpleados] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        // Only fetch if we have an active session and active club
        if (!session || !activeClub) {
            // If branch context is done loading and we still don't have an active club, stop our loader
            if (!loadingBranch) {
                setLoading(false)
            }
            return
        }

        let isMounted = true

        async function fetchData() {
            if (!activeClub) return
            try {
                setLoading(true)
                setError(null)

                // 1. Fetch Espacios (Courts)
                // Note: RLS handles the organization filtering, but we filter for the active club specifically
                const { data: espaciosData, error: espaciosError } = await supabase
                    .from('espacios')
                    .select('*, club_deportes(nombre)')
                    .eq('club_id', activeClub.id)
                    .eq('estado', 'Activo')
                    .order('nombre')

                if (espaciosError) throw espaciosError

                // 2. Fetch Sessions for the selected Date
                // Construct day boundaries
                const startOfDay = new Date(selectedDate)
                startOfDay.setHours(0, 0, 0, 0)

                const endOfDay = new Date(selectedDate)
                endOfDay.setHours(23, 59, 59, 999)

                const { data: sesionesData, error: sesionesError } = await supabase
                    .from('sesiones')
                    .select('*, clientes_globales(nombre, apellido, telefono)')
                    .eq('club_id', activeClub.id)
                    .gte('inicio', startOfDay.toISOString())
                    .lte('inicio', endOfDay.toISOString()) // Filter by START date only so overnight sessions are included

                if (sesionesError) throw sesionesError

                // 3. Fetch Actividades (for the booking dropdown)
                const { data: actividadesData, error: actividadesError } = await supabase
                    .from('actividades')
                    .select('*')
                    .eq('club_id', activeClub.id)
                    .eq('activo', true)
                    .order('nombre')

                if (actividadesError) throw actividadesError

                // 4. Fetch Deportes (for multideporte spaces)
                const { data: deportesData, error: deportesError } = await supabase
                    .from('club_deportes')
                    .select('*')
                    .eq('club_id', activeClub.id)
                    .eq('activo', true)
                    .order('nombre')

                if (deportesError) throw deportesError

                // 5. Fetch Empleados (for showing who created the session)
                const { data: empleadosData, error: empleadosError } = await supabase
                    .from('perfiles_empleados')
                    .select('user_id, nombre, apellido')
                    .eq('organizacion_id', activeClub.organizacion_id || session?.user?.app_metadata?.organizacion_id)

                if (empleadosError) {
                    console.error("Error fetching empleados:", empleadosError)
                    // Non-fatal error
                }

                if (isMounted) {
                    setEspacios(espaciosData as Espacio[])
                    setSesiones(sesionesData as Sesion[])
                    setActividades(actividadesData as Actividad[])
                    setDeportes(deportesData as Deporte[])
                    setEmpleados(empleadosData || [])
                }
            } catch (err: any) {
                if (isMounted) {
                    console.error("Error fetching calendar data:", err)
                    setError(err.message || 'Error cargando datos del calendario')
                }
            } finally {
                if (isMounted) {
                    setLoading(false)
                }
            }
        }

        fetchData()

        return () => {
            isMounted = false
        }
    }, [selectedDate, session, activeClub, loadingBranch])

    const refreshSessions = async () => {
        if (!session || !activeClub) return
        const startOfDay = new Date(selectedDate)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(selectedDate)
        endOfDay.setHours(23, 59, 59, 999)

        const { data, error } = await supabase
            .from('sesiones')
            .select('*, clientes_globales(nombre, apellido, telefono)')
            .eq('club_id', activeClub.id)
            .gte('inicio', startOfDay.toISOString())
            .lte('inicio', endOfDay.toISOString()) // Filter by START date only so overnight sessions are included

        if (!error && data) {
            setSesiones(data as Sesion[])
        }
    }

    return { espacios, sesiones, actividades, deportes, empleados, loading, error, refreshSessions }
}
