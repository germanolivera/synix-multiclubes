import { useState, useRef } from 'react'
import { UploadCloud, X, CheckCircle2, AlertCircle, FileSpreadsheet } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { useBranch } from '../../../contexts/BranchContext'
import { useCategoriasData } from '../../../hooks/useCategoriasData'
import { Articulo } from '../../../types/database.types'

interface CSVImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CSVImportModal({ isOpen, onClose, onSuccess }: CSVImportModalProps) {
    const { activeClub } = useBranch()
    const { categorias, refreshCategorias } = useCategoriasData()

    const [file, setFile] = useState<File | null>(null)
    const [parsedData, setParsedData] = useState<{ categoria: string, articulo: string, precio: number, activo: boolean }[]>([])
    
    // Status
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const [step, setStep] = useState<1 | 2>(1) // 1: Upload, 2: Preview & Confirm

    const fileInputRef = useRef<HTMLInputElement>(null)

    if (!isOpen) return null

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0]
        if (!selected) return

        if (!selected.name.endsWith('.csv')) {
            setError('Por favor, selecciona un archivo .csv')
            return
        }

        setError(null)
        setFile(selected)
        parseCSV(selected)
    }

    const parseCSV = (file: File) => {
        const reader = new FileReader()
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string
                if (!text) throw new Error("Archivo vacío")

                // Simple CSV parsing avoiding quotes edge cases for a standard clean CSV.
                // Assuming format: Categoria,Articulo,Precio (with or without headers)
                const rows = text.split('\n').filter(row => row.trim().length > 0)
                
                const data = []
                let skippedHeader = false

                for (let i = 0; i < rows.length; i++) {
                    const line = rows[i].trim()
                    // Handle comma or semicolon
                    const separator = line.includes(';') ? ';' : ','
                    const cols = line.split(separator).map(c => c.trim().replace(/^"|"$/g, ''))

                    if (cols.length < 3) continue // Skip invalid lines

                    const catName = cols[0]
                    const artName = cols[1]
                    const rawPrice = cols[2].replace(/[^0-9.-]+/g, '') // remove currency symbols if any
                    const price = parseFloat(rawPrice)

                    let activo = true
                    if (cols.length >= 4 && cols[3]) {
                        const statusStr = cols[3].toLowerCase()
                        if (statusStr.includes('inactivo') || statusStr.includes('desactivado') || statusStr === 'falso' || statusStr === 'false' || statusStr === '0') {
                            activo = false
                        }
                    }

                    // Determine if it's the header row
                    if (!skippedHeader && isNaN(price) && i === 0) {
                        skippedHeader = true
                        continue
                    }

                    if (catName && artName && !isNaN(price)) {
                        data.push({ categoria: catName, articulo: artName, precio: price, activo })
                    }
                }

                if (data.length === 0) {
                    throw new Error("No se encontraron registros válidos. Asegúrate de que las columnas sean: Categoría, Artículo, Precio numérico.")
                }

                setParsedData(data)
                setStep(2)
            } catch (err: any) {
                setError(err.message || 'Error leyendo el archivo CSV.')
            }
        }
        reader.onerror = () => setError("Error leyendo el archivo")
        reader.readAsText(file) // assuming UTF-8
    }

    const getNewCategoriesCount = () => {
        const existingCatNames = categorias.map(c => c.nombre.toLowerCase())
        const csvCats = Array.from(new Set(parsedData.map(d => d.categoria.trim())))
        const newCats = csvCats.filter(c => !existingCatNames.includes(c.toLowerCase()))
        return newCats.length
    }

    const processImport = async () => {
        if (!activeClub) return
        setLoading(true)
        setError(null)

        try {
            // 1. Resolve Categories
            const csvCatNames = Array.from(new Set(parsedData.map(d => d.categoria.trim())))
            const existingCatMap = new Map<string, string>() // lowercase_name -> uuid

            categorias.forEach(c => existingCatMap.set(c.nombre.toLowerCase(), c.id))

            const catsToInsert = csvCatNames
                .filter(name => !existingCatMap.has(name.toLowerCase()))
                .map(name => ({
                    club_id: activeClub.id,
                    nombre: name,
                    descripcion: 'Importado vía CSV',
                    estado: true
                }))

            if (catsToInsert.length > 0) {
                const { data: insertedCats, error: catError } = await supabase
                    .from('categorias_articulos')
                    .insert(catsToInsert)
                    .select()

                if (catError) throw new Error("Error creando categorías: " + catError.message)
                
                // Add new ones to our map
                if (insertedCats) {
                    insertedCats.forEach(c => existingCatMap.set(c.nombre.toLowerCase(), c.id))
                }
            }

            // 2. Fetch existing articles to update instead of duplicate
            const { data: existingArticulos, error: fetchArtError } = await supabase
                .from('articulos')
                .select('id, nombre, categoria_id, precio, activo')
                .eq('club_id', activeClub.id)
            
            if (fetchArtError) throw new Error("Error obteniendo artículos existentes: " + fetchArtError.message)

            const existingArtMap = new Map<string, { id: string, precio: number, activo: boolean }>()
            if (existingArticulos) {
                existingArticulos.forEach(art => {
                    const key = `${art.categoria_id || 'null'}|${art.nombre.toLowerCase().trim()}`
                    existingArtMap.set(key, { id: art.id, precio: art.precio, activo: art.activo })
                })
            }

            // 3. Prepare Articles (Insert vs Update)
            const articulosToInsert: Omit<Articulo, 'id' | 'created_at'>[] = []
            const articulosToUpdate: { id: string, precio: number, activo: boolean }[] = []
            let unchangedCount = 0

            parsedData.forEach(row => {
                const catId = existingCatMap.get(row.categoria.toLowerCase()) || null
                const key = `${catId || 'null'}|${row.articulo.toLowerCase().trim()}`
                
                if (existingArtMap.has(key)) {
                    // Exists: check if price changed
                    const existing = existingArtMap.get(key)!
                    if (existing.precio !== row.precio || existing.activo !== row.activo) {
                        articulosToUpdate.push({
                            id: existing.id,
                            precio: row.precio,
                            activo: row.activo
                        })
                    } else {
                        unchangedCount++
                    }
                } else {
                    // New article
                    articulosToInsert.push({
                        club_id: activeClub.id,
                        categoria_id: catId!,
                        nombre: row.articulo,
                        precio: row.precio,
                        controla_stock: false,
                        stock_actual: 0,
                        activo: row.activo
                    })
                }
            })

            // 4. Batch Insert New Articles
            if (articulosToInsert.length > 0) {
                const { error: artError } = await supabase
                    .from('articulos')
                    .insert(articulosToInsert)

                if (artError) throw new Error("Error importando artículos nuevos: " + artError.message)
            }

            // 5. Batch Update Existing Articles
            if (articulosToUpdate.length > 0) {
                // Chunk to avoid hitting connection limits
                const chunkSize = 50;
                for (let i = 0; i < articulosToUpdate.length; i += chunkSize) {
                    const chunk = articulosToUpdate.slice(i, i + chunkSize)
                    await Promise.all(
                        chunk.map(art => 
                            supabase
                                .from('articulos')
                                .update({ precio: art.precio, activo: art.activo })
                                .eq('id', art.id)
                        )
                    )
                }
            }

            setSuccessMessage(`¡Importación exitosa! Se añadieron ${articulosToInsert.length} artículo(s) y se actualizaron ${articulosToUpdate.length}. ${unchangedCount > 0 ? `(${unchangedCount} sin cambios)` : ''}`);
            
            // Wait 2s and close
            setTimeout(() => {
                onSuccess()
                refreshCategorias()
                onClose()
            }, 2000)

        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const reset = () => {
        setFile(null)
        setParsedData([])
        setStep(1)
        setError(null)
        setSuccessMessage(null)
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={loading ? undefined : onClose} />
            <div className="relative w-full max-w-lg bg-surface border border-border rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <FileSpreadsheet size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-textMain">Importar Precios via CSV</h2>
                            <p className="text-sm text-textMuted mt-0.5">Estructura requerida: Categoría, Artículo, Precio</p>
                        </div>
                    </div>
                    {!loading && !successMessage && (
                        <button onClick={onClose} className="p-2 text-textMuted hover:bg-white/5 rounded-lg transition-colors">
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto">
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3 text-red-500">
                            <AlertCircle size={20} className="shrink-0 mt-0.5" />
                            <div className="text-sm">{error}</div>
                        </div>
                    )}

                    {successMessage && (
                        <div className="mb-6 p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex flex-col items-center justify-center text-center gap-4 text-emerald-500 animate-in fade-in">
                            <CheckCircle2 size={48} className="text-emerald-500" />
                            <div>
                                <h3 className="text-lg font-bold">{successMessage}</h3>
                                <p className="text-sm mt-1 opacity-80">Refrescando datos...</p>
                            </div>
                        </div>
                    )}

                    {!successMessage && step === 1 && (
                        <div 
                            className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-primary/50 hover:bg-white/[0.02] transition-colors cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <UploadCloud size={40} className="text-textMuted mb-4" />
                            <h3 className="text-base font-semibold text-textMain mb-1">Haz clic para subir un archivo .csv</h3>
                            <p className="text-sm text-textMuted max-w-xs">
                                Selecciona un archivo separado por comas o punto y coma.
                            </p>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                accept=".csv" 
                                className="hidden" 
                                onChange={handleFileChange}
                            />
                        </div>
                    )}

                    {!successMessage && step === 2 && (
                        <div className="space-y-6">
                            <div className="p-4 bg-background border border-border rounded-lg">
                                <h4 className="text-sm font-semibold text-textMain mb-3">
                                    Resumen del archivo leído: <span className="font-mono text-xs bg-surface px-2 py-1 rounded ml-1">{file?.name}</span>
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-surface p-3 rounded border border-border">
                                        <p className="text-xs text-textMuted mb-1">Total de Artículos</p>
                                        <p className="text-xl font-bold text-textMain">{parsedData.length}</p>
                                    </div>
                                    <div className="bg-surface p-3 rounded border border-border">
                                        <p className="text-xs text-textMuted mb-1">Categorías Nuevas</p>
                                        <p className="text-xl font-bold text-emerald-400">+{getNewCategoriesCount()}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="border border-border rounded-lg overflow-hidden max-h-48 custom-scrollbar overflow-y-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-background border-b border-border sticky top-0">
                                        <tr>
                                            <th className="px-3 py-2 text-textMuted font-medium">Categoría</th>
                                            <th className="px-3 py-2 text-textMuted font-medium">Artículo</th>
                                            <th className="px-3 py-2 text-textMuted font-medium text-right">Precio</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {parsedData.slice(0, 50).map((row, idx) => (
                                            <tr key={idx} className="bg-surface">
                                                <td className="px-3 py-2 text-textMain">{row.categoria}</td>
                                                <td className="px-3 py-2 text-textMain">{row.articulo}</td>
                                                <td className="px-3 py-2 text-textMain text-right">${row.precio}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {parsedData.length > 50 && (
                                    <div className="text-center py-2 text-xs text-textMuted bg-surface border-t border-border">
                                        Mostrando los primeros 50 registros...
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {!successMessage && (
                    <div className="p-6 border-t border-border bg-background flex justify-end gap-3">
                        {step === 2 && (
                            <button
                                onClick={reset}
                                disabled={loading}
                                className="px-4 py-2 text-sm font-medium text-textMain bg-surface border border-border hover:bg-white/5 rounded-lg transition-colors"
                            >
                                Cambiar Archivo
                            </button>
                        )}
                        <button
                            onClick={step === 1 ? () => fileInputRef.current?.click() : processImport}
                            disabled={loading || (step === 2 && parsedData.length === 0)}
                            className="px-6 py-2 bg-primary hover:bg-primaryHover text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Importando...</span>
                                </>
                            ) : step === 1 ? (
                                'Seleccionar CSV'
                            ) : (
                                'Confirmar e Importar'
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
