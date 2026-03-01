import { useState, useEffect } from 'react'
import Modal from '../../../components/ui/Modal'
import { supabase } from '../../../lib/supabase'
import { useBranch } from '../../../contexts/BranchContext'
import { CategoriaArticulo } from '../../../hooks/useCategoriasData'

interface CategoriaModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    categoriaToEdit: CategoriaArticulo | null
}

export default function CategoriaModal({ isOpen, onClose, onSuccess, categoriaToEdit }: CategoriaModalProps) {
    const { activeClub } = useBranch()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [nombre, setNombre] = useState('')
    const [descripcion, setDescripcion] = useState('')
    const [estado, setEstado] = useState(true)

    useEffect(() => {
        if (categoriaToEdit) {
            setNombre(categoriaToEdit.nombre || '')
            setDescripcion(categoriaToEdit.descripcion || '')
            setEstado(categoriaToEdit.estado ?? true)
        } else {
            setNombre('')
            setDescripcion('')
            setEstado(true)
        }
        setError(null)
    }, [categoriaToEdit, isOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!activeClub?.id) {
            setError("Error: Sede activa no encontrada.")
            return
        }

        try {
            setLoading(true)
            setError(null)

            const payload = {
                club_id: activeClub.id,
                nombre: nombre.trim(),
                descripcion: descripcion.trim() || null,
                estado
            }

            if (categoriaToEdit) {
                const { error: updateError } = await supabase
                    .from('categorias_articulos')
                    .update(payload)
                    .eq('id', categoriaToEdit.id)
                if (updateError) throw updateError
            } else {
                const { error: insertError } = await supabase
                    .from('categorias_articulos')
                    .insert([payload])
                if (insertError) throw insertError
            }

            onSuccess()
            onClose()

        } catch (err: any) {
            console.error(err)
            setError(err.message || 'Error al guardar la categoría')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={categoriaToEdit ? 'Editar Categoría' : 'Nueva Categoría'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-3 rounded-md">
                        {error}
                    </div>
                )}

                <div className="space-y-1">
                    <label className="block text-sm font-medium text-textMain">
                        Nombre de la Familia/Categoría <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        required
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        placeholder="Ej. Kiosco, Indumentaria, Adicionales..."
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-textMain focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                    />
                </div>

                <div className="space-y-1">
                    <label className="block text-sm font-medium text-textMain">Descripción</label>
                    <textarea
                        value={descripcion}
                        onChange={(e) => setDescripcion(e.target.value)}
                        placeholder="Descripción interna (opcional)"
                        rows={2}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-textMain focus:ring-1 focus:ring-primary focus:border-primary outline-none resize-none"
                    />
                </div>

                <div className="flex items-center gap-2 pt-2">
                    <input
                        type="checkbox"
                        id="estado"
                        checked={estado}
                        onChange={(e) => setEstado(e.target.checked)}
                        className="rounded border-border bg-background text-primary focus:ring-primary"
                    />
                    <label htmlFor="estado" className="text-sm font-medium text-textMain">
                        Activa y visible en el sistema
                    </label>
                </div>

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
                            'Guardar Categoría'
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    )
}
