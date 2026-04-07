import { useState } from 'react'
import { Plus, Minus, X, PackagePlus } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { Articulo } from '../../../types/database.types'

interface StockAdjustModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    articulo: Articulo;
}

export default function StockAdjustModal({ isOpen, onClose, onSuccess, articulo }: StockAdjustModalProps) {
    const [adjustment, setAdjustment] = useState<number>(0)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (adjustment === 0) {
            onClose()
            return
        }
        
        setLoading(true)
        setError(null)
        
        try {
            // Fetch latest to prevent race conditions as much as client-side allows without RPC
            const { data: art, error: fetchError } = await supabase
                .from('articulos')
                .select('stock_actual')
                .eq('id', articulo.id)
                .single()
                
            if (fetchError) throw new Error("Error obteniendo stock actual")
            
            const currentStock = Number(art?.stock_actual || 0)
            const newStock = Math.max(0, currentStock + adjustment)
            
            const { error: updateError } = await supabase
                .from('articulos')
                .update({ stock_actual: newStock })
                .eq('id', articulo.id)
                
            if (updateError) throw updateError
            
            onSuccess()
            onClose()
        } catch (err: any) {
            setError(err.message)
            setLoading(false)
        }
    }

    // Calcular el stock resultante visual
    const resultantStock = Math.max(0, (articulo.stock_actual || 0) + adjustment)

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={loading ? undefined : onClose} />
            <div className="relative w-full max-w-sm bg-surface border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <PackagePlus size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-textMain">Ajuste de Stock</h2>
                            <p className="text-xs text-textMuted truncate max-w-[200px]">{articulo.nombre}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-textMuted hover:text-textMain hover:bg-white/5 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                            {error}
                        </div>
                    )}
                    
                    <div className="flex items-center justify-between mb-6">
                        <div className="text-sm font-medium text-textMuted">Stock Actual en Sistema</div>
                        <div className="text-xl font-bold text-textMuted">{articulo.stock_actual}</div>
                    </div>
                    
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-textMain mb-2 text-center">Unidades Ingresadas a Sumar/Restar</label>
                        <div className="flex items-center justify-center gap-4">
                            <button 
                                type="button" 
                                onClick={() => setAdjustment(prev => prev - 1)}
                                className="w-12 h-12 flex items-center justify-center rounded-xl bg-surface border border-border text-textMuted hover:text-rose-500 hover:border-rose-500 transition-colors shadow-sm"
                            >
                                <Minus size={24} />
                            </button>
                            <input 
                                type="number" 
                                value={adjustment}
                                onChange={(e) => setAdjustment(parseInt(e.target.value) || 0)}
                                className="w-24 bg-background border border-border rounded-xl flex items-center justify-center text-center text-xl font-bold text-textMain py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary h-12"
                            />
                            <button 
                                type="button" 
                                onClick={() => setAdjustment(prev => prev + 1)}
                                className="w-12 h-12 flex items-center justify-center rounded-xl bg-surface border border-border text-textMuted hover:text-emerald-500 hover:border-emerald-500 transition-colors shadow-sm"
                            >
                                <Plus size={24} />
                            </button>
                        </div>
                        <p className="text-xs text-center text-textMuted mt-3">Usa valores positivos al recibir mercadería y negativos para mermas o roturas.</p>
                    </div>

                    <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
                        <div className="text-sm font-medium text-textMuted">Nuevo Stock Final</div>
                        <div className={`text-xl font-bold ${adjustment > 0 ? 'text-emerald-500' : adjustment < 0 ? 'text-rose-500' : 'text-textMain'}`}>
                            {resultantStock}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-8">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-textMuted hover:text-textMain transition-colors text-sm font-medium border border-border rounded-lg bg-background hover:bg-surface shadow-sm">
                            Cancelar
                        </button>
                        <button type="submit" disabled={loading || adjustment === 0} className="px-6 py-2 bg-primary hover:bg-primaryHover text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 shadow-sm flex items-center justify-center min-w-[120px]">
                            {loading ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div> : 'Aplicar Ajuste'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
