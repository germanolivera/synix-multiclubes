import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

interface PerfilEmpleado {
    id: string
    user_id: string
    nombre: string
    apellido: string | null
    rol: string
    organizacion_id: string
    created_at: string
}

export default function Personal() {
    const { session } = useAuth()
    const [empleados, setEmpleados] = useState<PerfilEmpleado[]>([])
    const [loading, setLoading] = useState(true)

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [nombre, setNombre] = useState('')
    const [apellido, setApellido] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)



    const fetchEmpleados = useCallback(async () => {
        const orgId = session?.user?.app_metadata?.organizacion_id
        if (!orgId) {
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('perfiles_empleados')
                .select('*')
                .eq('organizacion_id', orgId)
                .order('created_at', { ascending: false })

            if (error) {
                console.error("Error fetching empleados:", error)
            } else {
                setEmpleados(data || [])
            }
        } finally {
            setLoading(false)
        }
    }, [session])

    useEffect(() => {
        fetchEmpleados()
    }, [session, fetchEmpleados])

    const handleCreateEmpleado = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!session) return
        setIsSubmitting(true)

        try {
            const { data, error } = await supabase.functions.invoke('manage-staff', {
                body: { action: 'create', email, password, nombre, apellido },
                headers: {
                    Authorization: `Bearer ${session.access_token}`
                }
            })

            if (error) throw new Error(error.message || 'Error al crear la cuenta')
            if (data?.error) throw new Error(data.error)

            alert('Empleado creado con éxito')
            setIsModalOpen(false)
            setEmail('')
            setPassword('')
            setNombre('')
            setApellido('')
            fetchEmpleados()

        } catch (err: any) {
            alert(err.message || 'Ocurrió un error')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (userId: string, targetName: string) => {
        if (!confirm(`¿Estás seguro que deseas revocar el acceso y eliminar la cuenta de ${targetName}?`)) return
        setIsSubmitting(true)

        if (!session) return
        
        try {
            const { data, error } = await supabase.functions.invoke('manage-staff', {
                body: { action: 'delete', targetUserId: userId },
                headers: {
                    Authorization: `Bearer ${session.access_token}`
                }
            })

            if (error) throw new Error(error.message || 'Error al eliminar empleado')
            if (data?.error) throw new Error(data.error)
            
            // Delete profile associated with it
            await supabase.from('perfiles_empleados').delete().eq('user_id', userId);

            alert('Empleado eliminado exitosamente')
            fetchEmpleados()
            
        } catch (err: any) {
            alert(err.message || 'Ocurrió un error')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="h-full flex flex-col max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            <div className="flex items-center gap-4">
                <Link to="/configuracion" className="p-2 -ml-2 text-textMuted hover:text-textMain hover:bg-surface border border-transparent hover:border-border rounded-lg transition-all">
                    <ArrowLeft size={20} />
                </Link>
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold text-textMain tracking-tight">Personal</h1>
                    <p className="text-sm text-textMuted">Administra las cuentas de usuario de tus empleados</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="ml-auto inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 uppercase tracking-wider bg-transparent text-primary hover:bg-primary/10 h-10 px-4 py-2 border border-primary/20 hover:border-primary/50"
                >
                    <Plus size={16} />
                    Invitar Empleado
                </button>
            </div>

            <div className="bg-surface border border-border rounded-xl flex-1 overflow-hidden flex flex-col min-h-[400px]">
                <div className="flex flex-col h-full">
                    {loading ? (
                        <div className="p-8 text-center text-textMuted">Cargando personal...</div>
                    ) : empleados.length === 0 ? (
                        <div className="p-12 text-center flex flex-col items-center justify-center h-full">
                            <div className="w-16 h-16 rounded-full bg-surface border border-border flex items-center justify-center text-textMuted mb-4">
                                <Plus size={24} />
                            </div>
                            <h3 className="text-lg font-medium text-textMain mb-1">Sin empleados registrados</h3>
                            <p className="text-sm text-textMuted max-w-sm">No tienes cuentas secundarias de empleados en tu organización. Agrega una nueva presionando el botón superior.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs uppercase bg-background text-textMuted border-b border-border sticky top-0 z-10">
                                    <tr>
                                        <th scope="col" className="px-6 py-4 font-semibold">Nombre</th>
                                        <th scope="col" className="px-6 py-4 font-semibold">Rol</th>
                                        <th scope="col" className="px-6 py-4 font-semibold text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {empleados.map((empleado) => (
                                        <tr key={empleado.id} className="border-b border-border hover:bg-background/50 transition-colors group">
                                            <td className="px-6 py-4 font-medium text-textMain">
                                            {empleado.nombre} {empleado.apellido ?? ''}
                                                {empleado.user_id === session?.user?.id && <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Tú</span>}
                                            </td>
                                            <td className="px-6 py-4 text-textMuted capitalize">
                                                {empleado.rol}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {empleado.user_id !== session?.user?.id && (
                                                    <button
                                                        onClick={() => handleDelete(empleado.user_id, `${empleado.nombre} ${empleado.apellido}`)}
                                                        disabled={isSubmitting}
                                                        className="text-textMuted hover:text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition-colors flex items-center gap-2 md:w-auto w-full md:justify-end justify-center ml-auto"
                                                        title="Revocar acceso"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Employee Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-surface border border-border rounded-xl shadow-lg w-full max-w-sm flex flex-col p-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold text-textMain tracking-tight">Nuevo Empleado</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-textMuted hover:text-textMain transition-colors">
                                <Plus className="rotate-45" size={24} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleCreateEmpleado} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-sm font-medium text-textMain mb-1">Nombre</label>
                                <input
                                    type="text"
                                    required
                                    value={nombre}
                                    onChange={(e) => setNombre(e.target.value)}
                                    className="w-full bg-background border border-border text-textMain text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-textMain mb-1">Apellido</label>
                                <input
                                    type="text"
                                    required
                                    value={apellido}
                                    onChange={(e) => setApellido(e.target.value)}
                                    className="w-full bg-background border border-border text-textMain text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-textMain mb-1">Email <span className="text-xs text-textMuted font-normal">(Será su usuario)</span></label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-background border border-border text-textMain text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-textMain mb-1">Contraseña provisoria</label>
                                <input
                                    type="text"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Al menos 6 caracteres"
                                    className="w-full bg-background border border-border text-textMain text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                                    minLength={6}
                                />
                            </div>

                            <div className="flex gap-3 justify-end mt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-textMuted hover:text-textMain border border-border hover:bg-background rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 text-sm font-medium bg-primary text-white hover:bg-primaryHover rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Creando...' : 'Crear Cuenta'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
