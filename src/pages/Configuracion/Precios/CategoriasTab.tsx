import { useState } from 'react'
import { Plus, ListTree, Check, X } from 'lucide-react'
import { useCategoriasData, CategoriaArticulo } from '../../../hooks/useCategoriasData'
import CategoriaModal from './CategoriaModal'

export default function CategoriasTab() {
    const { categorias, loading, refreshCategorias } = useCategoriasData()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedCategoria, setSelectedCategoria] = useState<CategoriaArticulo | null>(null)

    const handleOpenNew = () => {
        setSelectedCategoria(null)
        setIsModalOpen(true)
    }

    const handleOpenEdit = (categoria: CategoriaArticulo) => {
        setSelectedCategoria(categoria)
        setIsModalOpen(true)
    }

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="flex justify-between items-center bg-surface p-4 border border-border rounded-xl shadow-sm">
                <div>
                    <h2 className="text-lg font-semibold text-textMain">Familias de Productos</h2>
                    <p className="text-sm text-textMuted mt-1">
                        Crea categorías como "Kiosco", "Canchas", "Indumentaria", etc. para clasificar tus tarifas.
                    </p>
                </div>
                <button
                    onClick={handleOpenNew}
                    className="flex items-center gap-2 bg-primary hover:bg-primaryHover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                    <Plus size={18} />
                    <span>Nueva Categoría</span>
                </button>
            </div>

            {/* List */}
            <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden flex-1">
                <div className="overflow-x-auto h-full">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border bg-background/50">
                                <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider">Nombre</th>
                                <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider hidden md:table-cell">Descripción</th>
                                <th className="px-6 py-4 text-xs font-semibold text-textMuted uppercase tracking-wider text-center">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-12 text-center text-textMuted">
                                        <div className="flex justify-center items-center space-x-2">
                                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                            <span>Cargando categorías...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : categorias.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <ListTree className="h-12 w-12 text-textMuted/30 mb-4" />
                                            <h3 className="text-lg font-medium text-textMain">Sin Categorías</h3>
                                            <p className="text-sm text-textMuted mt-1 w-full max-w-sm">No has creado categorías. Crea una por ejemplo "Canchas" o "Bebidas" para poder cargar los artículos.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                categorias.map((cat) => (
                                    <tr
                                        key={cat.id}
                                        onClick={() => handleOpenEdit(cat)}
                                        className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center text-textMuted">
                                                    <ListTree size={16} />
                                                </div>
                                                <span className="text-sm font-medium text-textMain">{cat.nombre}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                                            <span className="text-sm text-textMuted">{cat.descripcion || <span className="italic text-xs">Sin descripción</span>}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            {cat.estado ? (
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
                <CategoriaModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={refreshCategorias}
                    categoriaToEdit={selectedCategoria}
                />
            )}
        </div>
    )
}
