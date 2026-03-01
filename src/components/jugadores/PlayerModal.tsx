import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import { supabase } from '../../lib/supabase'
import { useBranch } from '../../contexts/BranchContext'
import { useDeportesData } from '../../hooks/useDeportesData'
import { Plus, X, Trophy } from 'lucide-react'

interface PlayerModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    playerToEdit?: any | null
}

export default function PlayerModal({ isOpen, onClose, onSuccess, playerToEdit }: PlayerModalProps) {
    const { activeClub } = useBranch()
    const { deportes } = useDeportesData()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Form state
    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        email: '',
        telefono: '',
        dni: ''
    })

    // Dynamic Levels state: { [deporte_id]: string }
    const [nivelesPorDeporte, setNivelesPorDeporte] = useState<Record<string, string>>({})

    // Add Sport state
    const [selectedDeporteId, setSelectedDeporteId] = useState('')
    const [selectedLevel, setSelectedLevel] = useState('')

    // Destructure for cleaner binding
    const { nombre, apellido, email, telefono, dni } = formData

    useEffect(() => {
        if (playerToEdit) {
            setFormData({
                nombre: playerToEdit.nombre || '',
                apellido: playerToEdit.apellido || '',
                email: playerToEdit.email || '',
                telefono: playerToEdit.telefono || '',
                dni: playerToEdit.dni || ''
            })

            let parsedLevels = {}
            if (playerToEdit.niveles_por_deporte) {
                if (typeof playerToEdit.niveles_por_deporte === 'string') {
                    try { parsedLevels = JSON.parse(playerToEdit.niveles_por_deporte) }
                    catch (e) { parsedLevels = {} }
                } else if (typeof playerToEdit.niveles_por_deporte === 'object') {
                    parsedLevels = { ...playerToEdit.niveles_por_deporte }
                }
            }
            setNivelesPorDeporte(parsedLevels)
        } else {
            setFormData({
                nombre: '',
                apellido: '',
                email: '',
                telefono: '',
                dni: ''
            })
            setNivelesPorDeporte({})
        }
        setError(null)
    }, [playerToEdit, isOpen])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Auth Check
        const clubId = activeClub?.id
        if (!clubId) {
            setError("Error: No hay una Sede activa seleccionada.")
            return
        }

        try {
            setLoading(true)
            setError(null)

            // Auto-append if the user forgot to click the "+" button
            const finalNiveles = { ...nivelesPorDeporte }
            if (selectedDeporteId && selectedLevel) {
                finalNiveles[selectedDeporteId] = selectedLevel
            }

            const payload = {
                club_id: clubId,
                nombre: nombre.trim(),
                apellido: apellido.trim(),
                email: email.trim() || null,
                telefono: telefono.trim() || null,
                dni: dni.trim() || null,
                niveles_por_deporte: finalNiveles,
                activo: true
            }

            if (playerToEdit) {
                const { error: updateError } = await supabase
                    .from('clientes_globales')
                    .update(payload)
                    .eq('id', playerToEdit.id)
                if (updateError) throw updateError
            } else {
                const { error: insertError } = await supabase
                    .from('clientes_globales')
                    .insert([payload])
                if (insertError) throw insertError
            }

            // Success
            setFormData({ nombre: '', apellido: '', email: '', telefono: '', dni: '' })
            setNivelesPorDeporte({})
            setSelectedDeporteId('')
            setSelectedLevel('')
            onSuccess()
            onClose()

        } catch (err: any) {
            console.error(err)
            setError(err.message || 'Ocurrió un error al guardar el jugador.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={playerToEdit ? "Editar Jugador" : "Nuevo Jugador"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-3 rounded-md">
                        {error}
                    </div>
                )}

                {/* Row: Name and Last Name */}
                <div className="flex gap-4">
                    <div className="flex-1 space-y-1">
                        <label htmlFor="nombre" className="block text-sm font-medium text-textMain">
                            Nombre <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="nombre"
                            name="nombre"
                            type="text"
                            required
                            value={nombre}
                            onChange={handleChange}
                            placeholder="Ej. Juan"
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-textMain focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                        />
                    </div>
                    <div className="flex-1 space-y-1">
                        <label htmlFor="apellido" className="block text-sm font-medium text-textMain">
                            Apellido <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="apellido"
                            name="apellido"
                            type="text"
                            required
                            value={apellido}
                            onChange={handleChange}
                            placeholder="Ej. Pérez"
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-textMain focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                        />
                    </div>
                </div>

                {/* Contact info */}
                <div className="space-y-1">
                    <label htmlFor="telefono" className="block text-sm font-medium text-textMain">Telefono / WhatsApp</label>
                    <input
                        id="telefono"
                        name="telefono"
                        type="tel"
                        value={telefono}
                        onChange={handleChange}
                        placeholder="+54 9 11 1234-5678"
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-textMain focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                    />
                </div>

                <div className="space-y-1">
                    <label htmlFor="email" className="block text-sm font-medium text-textMain">Correo Electrónico</label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        value={email}
                        onChange={handleChange}
                        placeholder="juan.perez@email.com"
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-textMain focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                    />
                </div>

                {/* Extra Info */}
                <div className="space-y-1">
                    <label htmlFor="dni" className="block text-sm font-medium text-textMain">DNI</label>
                    <input
                        id="dni"
                        name="dni"
                        type="text"
                        value={dni}
                        onChange={handleChange}
                        placeholder="12.345.678"
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-textMain focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                    />
                </div>

                {/* Sports and Levels Linkage */}
                <div className="space-y-2 border-t border-border pt-4">
                    <label className="block text-sm font-medium text-textMain">Deportes y Niveles</label>
                    <p className="text-xs text-textMuted">Asigna los deportes que practica el jugador y su nivel en cada uno.</p>

                    {/* Existing Assignments */}
                    <div className="space-y-2 mb-2">
                        {Object.entries(nivelesPorDeporte).map(([depId, nivelStr]) => {
                            const d = deportes.find(x => x.id === depId)
                            return (
                                <div key={depId} className="flex justify-between items-center px-3 py-2 bg-surface border border-border rounded-lg text-sm text-textMain">
                                    <div className="flex items-center gap-2">
                                        <Trophy size={14} className="text-primary/70" />
                                        <span className="font-medium">{d?.nombre || 'Deporte'}</span>
                                        <span className="text-textMuted text-xs ml-1">• {nivelStr}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const copy = { ...nivelesPorDeporte }
                                            delete copy[depId]
                                            setNivelesPorDeporte(copy)
                                        }}
                                        className="text-textMuted hover:text-red-500"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            )
                        })}
                    </div>

                    {/* Add new assignment */}
                    <div className="flex gap-2">
                        <select
                            value={selectedDeporteId}
                            onChange={(e) => {
                                setSelectedDeporteId(e.target.value)
                                setSelectedLevel('')
                            }}
                            className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-textMain focus:ring-1 focus:ring-primary outline-none"
                        >
                            <option value="" disabled>Seleccionar deporte...</option>
                            {deportes.filter(d => !nivelesPorDeporte[d.id]).map(d => (
                                <option key={d.id} value={d.id}>{d.nombre}</option>
                            ))}
                        </select>

                        {selectedDeporteId && (
                            <select
                                value={selectedLevel}
                                onChange={(e) => setSelectedLevel(e.target.value)}
                                className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-textMain focus:ring-1 focus:ring-primary outline-none"
                            >
                                <option value="" disabled>Nivel...</option>
                                {deportes.find(d => d.id === selectedDeporteId)?.niveles_posibles.map(n => (
                                    <option key={n} value={n}>{n}</option>
                                ))}
                                <option value="N/A">N/A</option>
                            </select>
                        )}

                        <button
                            type="button"
                            disabled={!selectedDeporteId || !selectedLevel}
                            onClick={() => {
                                setNivelesPorDeporte(prev => ({ ...prev, [selectedDeporteId]: selectedLevel }))
                                setSelectedDeporteId('')
                                setSelectedLevel('')
                            }}
                            className="px-3 py-2 bg-surface hover:bg-white/5 disabled:opacity-50 border border-border rounded-lg transition-colors text-textMuted hover:text-textMain"
                        >
                            <Plus size={18} />
                        </button>
                    </div>
                </div>

                {/* Actions */}
                <div className="pt-4 flex justify-end gap-3 mt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-textMain bg-surface hover:bg-white/5 border border-border rounded-lg transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 flex items-center justify-center min-w-[120px] text-sm font-medium text-white bg-primary hover:bg-primaryHover disabled:opacity-50 rounded-lg transition-colors shadow-sm"
                    >
                        {loading ? (
                            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            'Guardar Jugador'
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    )
}
