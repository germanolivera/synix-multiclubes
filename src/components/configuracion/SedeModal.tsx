import React, { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import { supabase } from '../../lib/supabase'
import { Club } from '../../contexts/BranchContext'
import { useAuth } from '../../contexts/AuthContext'

interface SedeModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    sedeToEdit: Club | null
}

export default function SedeModal({ isOpen, onClose, onSuccess, sedeToEdit }: SedeModalProps) {
    const { session } = useAuth()
    const [nombre, setNombre] = useState('')
    const [domicilio, setDomicilio] = useState('')
    const [localidad, setLocalidad] = useState('')
    const [telefono, setTelefono] = useState('')
    const [email, setEmail] = useState('')
    const [estado, setEstado] = useState<'Operativa' | 'Parcialmente Operativa' | 'Suspendida' | 'Mantenimiento'>('Operativa')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (sedeToEdit) {
            setNombre(sedeToEdit.nombre)
            setDomicilio(sedeToEdit.domicilio || '')
            setLocalidad(sedeToEdit.localidad || '')
            setTelefono(sedeToEdit.telefono || '')
            setEmail(sedeToEdit.email || '')
            setEstado(sedeToEdit.estado || 'Operativa')
        } else {
            setNombre('')
            setDomicilio('')
            setLocalidad('')
            setTelefono('')
            setEmail('')
            setEstado('Operativa')
        }
    }, [sedeToEdit, isOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const orgId = session?.user.app_metadata?.organizacion_id

        if (!orgId) {
            setError('Error: el usuario no tiene una organización asignada.')
            setLoading(false)
            return
        }

        try {
            if (sedeToEdit) {
                // UPDATE
                const { error: updateError } = await supabase
                    .from('clubes')
                    .update({
                        nombre: nombre.trim(),
                        domicilio: domicilio.trim() || null,
                        localidad: localidad.trim() || null,
                        telefono: telefono.trim() || null,
                        email: email.trim() || null,
                        estado
                    })
                    .eq('id', sedeToEdit.id)

                if (updateError) throw updateError
            } else {
                // INSERT
                const { error: insertError } = await supabase
                    .from('clubes')
                    .insert([{
                        nombre: nombre.trim(),
                        organizacion_id: orgId,
                        domicilio: domicilio.trim() || null,
                        localidad: localidad.trim() || null,
                        telefono: telefono.trim() || null,
                        email: email.trim() || null,
                        estado
                    }])

                if (insertError) throw insertError
            }

            onSuccess()
            onClose()
        } catch (err: any) {
            console.error('Error saving sede:', err)
            setError(err.message || 'Error al guardar la Sede')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={sedeToEdit ? 'Editar Sede' : 'Nueva Sede'}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg p-3 text-sm">
                        {error}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-textMain mb-1">
                        Nombre de la Sede <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        required
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        className="w-full bg-surface border border-border text-textMain text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                        placeholder="ej. Sede Belgrano"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-textMain mb-1">
                        Estado <span className="text-red-500">*</span>
                    </label>
                    <select
                        required
                        value={estado}
                        onChange={(e) => setEstado(e.target.value as any)}
                        className="w-full bg-surface border border-border text-textMain text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors cursor-pointer appearance-none"
                    >
                        <option value="Operativa">Operativa</option>
                        <option value="Parcialmente Operativa">Parcialmente Operativa</option>
                        <option value="Suspendida">Suspendida</option>
                        <option value="Mantenimiento">Mantenimiento</option>
                    </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-textMain mb-1">
                            Domicilio
                        </label>
                        <input
                            type="text"
                            value={domicilio}
                            onChange={(e) => setDomicilio(e.target.value)}
                            className="w-full bg-surface border border-border text-textMain text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                            placeholder="Calle 123"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-textMain mb-1">
                            Localidad
                        </label>
                        <input
                            type="text"
                            value={localidad}
                            onChange={(e) => setLocalidad(e.target.value)}
                            className="w-full bg-surface border border-border text-textMain text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                            placeholder="Ciudad Autónoma de Buenos Aires"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-textMain mb-1">
                            Teléfono
                        </label>
                        <input
                            type="tel"
                            value={telefono}
                            onChange={(e) => setTelefono(e.target.value)}
                            className="w-full bg-surface border border-border text-textMain text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                            placeholder="+54 11 1234-5678"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-textMain mb-1">
                            Email de Contacto
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-surface border border-border text-textMain text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                            placeholder="contacto@sede.com"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 border border-border rounded-lg text-sm font-medium text-textMain hover:bg-surface transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-primary hover:bg-primaryHover text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading && <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />}
                        {loading ? 'Guardando...' : 'Guardar Sede'}
                    </button>
                </div>
            </form>
        </Modal>
    )
}
