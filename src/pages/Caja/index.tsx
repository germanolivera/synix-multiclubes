import { useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, DollarSign, PackageOpen, CreditCard, Activity } from 'lucide-react'
import { useCajaData } from '../../hooks/useCajaData'

// Helper for formatting currency
const formatMoney = (amount: number) => `$${amount.toLocaleString('es-AR')}`

export function CajaDashboard() {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())
    const { sesiones, summary, loading, error } = useCajaData(selectedDate)

    const prevDay = () => setSelectedDate(d => new Date(d.getTime() - 86400000))
    const nextDay = () => setSelectedDate(d => new Date(d.getTime() + 86400000))
    const today = () => setSelectedDate(new Date())

    const formattedDate = selectedDate.toLocaleDateString('es-AR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })

    return (
        <div className="h-full flex flex-col bg-background">
            {/* Header & Date Navigation */}
            <div className="shrink-0 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border">
                <div>
                    <h1 className="text-2xl font-bold text-textMain mb-1">Caja y Reportes</h1>
                    <p className="text-sm text-textMuted">Rendimiento financiero y cobros de la jornada.</p>
                </div>

                <div className="flex items-center gap-2 bg-surface p-1 rounded-lg border border-border">
                    <button
                        onClick={prevDay}
                        className="p-2 hover:bg-[#2a2d3d] rounded-md transition-colors text-textMuted hover:text-textMain"
                        title="Día Anterior"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <div className="flex items-center gap-2 px-3 py-1 bg-[#151923] rounded-md min-w-[200px] justify-center border border-[#2a2d3d]">
                        <CalendarIcon size={16} className="text-primary" />
                        <span className="text-sm font-medium text-textMain capitalize">
                            {formattedDate}
                        </span>
                    </div>
                    <button
                        onClick={nextDay}
                        className="p-2 hover:bg-[#2a2d3d] rounded-md transition-colors text-textMuted hover:text-textMain"
                        title="Día Siguiente"
                    >
                        <ChevronRight size={18} />
                    </button>
                    <button
                        onClick={today}
                        className="px-3 py-1.5 ml-1 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 rounded-md transition-colors"
                    >
                        Hoy
                    </button>
                </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                        Error al cargar la caja: {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex-1 flex items-center justify-center min-h-[400px]">
                        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                    </div>
                ) : (
                    <>
                        {/* KPI Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            {/* Total Revenue */}
                            <div className="bg-surface border border-border rounded-xl p-5 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <DollarSign size={80} className="text-primary -mr-4 -mt-4 transform rotate-12" />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 text-textMuted mb-2">
                                        <DollarSign size={16} className="text-primary" />
                                        <h3 className="text-sm font-medium">Total Recaudado</h3>
                                    </div>
                                    <p className="text-4xl font-bold text-white tracking-tight">{formatMoney(summary.totalRecaudado)}</p>
                                    <div className="mt-3 flex items-center gap-4 text-xs font-medium">
                                        <span className="text-emerald-400">Alquileres: {formatMoney(summary.totalAlquileres)}</span>
                                        <span className="text-[#818cf8]">Kiosco/Otros: {formatMoney(summary.totalKiosco)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Session Activity */}
                            <div className="bg-surface border border-border rounded-xl p-5">
                                <div className="flex items-center gap-2 text-textMuted mb-2">
                                    <Activity size={16} className="text-[#f43f5e]" />
                                    <h3 className="text-sm font-medium">Total Turnos</h3>
                                </div>
                                <p className="text-3xl font-bold text-white mb-1">{summary.cantidadTurnos}</p>
                                <p className="text-xs text-textMuted font-medium">Turnos registrados en el día</p>
                            </div>

                            {/* Paid / Deposit Status */}
                            <div className="bg-surface border border-border rounded-xl p-5">
                                <div className="flex items-center gap-2 text-textMuted mb-2">
                                    <CreditCard size={16} className="text-emerald-400" />
                                    <h3 className="text-sm font-medium">Cobros Realizados</h3>
                                </div>
                                <p className="text-3xl font-bold text-emerald-400 mb-1">{summary.turnosPagados + summary.turnosSenados}</p>
                                <div className="flex gap-3 text-xs font-medium text-textMuted">
                                    <span>Pagados: <span className="text-white">{summary.turnosPagados}</span></span>
                                    <span>Señados: <span className="text-white">{summary.turnosSenados}</span></span>
                                </div>
                            </div>

                            {/* Pending Status */}
                            <div className="bg-surface border border-border rounded-xl p-5">
                                <div className="flex items-center gap-2 text-textMuted mb-2">
                                    <PackageOpen size={16} className="text-amber-400" />
                                    <h3 className="text-sm font-medium">Por Cobrar</h3>
                                </div>
                                <p className="text-3xl font-bold text-amber-400 mb-1">{summary.turnosPendientes}</p>
                                <p className="text-xs text-textMuted font-medium">Requieren cierre de caja</p>
                            </div>
                        </div>

                        {/* Detailed Sessions Table */}
                        <div className="bg-surface border border-border rounded-xl overflow-hidden flex flex-col">
                            <div className="p-5 border-b border-border flex items-center justify-between">
                                <h2 className="text-lg font-bold text-textMain">Detalle de Operaciones</h2>
                                <span className="text-xs font-medium px-2 py-1 bg-[#151923] rounded border border-[#2a2d3d] text-textMuted">
                                    {sesiones.length} registros
                                </span>
                            </div>

                            {sesiones.length === 0 ? (
                                <div className="p-12 text-center text-textMuted">
                                    <PackageOpen size={48} className="mx-auto mb-4 opacity-50" />
                                    <p>No hay turnos registrados en esta fecha.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm text-textMuted">
                                        <thead className="bg-[#151923] text-xs uppercase text-textMuted border-b border-[#2a2d3d]">
                                            <tr>
                                                <th className="px-6 py-4 font-semibold">Horario</th>
                                                <th className="px-6 py-4 font-semibold">Cliente</th>
                                                <th className="px-6 py-4 font-semibold">Cancha / Espacio</th>
                                                <th className="px-6 py-4 font-semibold">Actividad</th>
                                                <th className="px-6 py-4 font-semibold border-l border-border bg-[#0f121b]">Ítems</th>
                                                <th className="px-6 py-4 font-semibold bg-[#0f121b]">Total</th>
                                                <th className="px-6 py-4 font-semibold bg-[#0f121b] text-center">Estado de Pago</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#2a2d3d]">
                                            {sesiones.map((s) => {
                                                const startText = new Date(s.inicio).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
                                                const itemsCount = s.items?.length || 0

                                                return (
                                                    <tr key={s.id} className="hover:bg-[#151923] transition-colors border-b border-[#2a2d3d]/50 group">
                                                        <td className="px-6 py-4 font-medium text-white">{startText}</td>
                                                        <td className="px-6 py-4">
                                                            {s.cliente ? (
                                                                <span className="text-primary font-medium">{s.cliente.nombre} {s.cliente.apellido}</span>
                                                            ) : (
                                                                <span className="text-textMuted italic">Sin Asignar</span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 text-white">{s.espacio?.nombre}</td>
                                                        <td className="px-6 py-4">{s.actividad?.nombre}</td>

                                                        {/* Items Section highlighted */}
                                                        <td className="px-6 py-4 border-l border-border bg-[#0f121b] group-hover:bg-[#151923]/50 transition-colors">
                                                            <div className="flex flex-col gap-1 text-xs">
                                                                {itemsCount > 0 ? (
                                                                    s.items?.map((it, idx) => (
                                                                        <div key={idx} className="flex justify-between items-center gap-3">
                                                                            <span className="truncate max-w-[150px]" title={it.nombre}>
                                                                                {it.cantidad > 1 && <span className="text-textMuted mr-1">{it.cantidad}x</span>}
                                                                                <span className={it.es_alquiler ? 'text-[#818cf8] font-medium' : 'text-textMain'}>{it.nombre}</span>
                                                                            </span>
                                                                            <span className="font-medium text-textMain">{formatMoney(it.precio * it.cantidad)}</span>
                                                                        </div>
                                                                    ))
                                                                ) : (
                                                                    <span className="text-textMuted italic">Reservado (Sin ítem de alquiler)</span>
                                                                )}
                                                            </div>
                                                        </td>

                                                        <td className="px-6 py-4 bg-[#0f121b] group-hover:bg-[#151923]/50 transition-colors text-white font-bold text-[15px]">
                                                            {s.precio !== null ? formatMoney(s.precio) : '-'}
                                                        </td>
                                                        <td className="px-6 py-4 bg-[#0f121b] group-hover:bg-[#151923]/50 transition-colors text-center">
                                                            {s.estado_pago === 'pagado' && <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-medium text-xs">PAGADO</span>}
                                                            {s.estado_pago === 'seña' && <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded font-medium text-xs">SEÑA</span>}
                                                            {(s.estado_pago === 'pendiente' || !s.estado_pago) && <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded font-medium text-xs">PENDIENTE</span>}
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
