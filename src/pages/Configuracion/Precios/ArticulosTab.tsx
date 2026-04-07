import { useState } from 'react'
import { Plus, Tags, Check, X, DownloadCloud, UploadCloud, Search, PackagePlus } from 'lucide-react'
import { Articulo } from '../../../types/database.types'
import { useArticulosData } from '../../../hooks/useArticulosData'
import ArticuloModal from './ArticuloModal'
import CSVImportModal from './CSVImportModal'
import StockAdjustModal from './StockAdjustModal'

export default function ArticulosTab() {
    const { articulos, loading, refreshArticulos } = useArticulosData()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isCSVModalOpen, setIsCSVModalOpen] = useState(false)
    const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false)
    const [selectedArticulo, setSelectedArticulo] = useState<Articulo | null>(null)
    const [searchTerm, setSearchTerm] = useState('')

    const filteredArticulos = articulos.filter(art => 
        art.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (art.categoria?.nombre || '').toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleOpenNew = () => {
        setSelectedArticulo(null)
        setIsModalOpen(true)
    }

    const handleOpenEdit = (articulo: Articulo) => {
        setSelectedArticulo(articulo)
        setIsModalOpen(true)
    }

    const handleOpenAdjust = (articulo: Articulo) => {
        setSelectedArticulo(articulo)
        setIsAdjustModalOpen(true)
    }

    const csvEscape = (str: string | number | null | undefined) => {
        if (str === null || str === undefined) return '""';
        const s = String(str);
        if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
            return `"${s.replace(/"/g, '""')}"`;
        }
        return `"${s}"`;
    };

    const handleExportCSV = () => {
        const headers = ['Categoría', 'Artículo', 'Precio', 'Estado']
        const rows = filteredArticulos.map(art => {
            const cat = art.categoria?.nombre || 'Sin Categoría'
            const nombre = art.nombre
            const precio = art.precio
            const estado = art.activo ? 'Activo' : 'Inactivo'

            return [
                csvEscape(cat),
                csvEscape(nombre),
                csvEscape(precio),
                csvEscape(estado)
            ].join(',')
        })

        const csvString = '\uFEFF' + [headers.join(','), ...rows].join('\n')
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement("a")
        link.href = URL.createObjectURL(blob)
        link.download = `lista_precios_${new Date().toISOString().split('T')[0]}.csv`
        link.click()
        URL.revokeObjectURL(link.href)
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
                
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar artículo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-64 bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-textMain placeholder:text-textMuted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                        />
                    </div>
                    <button
                        onClick={handleExportCSV}
                        disabled={filteredArticulos.length === 0}
                        className="flex items-center gap-2 bg-surface hover:bg-black/5 dark:hover:bg-white/5 border border-border text-textMain px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
                        title="Exportar Lista"
                    >
                        <DownloadCloud size={18} className="text-emerald-500" />
                        <span className="hidden sm:inline">Exportar</span>
                    </button>
                    <button
                        onClick={() => setIsCSVModalOpen(true)}
                        className="flex items-center gap-2 bg-surface hover:bg-black/5 dark:hover:bg-white/5 border border-border text-textMain px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                        title="Importar Lista"
                    >
                        <UploadCloud size={18} className="text-primary" />
                        <span className="hidden sm:inline">Importar</span>
                    </button>
                    <button
                        onClick={handleOpenNew}
                        className="flex items-center gap-2 bg-primary hover:bg-primaryHover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                    >
                        <Plus size={18} />
                        <span>Nuevo Artículo</span>
                    </button>
                </div>
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
                            ) : filteredArticulos.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <Search className="h-12 w-12 text-textMuted/30 mb-4" />
                                            <h3 className="text-lg font-medium text-textMain">No hay resultados</h3>
                                            <p className="text-sm text-textMuted mt-1 w-full max-w-sm">No se encontraron artículos que coincidan con tu búsqueda.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredArticulos.map((art) => (
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
                                                <div className="flex items-center justify-center gap-3">
                                                    <div className="flex items-center justify-center gap-1.5 text-sm font-medium text-textMain w-8">
                                                        {art.stock_actual}
                                                    </div>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleOpenAdjust(art) }}
                                                        className="p-1.5 bg-background border border-border rounded-md text-textMuted hover:text-primary hover:border-primary transition-colors focus:outline-none"
                                                        title="Ajuste Rápido de Stock"
                                                    >
                                                        <PackagePlus size={14} />
                                                    </button>
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

            {isCSVModalOpen && (
                <CSVImportModal
                    isOpen={isCSVModalOpen}
                    onClose={() => setIsCSVModalOpen(false)}
                    onSuccess={refreshArticulos}
                />
            )}

            {isAdjustModalOpen && selectedArticulo && (
                <StockAdjustModal
                    isOpen={isAdjustModalOpen}
                    onClose={() => setIsAdjustModalOpen(false)}
                    onSuccess={refreshArticulos}
                    articulo={selectedArticulo}
                />
            )}
        </div>
    )
}
