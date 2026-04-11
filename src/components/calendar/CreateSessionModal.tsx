import { useState, useEffect, useMemo, useRef } from 'react'
import Modal from '../ui/Modal'
import { Espacio, Actividad, Deporte, SesionItem, PerfilEmpleado, Sesion } from '../../types/database.types'
import { supabase } from '../../lib/supabase'
import { useBranch } from '../../contexts/BranchContext'
import { useAuth } from '../../contexts/AuthContext'
import { usePlayersData } from '../../hooks/usePlayersData'
import { useArticulosData } from '../../hooks/useArticulosData'
import PlayerModal from '../jugadores/PlayerModal'
import { Calendar as CalendarIcon, Search, Package, Trash2, Plus, Minus, X } from 'lucide-react'

interface CreateSessionModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    selectedDate: Date
    timeString: string // Default formatted like "15:00" or "08:30"
    espacio: Espacio | null
    actividades: Actividad[]
    deportes: Deporte[]
    empleados: PerfilEmpleado[]
    editSession?: Sesion | null
}

const DURATION_OPTIONS = [15, 30, 60, 90, 120, 240]

export default function CreateSessionModal({
    isOpen,
    onClose,
    onSuccess,
    selectedDate,
    timeString,
    espacio,
    actividades,
    deportes,
    empleados,
    editSession
}: CreateSessionModalProps) {
    const { session } = useAuth()
    const { activeClub } = useBranch()
    const { players, refreshPlayers } = usePlayersData()
    const { articulos } = useArticulosData()

    // State
    const [actividadId, setActividadId] = useState(actividades.length > 0 ? actividades[0].id : '')
    const [deporteId, setDeporteId] = useState('')
    const [selectedTime, setSelectedTime] = useState(timeString)
    const [selectedDuration, setSelectedDuration] = useState(60)
    const [estadoPago, setEstadoPago] = useState('pendiente')
    const [anotaciones, setAnotaciones] = useState('')

    // Items state
    const [sesionItems, setSesionItems] = useState<SesionItem[]>([])
    const [itemSearchTerm, setItemSearchTerm] = useState('')
    const [isItemDropdownOpen, setIsItemDropdownOpen] = useState(false)

    // Player Search State
    const [playerSearchTerm, setPlayerSearchTerm] = useState('')
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [selectedPlayer, setSelectedPlayer] = useState<{ id: string, nombre: string, apellido: string, telefono: string | null } | null>(null)
    const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false)

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Computed total
    const totalPrice = useMemo(
        () => sesionItems.reduce((sum, item) => sum + item.precio * item.cantidad, 0),
        [sesionItems]
    )

    // Prevent form from resetting when background data changes (like player refresh)
    const hasInitialized = useRef(false)

    // Sync state when opened
    useEffect(() => {
        if (!isOpen) {
            hasInitialized.current = false
            return
        }

        if (hasInitialized.current) return

        setPlayerSearchTerm('')
        setIsDropdownOpen(false)
        setItemSearchTerm('')
        setIsItemDropdownOpen(false)
        setError(null)

        if (editSession) {
            // Edit Mode: Pre-fill data
            const start = new Date(editSession.inicio)
            const end = new Date(editSession.fin)
            const diffMs = end.getTime() - start.getTime()
            const durationMins = Math.round(diffMs / 60000)
            
            const editTimeStr = `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`

            setSelectedTime(editTimeStr)
            setSelectedDuration(durationMins)
            setActividadId(editSession.actividad_id || (espacio?.es_multideporte ? '' : (actividades.length > 0 ? actividades[0].id : '')))
            setDeporteId(editSession.deporte_id || '')
            setEstadoPago(editSession.estado_pago || 'pendiente')
            setAnotaciones(editSession.anotaciones || '')

            if (editSession.cliente_id) {
                const p = players.find(x => x.id === editSession.cliente_id)
                if (p) setSelectedPlayer(p)
            } else {
                setSelectedPlayer(null)
            }

            // Load existing items from DB
            supabase
                .from('sesion_items')
                .select('*')
                .eq('sesion_id', editSession.id)
                .then(({ data }) => {
                    if (data && data.length > 0) {
                        setSesionItems(data as SesionItem[])
                    } else {
                        setSesionItems([])
                    }
                })
        } else {
            // Create Mode: Reset to defaults
            setSelectedTime(timeString)
            setActividadId(espacio?.es_multideporte ? '' : (actividades.length > 0 ? actividades[0].id : ''))
            setDeporteId('')
            setSelectedDuration(60)
            setSelectedPlayer(null)
            setEstadoPago('pendiente')
            setAnotaciones('')
            setSesionItems([])
        }

        hasInitialized.current = true
    }, [isOpen, timeString, actividades, editSession, players, espacio?.es_multideporte])

    // Specific effect to hydrate the player in Edit Mode if players list loads late
    // Only runs once per modal open — does NOT re-hydrate after the user manually clears the player
    const playerHydrated = useRef(false)
    useEffect(() => {
        if (!isOpen) {
            playerHydrated.current = false
            return
        }
        if (playerHydrated.current) return
        if (editSession?.cliente_id && players.length > 0 && !selectedPlayer) {
            const p = players.find(x => x.id === editSession.cliente_id)
            if (p) {
                setSelectedPlayer(p)
                playerHydrated.current = true
            }
        }
    }, [isOpen, editSession, players, selectedPlayer])

    if (!espacio) return null

    // Format date for inputs
    const formattedDate = selectedDate.toISOString().split('T')[0]

    // Form submission
    const handleSubmit = async () => {
        if (!activeClub?.id) {
            setError("Error: No hay una Sede activa seleccionada.")
            return
        }
        if (!selectedPlayer) {
            setError("Debe seleccionar una persona para el turno.")
            return
        }
        if (espacio?.es_multideporte && !deporteId) {
            setError("Debe seleccionar un deporte para este espacio multideportes.")
            return
        }
        setError(null)
        setLoading(true)

        try {
            const inicio = new Date(selectedDate)
            const [hours, minutes] = selectedTime.split(':').map(Number)
            inicio.setHours(hours, minutes, 0, 0)
            const fin = new Date(inicio.getTime() + selectedDuration * 60000)

            // Overlap Validation
            let overlapQuery = supabase
                .from('sesiones')
                .select('id', { count: 'exact' })
                .eq('club_id', activeClub.id)
                .eq('espacio_id', espacio.id)
                // Overlap condition: existing.inicio < new.fin AND existing.fin > new.inicio
                .lt('inicio', fin.toISOString())
                .gt('fin', inicio.toISOString())

            if (editSession) {
                overlapQuery = overlapQuery.neq('id', editSession.id)
            }

            const { count, error: overlapError } = await overlapQuery

            if (overlapError) throw overlapError

            if (count && count > 0) {
                setError("No se puede guardar: El turno se superpone con otro turno existente en esta cancha para este horario.")
                setLoading(false)
                return
            }

            const grandTotal = sesionItems.reduce((s, i) => s + i.precio * i.cantidad, 0)

            const payload: any = {
                club_id: activeClub.id,
                espacio_id: espacio.id,
                inicio: inicio.toISOString(),
                fin: fin.toISOString(),
                capacidad_total: espacio.capacidad,
                plazas_disponibles: espacio.capacidad,
                precio: grandTotal,
                estado_pago: estadoPago,
                anotaciones: anotaciones ? anotaciones.trim() : null
            }

            if (actividadId) payload.actividad_id = actividadId
            if (espacio?.es_multideporte && deporteId) payload.deporte_id = deporteId
            if (selectedPlayer) payload.cliente_id = selectedPlayer.id

            let sesionId: string

            const oldItemsMap = new Map<string, number>()

            if (editSession) {
                // Fetch old items to calculate stock difference later
                const { data: oldItems } = await supabase.from('sesion_items').select('articulo_id, cantidad').eq('sesion_id', editSession.id)
                if (oldItems) {
                    oldItems.forEach(oi => {
                        if (oi.articulo_id) {
                            const current = oldItemsMap.get(oi.articulo_id) || 0
                            oldItemsMap.set(oi.articulo_id, current + Number(oi.cantidad || 1))
                        }
                    })
                }

                const { error: updateError } = await supabase
                    .from('sesiones')
                    .update(payload)
                    .eq('id', editSession.id)
                if (updateError) throw updateError
                sesionId = editSession.id
                // Delete old items before re-inserting
                await supabase.from('sesion_items').delete().eq('sesion_id', sesionId)
            } else {
                if (session?.user?.id) payload.created_by = session.user.id
                const { data: newSesion, error: insertError } = await supabase
                    .from('sesiones')
                    .insert([payload])
                    .select()
                    .single()
                if (insertError) throw insertError
                sesionId = newSesion.id
            }

            // Save all items
            const newItemsMap = new Map<string, number>()
            if (sesionItems.length > 0) {
                const itemsPayload = sesionItems.map(item => {
                    if (item.articulo_id) {
                        const current = newItemsMap.get(item.articulo_id) || 0
                        newItemsMap.set(item.articulo_id, current + Number(item.cantidad || 1))
                    }
                    return {
                        sesion_id: sesionId,
                        club_id: activeClub.id,
                        articulo_id: item.articulo_id || null,
                        nombre: item.nombre,
                        precio: item.precio,
                        cantidad: Number(item.cantidad || 1),
                        es_alquiler: item.es_alquiler
                    }
                })
                const { error: itemsError } = await supabase.from('sesion_items').insert(itemsPayload)
                if (itemsError) throw itemsError
            }

            // Sync stock differences
            const oldKeys = Array.from(oldItemsMap.keys())
            const newKeys = Array.from(newItemsMap.keys())
            const allArticleIds = new Set([...oldKeys, ...newKeys])
            
            for (const artId of allArticleIds) {
                const oldQty = oldItemsMap.get(artId) || 0
                const newQty = newItemsMap.get(artId) || 0
                const netSales = Number(newQty) - Number(oldQty) // positive = reduce stock, negative = restore stock
                
                if (netSales !== 0) {
                     const { data: art } = await supabase.from('articulos').select('stock_actual, controla_stock').eq('id', artId).single()
                     if (art && art.controla_stock) {
                         const currentStock = Number(art.stock_actual) || 0
                         const newStock = Math.max(0, currentStock - netSales)
                         await supabase.from('articulos').update({ stock_actual: newStock }).eq('id', artId)
                     }
                }
            }

            onSuccess()
            onClose()
        } catch (err: any) {
            setError(err.message || 'Error al guardar reserva')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!editSession) return

        if (!window.confirm('¿Estás seguro que deseas eliminar este turno?')) return

        try {
            setLoading(true)

            // Refund stock for deleted session
            const { data: oldItems } = await supabase.from('sesion_items').select('articulo_id, cantidad').eq('sesion_id', editSession.id)
            if (oldItems) {
                for (const oi of oldItems) {
                    if (oi.articulo_id) {
                        const { data: art } = await supabase.from('articulos').select('stock_actual, controla_stock').eq('id', oi.articulo_id).single()
                        if (art && art.controla_stock) {
                            const newStock = (Number(art.stock_actual) || 0) + Number(oi.cantidad || 1)
                            await supabase.from('articulos').update({ stock_actual: newStock }).eq('id', oi.articulo_id)
                        }
                    }
                }
            }

            const { error: deleteError } = await supabase
                .from('sesiones')
                .delete()
                .eq('id', editSession.id)

            if (deleteError) throw deleteError

            onSuccess()
            onClose()
        } catch (err: any) {
            setError(err.message || 'Error al eliminar reserva')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={editSession ? "Editar Turno" : "Nuevo Turno"} maxWidth="max-w-4xl">
            {/* 
              Bulletproof layout wrapper: 
              We remove the modal padding with -m-6, and define a flex column.
              We constrain the max height so it fits on laptop screens, enabling inner scrolling.
            */}
            <div className="-m-6 flex flex-col bg-background border-t border-border max-h-[calc(100vh-8rem)]">

                {/* UP PANE: Paneles Divididos (Izquierda y Derecha) */}
                <div className="flex flex-col md:flex-row flex-1 overflow-hidden">

                    {/* LEFT PANE - Detalles del Turno */}
                    <div className="flex-1 p-6 border-r border-border flex flex-col overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-center border-b border-border pb-2 mb-6 shrink-0">
                            <h3 className="text-sm font-medium text-textMuted">Detalles del Turno</h3>
                            {editSession?.created_by && (
                                <span className="text-[11px] text-textMuted bg-surface px-2 py-1 rounded-md border border-border">
                                    Creado por: <span className="font-medium text-textMain">
                                        {empleados.find(e => e.user_id === editSession.created_by) 
                                        ? `${empleados.find(e => e.user_id === editSession.created_by)?.nombre} ${empleados.find(e => e.user_id === editSession.created_by)?.apellido || ''}`.trim()
                                        : (session?.user?.id === editSession.created_by ? 'Vos (Titular)' : 'Titular')
                                        }
                                    </span>
                                </span>
                            )}
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-3 rounded-md mb-4 shrink-0">
                                {error}
                            </div>
                        )}

                        <div className="space-y-6 flex-1 pr-2">
                            {/* Cancha y Actividad */}
                            <div className="space-y-4 bg-surface/30 p-4 border border-border rounded-xl shrink-0">
                                <div>
                                    <label className="block text-[13px] font-medium text-textMain mb-1.5">Cancha</label>
                                    <div className="flex items-center gap-2">
                                        <select
                                            disabled
                                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-textMain appearance-none opacity-80"
                                        >
                                            <option>{espacio.nombre} {espacio.club_deportes?.nombre ? `(${espacio.club_deportes.nombre})` : ''}</option>
                                        </select>
                                        {espacio.es_multideporte && (
                                            <span className="shrink-0 px-2 py-1 text-[10px] font-medium rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">
                                                Multi
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* For multideporte: show Deportes dropdown. For regular: show Actividad if >1 */}
                                {espacio.es_multideporte ? (
                                    <div>
                                        <label className="block text-[13px] font-medium text-textMain mb-1.5">
                                            Deporte / Actividad <span className="text-red-500">*</span>
                                        </label>
                                        <p className="text-[11px] text-textMuted mb-2">Seleccioná a qué deporte corresponde este turno</p>
                                        <select
                                            value={deporteId}
                                            onChange={(e) => setDeporteId(e.target.value)}
                                            required
                                            className={`w-full bg-background border rounded-lg px-3 py-2 text-sm text-textMain focus:border-primary focus:outline-none ${
                                                !deporteId ? 'border-amber-500/50' : 'border-border'
                                            }`}
                                        >
                                            <option value="" disabled>Seleccionar deporte...</option>
                                            {deportes.map(dep => (
                                                <option key={dep.id} value={dep.id}>{dep.nombre}</option>
                                            ))}
                                        </select>
                                    </div>
                                ) : actividades.length > 1 && (
                                    <div>
                                        <label className="block text-[13px] font-medium text-textMain mb-1.5">Actividad Asociada</label>
                                        <select
                                            value={actividadId}
                                            onChange={(e) => setActividadId(e.target.value)}
                                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-textMain focus:border-primary focus:outline-none"
                                        >
                                            {actividades.map(act => (
                                                <option key={act.id} value={act.id}>{act.nombre}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="block text-[13px] font-medium text-textMain mb-1.5">Fecha</label>
                                        <div className="relative">
                                            <input
                                                type="date"
                                                value={formattedDate}
                                                readOnly
                                                className="w-full bg-background border border-border rounded-lg pl-3 pr-10 py-2 text-sm text-textMain focus:border-primary focus:outline-none appearance-none"
                                            />
                                            <CalendarIcon size={16} className="absolute right-3 top-2.5 text-textMuted pointer-events-none" />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-[13px] font-medium text-textMain mb-1.5">Hora</label>
                                        <select
                                            value={selectedTime}
                                            onChange={(e) => setSelectedTime(e.target.value)}
                                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-textMain focus:border-primary focus:outline-none"
                                        >
                                            {Array.from({ length: 48 }, (_, i) => {
                                                const h = Math.floor(i / 2)
                                                const m = (i % 2) * 30
                                                const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
                                                return <option key={timeStr} value={timeStr}>{timeStr}</option>
                                            })}
                                        </select>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <label className="block text-[13px] font-medium text-textMain mb-1.5">Estado de Pago</label>
                                    <select
                                        value={estadoPago}
                                        onChange={(e) => setEstadoPago(e.target.value)}
                                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-textMain focus:border-primary focus:outline-none"
                                    >
                                        <option value="pendiente">Pendiente</option>
                                        <option value="seña">Seña</option>
                                        <option value="pagado">Pagado</option>
                                    </select>
                                </div>
                            </div>

                            {/* Player Selection */}
                            <div className="space-y-4 shrink-0 relative">
                                <label className="block text-[13px] font-medium text-textMain mb-1.5">Persona</label>

                                {selectedPlayer ? (
                                    <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-lg px-3 py-2.5">
                                        <span className="text-sm font-medium text-textMain truncate mr-2">{selectedPlayer.nombre} {selectedPlayer.apellido}</span>
                                        <div className="flex items-center gap-3 shrink-0">
                                            {selectedPlayer.telefono && (
                                                <a
                                                    href={`https://wa.me/${selectedPlayer.telefono.replace(/[^0-9]/g, '')}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition-colors"
                                                    onClick={(e) => e.stopPropagation()}
                                                    title="Enviar WhatsApp"
                                                >
                                                    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current" aria-hidden="true">
                                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.878-.788-1.47-1.761-1.643-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
                                                    </svg>
                                                    <span className="text-sm font-medium">{selectedPlayer.telefono}</span>
                                                </a>
                                            )}
                                            <div className="w-px h-5 bg-primary/20 mx-1"></div>
                                            <button
                                                type="button"
                                                onClick={() => setSelectedPlayer(null)}
                                                className="p-1 hover:bg-primary/20 rounded-md text-primary transition-colors"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <Search size={16} className="absolute left-3 top-2.5 text-textMuted" />
                                                <input
                                                    type="text"
                                                    placeholder="Buscar persona..."
                                                    value={playerSearchTerm}
                                                    onChange={(e) => {
                                                        setPlayerSearchTerm(e.target.value)
                                                        setIsDropdownOpen(true)
                                                    }}
                                                    onFocus={() => setIsDropdownOpen(true)}
                                                    className="w-full bg-surface border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-textMain placeholder:text-textMuted focus:border-primary focus:outline-none"
                                                />
                                            </div>
                                            <button type="button" onClick={() => setIsPlayerModalOpen(true)} className="w-10 h-10 shrink-0 bg-surface border border-border rounded-lg flex items-center justify-center text-textMuted hover:text-textMain hover:border-textMuted transition-colors">
                                                <Plus size={18} />
                                            </button>
                                        </div>

                                        {/* Dropdown Options */}
                                        {isDropdownOpen && playerSearchTerm.length > 0 && (
                                            <div className="absolute z-50 top-full left-0 right-12 mt-1 max-h-48 overflow-y-auto bg-surface border border-border rounded-lg shadow-xl custom-scrollbar">
                                                {players.filter(p =>
                                                    `${p.nombre} ${p.apellido}`.toLowerCase().includes(playerSearchTerm.toLowerCase()) ||
                                                    (p.dni && p.dni.includes(playerSearchTerm))
                                                ).map(player => (
                                                    <button
                                                        key={player.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedPlayer(player)
                                                            setPlayerSearchTerm('')
                                                            setIsDropdownOpen(false)
                                                        }}
                                                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-black/5 dark:hover:bg-white/5 text-textMuted hover:text-textMain transition-colors border-b border-border last:border-0"
                                                    >
                                                        <div className="font-medium">{player.nombre} {player.apellido}</div>
                                                        {player.dni && <div className="text-xs text-textMuted/70">DNI: {player.dni}</div>}
                                                    </button>
                                                ))}
                                                {players.filter(p =>
                                                    `${p.nombre} ${p.apellido}`.toLowerCase().includes(playerSearchTerm.toLowerCase()) ||
                                                    (p.dni && p.dni.includes(playerSearchTerm))
                                                ).length === 0 && (
                                                        <div className="px-4 py-3 text-sm text-textMuted/70 text-center">
                                                            No se encontraron personas
                                                        </div>
                                                    )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Duration Chips */}
                            <div className="mb-4 shrink-0">
                                <label className="block text-[13px] font-bold text-textMain mb-3">Duración (minutos)</label>
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-2">
                                    {DURATION_OPTIONS.map(duration => (
                                        <button
                                            key={duration}
                                            type="button"
                                            onClick={() => setSelectedDuration(duration)}
                                            className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors border ${selectedDuration === duration
                                                ? 'bg-primary border-primary text-white shadow-sm'
                                                : 'bg-transparent border-border text-textMuted hover:text-textMain hover:border-textMuted disabled:opacity-50'
                                                }`}
                                        >
                                            {duration} min
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-textMuted">Total: {selectedDuration} min</p>
                            </div>

                            {/* Anotaciones */}
                            <div className="shrink-0 mb-4">
                                <label className="block text-[13px] font-medium text-textMain mb-1.5">Anotaciones (opcional)</label>
                                <textarea
                                    value={anotaciones}
                                    onChange={(e) => setAnotaciones(e.target.value)}
                                    placeholder="Ej: Me dejó $30.000 de seña..."
                                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-textMain placeholder:text-textMuted focus:border-primary focus:outline-none min-h-[80px] resize-y custom-scrollbar"
                                />
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANE - Ítems y Consumos */}
                    <div className="w-[400px] shrink-0 p-6 flex flex-col bg-background overflow-y-auto custom-scrollbar">
                        <div className="flex items-center gap-2 text-textMain font-medium mb-4 shrink-0">
                            <Package size={18} />
                            <h2>Ítems y Consumos</h2>
                        </div>

                        {/* Article Search */}
                        <div className="relative mb-4 shrink-0">
                            <Search size={16} className="absolute left-3 top-2.5 text-textMuted" />
                            <input
                                type="text"
                                value={itemSearchTerm}
                                onChange={(e) => { setItemSearchTerm(e.target.value); setIsItemDropdownOpen(e.target.value.length > 0) }}
                                onFocus={() => { if (itemSearchTerm.length > 0) setIsItemDropdownOpen(true) }}
                                onBlur={() => setTimeout(() => setIsItemDropdownOpen(false), 150)}
                                placeholder="Buscar producto..."
                                className="w-full bg-surface border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-textMain placeholder:text-textMuted focus:border-primary focus:outline-none"
                            />
                            {isItemDropdownOpen && (
                                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-surface border border-border rounded-lg shadow-xl overflow-hidden max-h-48 overflow-y-auto custom-scrollbar">
                                    {articulos
                                        .filter(a => a.nombre.toLowerCase().includes(itemSearchTerm.toLowerCase()))
                                        .map(articulo => (
                                            <button
                                                key={articulo.id}
                                                type="button"
                                                onMouseDown={() => {
                                                    setSesionItems(prev => {
                                                        const existing = prev.findIndex(i => i.articulo_id === articulo.id)
                                                        if (existing >= 0) {
                                                            return prev.map((item, idx) =>
                                                                idx === existing ? { ...item, cantidad: item.cantidad + 1 } : item
                                                            )
                                                        }
                                                        return [...prev, { articulo_id: articulo.id, nombre: articulo.nombre, precio: articulo.precio, cantidad: 1, es_alquiler: false }]
                                                    })
                                                    setItemSearchTerm('')
                                                    setIsItemDropdownOpen(false)
                                                }}
                                                className="w-full text-left px-4 py-2.5 text-sm hover:bg-black/5 dark:hover:bg-white/5 text-textMuted hover:text-textMain transition-colors border-b border-border/5 dark:border-white/5 last:border-0 flex justify-between items-center"
                                            >
                                                <span>{articulo.nombre}</span>
                                                <span className="text-primary font-medium">${articulo.precio.toLocaleString('es-AR')}</span>
                                            </button>
                                        ))
                                    }
                                    {articulos.filter(a => a.nombre.toLowerCase().includes(itemSearchTerm.toLowerCase())).length === 0 && (
                                        <div className="px-4 py-3 text-sm text-textMuted text-center">No se encontraron productos</div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Items List */}
                        <div className="flex-1 flex flex-col gap-2">
                            {sesionItems.map((item, idx) => (
                                <div key={idx} className={`flex items-center gap-2 p-3 rounded-lg border ${item.es_alquiler ? 'border-primary/40 bg-primary/5' : 'border-border bg-surface'}`}>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            {item.es_alquiler && <span className="text-[9px] font-bold uppercase tracking-wider text-primary bg-primary/20 px-1.5 py-0.5 rounded">Obligatorio</span>}
                                            <p className="text-xs font-medium text-textMain truncate">{item.nombre}</p>
                                        </div>
                                        <div className="flex items-center gap-1.5 mt-1.5">
                                            <span className="text-[10px] text-textMuted">$</span>
                                            <input
                                                type="number"
                                                min="0"
                                                value={item.precio}
                                                onChange={(e) => setSesionItems(prev =>
                                                    prev.map((it, i) => i === idx ? { ...it, precio: parseFloat(e.target.value) || 0 } : it)
                                                )}
                                                disabled
                                                className="w-20 bg-background border border-border rounded px-2 py-0.5 text-xs text-textMain focus:border-primary focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                            />
                                        </div>
                                    </div>
                                    {/* Quantity controls */}
                                    <div className="flex items-center gap-1">
                                        <button type="button" onClick={() => setSesionItems(prev => prev.map((it, i) => i === idx && it.cantidad > 1 ? { ...it, cantidad: it.cantidad - 1 } : it))} className="w-6 h-6 flex items-center justify-center rounded bg-background hover:bg-surface border border-border text-textMuted hover:text-textMain transition-colors text-xs">
                                            <Minus size={10} />
                                        </button>
                                        <span className="w-6 text-center text-xs font-medium text-textMain">{item.cantidad}</span>
                                        <button type="button" onClick={() => setSesionItems(prev => prev.map((it, i) => i === idx ? { ...it, cantidad: it.cantidad + 1 } : it))} className="w-6 h-6 flex items-center justify-center rounded bg-background hover:bg-surface border border-border text-textMuted hover:text-textMain transition-colors text-xs">
                                            <Plus size={10} />
                                        </button>
                                    </div>
                                    {/* Sub-total & remove */}
                                    <div className="text-right min-w-[60px]">
                                        <p className="text-xs font-bold text-textMain">${(item.precio * item.cantidad).toLocaleString('es-AR')}</p>
                                    </div>
                                    {!item.es_alquiler && (
                                        <button type="button" onClick={() => setSesionItems(prev => prev.filter((_, i) => i !== idx))} className="ml-1 text-textMuted hover:text-red-400 transition-colors">
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* FOOTER BAR */}
                <div className="shrink-0 border-t border-border bg-background px-6 py-4 flex items-center justify-between rounded-b-xl z-10">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold tracking-wider text-textMuted uppercase mb-0.5">Precio Total</span>
                        <span className="text-2xl font-bold text-primary leading-none">${totalPrice.toLocaleString('es-AR')}</span>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3 ml-2">
                            {editSession && (
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={loading}
                                    className="px-5 py-2.5 min-w-[130px] flex items-center justify-center text-sm font-medium text-red-500 bg-transparent hover:bg-red-500/10 border border-red-500/50 hover:border-red-500 rounded-lg transition-colors"
                                >
                                    Eliminar Turno
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2.5 min-w-[130px] flex items-center justify-center text-sm font-medium text-textMain bg-transparent hover:bg-surface border border-border hover:border-textMuted rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={loading}
                                className="px-6 py-2.5 flex items-center justify-center min-w-[140px] text-sm font-medium text-white bg-primary hover:bg-primaryHover disabled:opacity-50 rounded-lg transition-colors shadow-sm"
                            >
                                {loading ? (
                                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    'Guardar Turno'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>


            {isPlayerModalOpen && (
                <PlayerModal
                    isOpen={isPlayerModalOpen}
                    onClose={() => setIsPlayerModalOpen(false)}
                    onSuccess={async (newPlayer) => {
                        await refreshPlayers()
                        if (newPlayer) {
                            setSelectedPlayer(newPlayer)
                        }
                        setIsPlayerModalOpen(false)
                    }}
                />
            )}
        </Modal>
    )
}
