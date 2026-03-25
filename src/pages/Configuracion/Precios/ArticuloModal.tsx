import { useState, useEffect } from 'react'
import { Trash2 } from 'lucide-react'
import Modal from '../../../components/ui/Modal'
import { supabase } from '../../../lib/supabase'
import { useBranch } from '../../../contexts/BranchContext'
import { Articulo } from '../../../hooks/useArticulosData'
import { useCategoriasData } from '../../../hooks/useCategoriasData'

interface ArticuloModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    articuloToEdit: Articulo | null
}

export default function ArticuloModal({ isOpen, onClose, onSuccess, articuloToEdit }: ArticuloModalProps) {
    const { activeClub } = useBranch()
    const { categorias } = useCategoriasData()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [nombre, setNombre] = useState('')
    const [precio, setPrecio] = useState<number | string>('')
    const [categoriaId, setCategoriaId] = useState('')
    const [controlaStock, setControlaStock] = useState(false)
    const [stockActual, setStockActual] = useState<number | string>(0)
    const [activo, setActivo] = useState(true)

    // Solo mostrar categorías activas para asignar
    const categoriasActivas = categorias.filter(c => c.estado)

    useEffect(() => {
        if (articuloToEdit) {
            setNombre(articuloToEdit.nombre || '')
            setPrecio(articuloToEdit.precio || '')
            setCategoriaId(articuloToEdit.categoria_id || '')
            setControlaStock(articuloToEdit.controla_stock || false)
            setStockActual(articuloToEdit.stock_actual || 0)
            setActivo(articuloToEdit.activo ?? true)
        } else {
            setNombre('')
            setPrecio('')
            setCategoriaId('')
            setControlaStock(false)
            setStockActual(0)
            setActivo(true)
        }
        setError(null)
    }, [articuloToEdit, isOpen])

    const handleDelete = async () => {
        if (!articuloToEdit) return
        if (!window.confirm(`¿Seguro que deseas eliminar el artículo "${articuloToEdit.nombre}"? Esta acción no se puede deshacer.`)) return

        try {
            setLoading(true)
            setError(null)
            const { error: deleteError } = await supabase
                .from('articulos')
                .delete()
                .eq('id', articuloToEdit.id)
            if (deleteError) throw deleteError
            onSuccess()
            onClose()
        } catch (err: any) {
            console.error(err)
            const msg = err.message || err.details || ''
            if (msg.includes('foreign key constraint')) {
                setError('No se puede eliminar porque ya tiene ventas o reservas asociadas. Recomendado: Desmarca la opción de "Artículo Activo" para ocultarlo.')
            } else {
                setError(err.message || 'Error al eliminar el artículo')
            }
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!activeClub?.id) {
            setError("Error: Sede activa no encontrada.")
            return
        }

        if (!categoriaId) {
            setError("Debes seleccionar una categoría.")
            return
        }

        try {
            setLoading(true)
            setError(null)

            const payload = {
                club_id: activeClub.id,
                categoria_id: categoriaId,
                nombre: nombre.trim(),
                precio: Number(precio),
                controla_stock: controlaStock,
                stock_actual: controlaStock ? Number(stockActual) : 0,
                activo
            }

            if (articuloToEdit) {
                const { error: updateError } = await supabase
                    .from('articulos')
                    .update(payload)
                    .eq('id', articuloToEdit.id)
                if (updateError) throw updateError
            } else {
                const { error: insertError } = await supabase
                    .from('articulos')
                    .insert([payload])
                if (insertError) throw insertError
            }

            onSuccess()
            onClose()

        } catch (err: any) {
            console.error(err)
            setError(err.message || 'Error al guardar el artículo')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={articuloToEdit ? 'Editar Artículo/Precio' : 'Nuevo Artículo/Precio'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-3 rounded-md">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-textMain">
                            Nombre <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            placeholder="Ej. Alquiler 90min, Agua 500ml..."
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-textMain focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-textMain">
                            Precio de Venta ($) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            required
                            min="0"
                            step="0.01"
                            value={precio}
                            onChange={(e) => setPrecio(e.target.value)}
                            placeholder="0.00"
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-textMain focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="block text-sm font-medium text-textMain">
                        Familia / Categoría <span className="text-red-500">*</span>
                    </label>
                    <select
                        required
                        value={categoriaId}
                        onChange={(e) => setCategoriaId(e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-textMain focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                    >
                        <option value="" disabled>Seleccionar categoría...</option>
                        {categoriasActivas.map(cat => (
                            <option key={cat.id} value={cat.id}>
                                {cat.nombre}
                            </option>
                        ))}
                    </select>
                    {categoriasActivas.length === 0 && (
                        <p className="text-xs text-orange-500 mt-1">No tienes categorías activas. Crea una primero.</p>
                    )}
                </div>

                <div className="bg-background/50 border border-border rounded-xl p-4 space-y-4">
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="controlaStock"
                            checked={controlaStock}
                            onChange={(e) => setControlaStock(e.target.checked)}
                            className="rounded border-border bg-background text-primary focus:ring-primary"
                        />
                        <div className="flex flex-col">
                            <label htmlFor="controlaStock" className="text-sm font-medium text-textMain leading-none">
                                Este elemento requiere Control de Stock Físico
                            </label>
                            <span className="text-xs text-textMuted mt-1">
                                (Mantén desmarcado para Sesiones/Alquileres. Marca para Bebidas, Indumentaria, etc.)
                            </span>
                        </div>
                    </div>

                    {controlaStock && (
                        <div className="space-y-1 pt-2 border-t border-border/50">
                            <label className="block text-sm font-medium text-textMain">
                                Cantidad Actual en Stock
                            </label>
                            <input
                                type="number"
                                required={controlaStock}
                                min="0"
                                value={stockActual}
                                onChange={(e) => setStockActual(e.target.value)}
                                className="w-1/3 min-w-[120px] px-3 py-2 bg-background border border-border rounded-lg text-sm text-textMain focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                            />
                        </div>
                    )}
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
                        Artículo Activo (Visible para la venta)
                    </label>
                </div>

                <div className="pt-4 border-t border-border flex justify-between items-center mt-4">
                    <div>
                        {articuloToEdit && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={loading}
                                className="p-2 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center justify-center opacity-80 hover:opacity-100"
                                title="Eliminar artículo"
                            >
                                <Trash2 size={20} />
                            </button>
                        )}
                    </div>
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-textMain bg-surface hover:bg-white/5 border border-border rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || (!categoriaId && !articuloToEdit)}
                            className="px-4 py-2 flex items-center justify-center min-w-[120px] text-sm font-medium text-white bg-primary hover:bg-primaryHover disabled:opacity-50 rounded-lg transition-colors shadow-sm"
                        >
                            {loading ? (
                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                'Guardar'
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </Modal>
    )
}
