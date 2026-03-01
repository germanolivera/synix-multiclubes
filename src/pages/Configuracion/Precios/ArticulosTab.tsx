import { useState } from 'react'
import { Plus, Tags, Check, X, PackageOpen } from 'lucide-react'
import { useArticulosData, Articulo } from '../../../hooks/useArticulosData'
import ArticuloModal from './ArticuloModal'

export default function ArticulosTab() {
    const { articulos, loading, refreshArticulos } = useArticulosData()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedArticulo, setSelectedArticulo] = useState<Articulo | null>(null)

    const handleOpenNew = () => {
        setSelectedArticulo(null)
        setIsModalOpen(true)
    }

    const handleOpenEdit = (articulo: Articulo) => {
        setSelectedArticulo(articulo)
        setIsModalOpen(true)
    }

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="flex justify-between items-center bg-surface p-4 border border-border rounded-xl shadow-sm">
                <div>
                    <h2 className="text-lg font-semibold text-textMain">Lista de Precios y Artículos</h2>
                    <p className="text-sm text-textMuted mt-1">
                        Carga y administra los precios de todos tus servicios, alquileres y productos de venta.
                    </p>
                </div>
                <button
                    onClick={handleOpenNew}
                    className="flex items-center gap-2 bg-primary hover:bg-primaryHover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                    <Plus size={18} />
                    <span>Nuevo Artículo</span>
                </button>
            </div>

            {/* List */}
            <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden flex-1">
                <div className="overflow-x-auto h-full">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border bg-background/50">
                                <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider">Artículo</th>
                                <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider">Categoría</th>
                                <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider text-right">Precio</th>
                                <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider text-center">Stock</th>
                                <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider text-center">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-textMuted">
                                        <div className="flex justify-center items-center space-x-2">
                                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                            <span>Cargando artículos...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : articulos.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <Tags className="h-12 w-12 text-textMuted/30 mb-4" />
                                            <h3 className="text-lg font-medium text-textMain">Lista de Precios Vacía</h3>
                                            <p className="text-sm text-textMuted mt-1 w-full max-w-sm">No has cargado ningún producto ni servicio aún.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                articulos.map((art) => (
                                    <tr
                                        key={art.id}
                                        onClick={() => handleOpenEdit(art)}
                                        className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center text-textMuted">
                                                    <Tags size={16} />
                                                </div>
                                                <span className="text-sm font-medium text-textMain">{art.nombre}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-textMuted">
                                                {art.categoria ? art.categoria.nombre : <span className="italic">N/A</span>}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <span className="text-sm font-bold text-textMain">
                                                ${art.precio.toLocaleString('es-AR')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            {art.controla_stock ? (
                                                <div className="flex items-center justify-center gap-1.5 text-sm font-medium text-textMain">
                                                    <PackageOpen size={14} className="text-textMuted" />
                                                    {art.stock_actual}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-textMuted italic font-mono">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            {art.activo ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">
                                                    <Check size={12} /> Activo
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20">
                                                    <X size={12} /> Inactivo
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <ArticuloModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={refreshArticulos}
                    articuloToEdit={selectedArticulo}
                />
            )}
        </div>
    )
}
