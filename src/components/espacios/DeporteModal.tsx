import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import { supabase } from '../../lib/supabase'
import { useBranch } from '../../contexts/BranchContext'
import { X } from 'lucide-react'

interface DeporteModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    deporteToEdit?: any | null
}

export default function DeporteModal({ isOpen, onClose, onSuccess, deporteToEdit }: DeporteModalProps) {
    const { activeClub } = useBranch()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [nombre, setNombre] = useState('')
    const [niveles, setNiveles] = useState<string[]>([])
    const [newNivel, setNewNivel] = useState('')
    const [activo, setActivo] = useState(true)

    useEffect(() => {
        if (deporteToEdit) {
            setNombre(deporteToEdit.nombre || '')
            setNiveles(Array.isArray(deporteToEdit.niveles_posibles) ? deporteToEdit.niveles_posibles : [])
            setActivo(deporteToEdit.activo ?? true)
        } else {
            setNombre('')
            setNiveles([])
            setActivo(true)
        }
        setError(null)
    }, [deporteToEdit, isOpen])

    const handleAddNivel = (e: React.MouseEvent | React.KeyboardEvent) => {
        e.preventDefault()
        if (newNivel.trim() && !niveles.includes(newNivel.trim())) {
            setNiveles([...niveles, newNivel.trim()])
            setNewNivel('')
        }
    }

    const handleRemoveNivel = (n: string) => {
        setNiveles(niveles.filter(x => x !== n))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const clubId = activeClub?.id
        if (!clubId) {
            setError("Error: No hay una Sede activa seleccionada.")
            return
        }

        try {
            setLoading(true)
            setError(null)

            const payload = {
                club_id: clubId,
                nombre: nombre.trim(),
                niveles_posibles: niveles,
                activo
            }

            if (deporteToEdit) {
                const { error: updateError } = await supabase
                    .from('club_deportes')
                    .update(payload)
                    .eq('id', deporteToEdit.id)
                if (updateError) throw updateError
            } else {
                const { error: insertError } = await supabase
                    .from('club_deportes')
                    .insert([payload])
                if (insertError) throw insertError
            }

            onSuccess()
            onClose()

        } catch (err: any) {
            console.error(err)
            setError(err.message || 'Ocurrió un error al guardar el deporte.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={deporteToEdit ? 'Editar Deporte' : 'Nuevo Deporte'}>
            <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-3 rounded-md">
                        {error}
                    </div>
                )}

                <div className="space-y-1">
                    <label className="block text-sm font-medium text-textMain">Nombre del Deporte <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        required
                        placeholder="Ej. Pádel, Yoga, Fútbol 5"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-textMain focus:ring-1 focus:ring-primary outline-none"
                    />
                </div>

                {/* Dynamic Levels List */}
                <div className="space-y-2 border-t border-border pt-4">
                    <label className="block text-sm font-medium text-textMain">Escala de Niveles (Opcional)</label>
                    <p className="text-xs text-textMuted">Define las categorías de juego. Ej: "1ra", "2da", "Principiante", "Avanzado".</p>

                    <div className="flex flex-wrap gap-2 mb-2">
                        {niveles.map(n => (
                            <span key={n} className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-surface border border-border text-sm text-textMain">
                                {n}
                                <button type="button" onClick={() => handleRemoveNivel(n)} className="text-textMuted hover:text-red-500"><X size={14} /></button>
                            </span>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newNivel}
                            onChange={(e) => setNewNivel(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' ? handleAddNivel(e) : null}
                            placeholder="Escribe un nivel y presiona Añadir"
                            className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-textMain focus:ring-1 focus:ring-primary outline-none"
                        />
                        <button
                            type="button"
                            onClick={handleAddNivel}
                            className="px-3 py-2 bg-surface hover:bg-white/5 border border-border rounded-lg text-sm transition-colors text-textMain"
                        >
                            Añadir
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                    <input
                        type="checkbox"
                        id="activo"
                        checked={activo}
                        onChange={(e) => setActivo(e.target.checked)}
                        className="rounded border-border bg-background text-primary focus:ring-primary"
                    />
                    <label htmlFor="activo" className="text-sm font-medium text-textMain">
                        Deporte Activo en el Club
                    </label>
                </div>


                {/* Actions */}
                <div className="pt-4 border-t border-border flex justify-end gap-3 mt-4">
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
                            'Guardar Deporte'
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    )
}
