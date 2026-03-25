import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import { supabase } from '../../lib/supabase'
import { useBranch } from '../../contexts/BranchContext'
import { Plus, X, Layers } from 'lucide-react'

interface EspacioModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    espacioToEdit?: any | null
    deportes: any[] // passed from parent
}

export default function EspacioModal({ isOpen, onClose, onSuccess, espacioToEdit, deportes }: EspacioModalProps) {
    const { activeClub } = useBranch()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Core fields
    const [nombre, setNombre] = useState('')
    const [capacidad, setCapacidad] = useState<number>(4)
    const [deporteId, setDeporteId] = useState<string>('')
    const [estado, setEstado] = useState('Activo')
    const [esMultideporte, setEsMultideporte] = useState(false)

    // JSON fields
    const [caracProps, setCaracProps] = useState<Array<{ key: string, value: string }>>([])
    const [newCaracKey, setNewCaracKey] = useState('')
    const [newCaracVal, setNewCaracVal] = useState('')

    useEffect(() => {
        if (espacioToEdit) {
            setNombre(espacioToEdit.nombre || '')
            setCapacidad(espacioToEdit.capacidad || 4)
            setDeporteId(espacioToEdit.deporte_id || (deportes[0]?.id || ''))
            setEstado(espacioToEdit.estado || 'Activo')
            setEsMultideporte(espacioToEdit.es_multideporte || false)

            const c = espacioToEdit.caracteristicas || {}
            setCaracProps(Object.keys(c).map(k => ({ key: k, value: String(c[k]) })))
        } else {
            setNombre('')
            setCapacidad(4)
            setDeporteId(deportes[0]?.id || '')
            setEstado('Activo')
            setEsMultideporte(false)
            setCaracProps([])
        }
        setError(null)
    }, [espacioToEdit, isOpen, deportes])

    const handleAddCarac = (e: React.MouseEvent | React.KeyboardEvent) => {
        e.preventDefault()
        if (newCaracKey.trim() && newCaracVal.trim()) {
            // replace if exists, else add
            const filtered = caracProps.filter(x => x.key !== newCaracKey.trim())
            setCaracProps([...filtered, { key: newCaracKey.trim(), value: newCaracVal.trim() }])
            setNewCaracKey('')
            setNewCaracVal('')
        }
    }

    const handleRemoveCarac = (k: string) => {
        setCaracProps(caracProps.filter(x => x.key !== k))
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

            // rebuild JSON object
            const caracteristicasJson: Record<string, string> = {}
            caracProps.forEach(x => {
                caracteristicasJson[x.key] = x.value
            })

            const payload = {
                club_id: clubId,
                nombre: nombre.trim(),
                capacidad,
                deporte_id: esMultideporte ? null : (deporteId || null),
                estado,
                caracteristicas: caracteristicasJson,
                es_multideporte: esMultideporte
            }

            if (espacioToEdit) {
                const { error: updateError } = await supabase
                    .from('espacios')
                    .update(payload)
                    .eq('id', espacioToEdit.id)
                if (updateError) throw updateError
            } else {
                const { error: insertError } = await supabase
                    .from('espacios')
                    .insert([payload])
                if (insertError) throw insertError
            }

            onSuccess()
            onClose()

        } catch (err: any) {
            console.error(err)
            setError(err.message || 'Ocurrió un error al guardar el espacio.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={espacioToEdit ? 'Editar Espacio' : 'Nuevo Espacio'}>
            <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-3 rounded-md">
                        {error}
                    </div>
                )}

                <div className="flex gap-4">
                    <div className="flex-[2] space-y-1">
                        <label className="block text-sm font-medium text-textMain">Nombre (Ej. Cancha 1) <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            required
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-textMain focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                        />
                    </div>
                    <div className="flex-1 space-y-1">
                        <label className="block text-sm font-medium text-textMain">Capacidad (Jugadores) <span className="text-red-500">*</span></label>
                        <input
                            type="number"
                            min="1"
                            required
                            value={capacidad}
                            onChange={(e) => setCapacidad(parseInt(e.target.value))}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-textMain focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                        />
                    </div>
                </div>

                {/* Multideporte Toggle */}
                <div className="border border-border rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${esMultideporte ? 'bg-primary/20 text-primary' : 'bg-surface text-textMuted border border-border'}`}>
                                <Layers size={18} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-textMain">Espacio Multideportes</p>
                                <p className="text-xs text-textMuted">Habilita múltiples actividades en este espacio (ej. Yoga, Zumba, Funcional)</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setEsMultideporte(!esMultideporte)}
                            className={`relative w-11 h-6 rounded-full transition-colors ${esMultideporte ? 'bg-primary' : 'bg-border'}`}
                        >
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${esMultideporte ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    {esMultideporte && (
                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                            <p className="text-xs text-primary leading-relaxed">
                                <strong>Modo Multideportes activo:</strong> Al crear un turno en este espacio, se pedirá seleccionar la actividad/deporte correspondiente. No se asigna un deporte fijo al espacio.
                            </p>
                        </div>
                    )}
                </div>

                <div className="flex gap-4">
                    {/* Only show Deporte selector when NOT multideporte */}
                    {!esMultideporte && (
                        <div className="flex-1 space-y-1">
                            <label className="block text-sm font-medium text-textMain">Deporte <span className="text-red-500">*</span></label>
                            <select
                                required={!esMultideporte}
                                value={deporteId}
                                onChange={(e) => setDeporteId(e.target.value)}
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-textMain focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                            >
                                <option value="" disabled>Seleccionar deporte</option>
                                {deportes.map(d => (
                                    <option key={d.id} value={d.id}>{d.nombre}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div className={esMultideporte ? "flex-1 space-y-1" : "flex-1 space-y-1"}>
                        <label className="block text-sm font-medium text-textMain">Estado <span className="text-red-500">*</span></label>
                        <select
                            required
                            value={estado}
                            onChange={(e) => setEstado(e.target.value)}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-textMain focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                        >
                            <option value="Activo">Activo</option>
                            <option value="Mantenimiento">Mantenimiento</option>
                            <option value="Inactivo">Inactivo / Suspendido</option>
                        </select>
                    </div>
                </div>

                {/* Dynamic Characteristics */}
                <div className="space-y-2 border-t border-border pt-4">
                    <label className="block text-sm font-medium text-textMain">Características Específicas</label>
                    <p className="text-xs text-textMuted">Agrega detalles como "Superficie: Césped" o "Techada: Si"</p>

                    <div className="space-y-2 mb-2">
                        {caracProps.map((c, idx) => (
                            <div key={idx} className="flex items-center justify-between px-3 py-2 rounded bg-surface border border-border text-sm">
                                <span className="text-textMain"><span className="font-semibold">{c.key}:</span> {c.value}</span>
                                <button type="button" onClick={() => handleRemoveCarac(c.key)} className="text-textMuted hover:text-red-500"><X size={14} /></button>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newCaracKey}
                            onChange={(e) => setNewCaracKey(e.target.value)}
                            placeholder="Ej. Techo"
                            className="flex-[1] px-3 py-2 bg-background border border-border rounded-lg text-sm text-textMain focus:ring-1 focus:ring-primary outline-none"
                        />
                        <input
                            type="text"
                            value={newCaracVal}
                            onChange={(e) => setNewCaracVal(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' ? handleAddCarac(e) : null}
                            placeholder="Ej. Chapa"
                            className="flex-[2] px-3 py-2 bg-background border border-border rounded-lg text-sm text-textMain focus:ring-1 focus:ring-primary outline-none"
                        />
                        <button
                            type="button"
                            onClick={handleAddCarac}
                            className="px-3 py-2 bg-surface hover:bg-white/5 border border-border rounded-lg transition-colors text-textMuted hover:text-textMain"
                        >
                            <Plus size={18} />
                        </button>
                    </div>
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
                            'Guardar Espacio'
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    )
}
