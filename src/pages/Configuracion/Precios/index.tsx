import { useState } from 'react'
import { ArrowLeft, Tags, ListTree } from 'lucide-react'
import { Link } from 'react-router-dom'
import CategoriasTab from './CategoriasTab'
import ArticulosTab from './ArticulosTab'

export default function Precios() {
    const [activeTab, setActiveTab] = useState<'categorias' | 'articulos'>('categorias')

    return (
        <div className="h-full flex flex-col max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">

            {/* Back Navigation */}
            <div>
                <Link to="/configuracion" className="inline-flex items-center gap-2 text-sm text-textMuted hover:text-textMain transition-colors">
                    <ArrowLeft size={16} /> Volver a Configuración
                </Link>
            </div>

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-textMain tracking-tight">Lista de Precios y Artículos</h1>
                <p className="text-sm text-textMuted mt-1">
                    Administra tus familias de productos y la lista detallada de precios.
                </p>
            </div>

            {/* Tabs */}
            <div className="border-b border-border mb-6">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('categorias')}
                        className={`
                            whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                            ${activeTab === 'categorias'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-textMuted hover:text-textMain hover:border-textMuted'
                            }
                        `}
                    >
                        <ListTree size={18} />
                        1. Categorías / Familias
                    </button>
                    <button
                        onClick={() => setActiveTab('articulos')}
                        className={`
                            whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                            ${activeTab === 'articulos'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-textMuted hover:text-textMain hover:border-textMuted'
                            }
                        `}
                    >
                        <Tags size={18} />
                        2. Precios y Artículos
                    </button>
                </nav>
            </div>

            {/* Content Area */}
            <div className="flex-1 min-h-0">
                {activeTab === 'categorias' ? <CategoriasTab /> : <ArticulosTab />}
            </div>

        </div>
    )
}
