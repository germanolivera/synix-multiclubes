import { useState, useMemo } from 'react'
import { Tag, Search, Filter } from 'lucide-react'
import { useArticulosData } from '../../hooks/useArticulosData'
import { useCategoriasData } from '../../hooks/useCategoriasData'

export default function PreciosConsulta() {
    const { articulos, loading: loadingArticulos } = useArticulosData()
    const { categorias, loading: loadingCategorias } = useCategoriasData()

    const [searchTerm, setSearchTerm] = useState('')
    const [selectedCategoria, setSelectedCategoria] = useState<string>('todas')

    // Filtrar solo artículos y categorías activas para esta vista
    const categoriasActivas = useMemo(() => categorias.filter(c => c.estado), [categorias])
    const articulosActivos = useMemo(() => articulos.filter(a => a.activo), [articulos])

    const filteredArticulos = useMemo(() => {
        return articulosActivos.filter(art => {
            const matchesSearch = art.nombre.toLowerCase().includes(searchTerm.toLowerCase())
            const matchesCategory = selectedCategoria === 'todas' || art.categoria_id === selectedCategoria
            return matchesSearch && matchesCategory
        })
    }, [articulosActivos, searchTerm, selectedCategoria])

    return (
        <div className="h-full flex flex-col max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold text-textMain tracking-tight">Consulta de Precios</h1>
                <p className="text-sm text-textMuted">
                    Busca rápidamente los precios y disponibilidad de los artículos y servicios de la sede.
                </p>
            </div>

            {/* Filters Bar */}
            <div className="bg-surface border border-border rounded-xl p-4 flex flex-col sm:flex-row gap-4 shadow-sm">
                {/* Search */}
                <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-textMuted">
                        <Search size={18} />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar por nombre..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 bg-background border border-border rounded-lg text-sm text-textMain focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                    />
                </div>

                {/* Category Filter */}
                <div className="flex items-center gap-2 sm:w-64">
                    <div className="text-textMuted flex items-center justify-center p-2 bg-background border border-border rounded-lg">
                        <Filter size={18} />
                    </div>
                    <select
                        value={selectedCategoria}
                        onChange={(e) => setSelectedCategoria(e.target.value)}
                        className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-textMain focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                    >
                        <option value="todas">Todas las categorías</option>
                        {categoriasActivas.map(cat => (
                            <option key={cat.id} value={cat.id}>
                                {cat.nombre}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Results Grid */}
            <div className="flex-1 min-h-0 bg-surface border border-border rounded-xl shadow-sm p-4 overflow-y-auto">
                {loadingArticulos || loadingCategorias ? (
                    <div className="h-full flex flex-col items-center justify-center space-y-3 text-textMuted">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-sm">Cargando lista de precios...</p>
                    </div>
                ) : filteredArticulos.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center px-4">
                        <div className="w-12 h-12 bg-background border border-border rounded-full flex items-center justify-center text-textMuted mb-3">
                            <Tag size={24} />
                        </div>
                        <h3 className="text-lg font-medium text-textMain">No hay resultados</h3>
                        <p className="text-sm text-textMuted mt-1 max-w-sm">
                            {searchTerm || selectedCategoria !== 'todas'
                                ? "Intenta con otros filtros de búsqueda para encontrar lo que buscas."
                                : "Aún no hay artículos activos cargados en el sistema para esta sede."}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredArticulos.map((art) => (
                            <div
                                key={art.id}
                                className="bg-background border border-border rounded-xl p-4 flex flex-col gap-3 hover:border-primary/50 transition-colors"
                            >
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-textMain truncate" title={art.nombre}>
                                            {art.nombre}
                                        </h3>
                                        <span className="inline-block mt-1 px-2 py-0.5 bg-surface border border-border rounded-md text-xs text-textMuted truncate max-w-full">
                                            {art.categoria?.nombre || 'Sin categoría'}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-auto pt-3 border-t border-border/50 flex items-end justify-between">
                                    <div className="text-2xl font-bold text-primary tracking-tight">
                                        ${art.precio.toLocaleString('es-AR')}
                                    </div>
                                    {art.controla_stock && (
                                        <div className="flex flex-col items-end">
                                            <span className="text-xs text-textMuted uppercase tracking-wider font-semibold">Stock</span>
                                            <span className={`text-sm font-medium ${art.stock_actual > 0 ? 'text-textMain' : 'text-red-500'}`}>
                                                {art.stock_actual > 0 ? `${art.stock_actual} un.` : 'Agotado'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
