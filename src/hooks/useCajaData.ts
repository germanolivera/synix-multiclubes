import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Sesion, SesionItem } from '../types/database.types'
import { useAuth } from '../contexts/AuthContext'
import { useBranch } from '../contexts/BranchContext'

export interface CajaSummary {
    totalRecaudado: number;
    totalAlquileres: number;
    totalKiosco: number;
    cantidadTurnos: number;
    turnosPagados: number;
    turnosPendientes: number;
    turnosSenados: number;
}

export interface SessionWithItems extends Sesion {
    cliente?: { nombre: string, apellido: string } | null;
    espacio?: { nombre: string } | null;
    actividad?: { nombre: string } | null;
    items?: SesionItem[];
}

export function useCajaData(selectedDate: Date) {
    const { session } = useAuth()
    const { activeClub } = useBranch()
    const [sesiones, setSesiones] = useState<SessionWithItems[]>([])
    const [summary, setSummary] = useState<CajaSummary>({
        totalRecaudado: 0,
        totalAlquileres: 0,
        totalKiosco: 0,
        cantidadTurnos: 0,
        turnosPagados: 0,
        turnosPendientes: 0,
        turnosSenados: 0
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let mounted = true

        const fetchCaja = async () => {
            if (!session || !activeClub) return

            try {
                setLoading(true)
                setError(null)

                // 1. Define day boundaries
                const startOfDay = new Date(selectedDate)
                startOfDay.setHours(0, 0, 0, 0)
                const endOfDay = new Date(selectedDate)
                endOfDay.setHours(23, 59, 59, 999)

                // 2. Query sessions with joined client, space, activity, and items
                const { data: sesionesData, error: sesionesError } = await supabase
                    .from('sesiones')
                    .select(`
                        *,
                        cliente:clientes_globales(nombre, apellido),
                        espacio:espacios(nombre),
                        actividad:actividades(nombre),
                        items:sesion_items(*)
                    `)
                    .eq('club_id', activeClub.id)
                    .gte('inicio', startOfDay.toISOString())
                    .lte('inicio', endOfDay.toISOString())
                    .order('inicio', { ascending: true })

                if (sesionesError) throw sesionesError
                if (!mounted) return

                const typedSesiones = (sesionesData || []) as any[]

                // 3. Compute aggregations
                let recTotal = 0
                let recAlq = 0
                let recKiosco = 0
                let cantTurnos = typedSesiones.length
                let cPagados = 0
                let cPendientes = 0
                let cSenados = 0

                typedSesiones.forEach(s => {
                    // Status counters
                    if (s.estado_pago === 'pagado') cPagados++
                    else if (s.estado_pago === 'seña') cSenados++
                    else if (s.estado_pago === 'pendiente') cPendientes++
                    else cPendientes++ // Default to pending 

                    // Revenue breakdown from items
                    const items = s.items || []
                    if (items.length > 0) {
                        items.forEach((item: SesionItem) => {
                            const lineTotal = item.precio * item.cantidad
                            recTotal += lineTotal
                            if (item.es_alquiler) {
                                recAlq += lineTotal
                            } else {
                                recKiosco += lineTotal
                            }
                        })
                    } else if (s.precio) {
                        // Fallback if session has legacy price without items
                        recTotal += s.precio
                        recAlq += s.precio // Assume pure session cost is rental
                    }
                })

                if (mounted) {
                    setSesiones(typedSesiones)
                    setSummary({
                        totalRecaudado: recTotal,
                        totalAlquileres: recAlq,
                        totalKiosco: recKiosco,
                        cantidadTurnos: cantTurnos,
                        turnosPagados: cPagados,
                        turnosSenados: cSenados,
                        turnosPendientes: cPendientes
                    })
                }

            } catch (err: any) {
                console.error("Error loading caja data:", err)
                if (mounted) setError(err.message)
            } finally {
                if (mounted) setLoading(false)
            }
        }

        fetchCaja()

        return () => {
            mounted = false
        }
    }, [session, activeClub, selectedDate])

    return { sesiones, summary, loading, error }
}
