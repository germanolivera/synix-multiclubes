import { useState } from 'react';
import { Trash2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';

export default function EliminarCuenta() {
    const [confirmacionText, setConfirmacionText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const navigate = useNavigate();

    const elTextoRequerido = 'ELIMINAR MI CUENTA';
    const isButtonEnabled = confirmacionText === elTextoRequerido && !isDeleting;

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        setErrorMsg(null);
        try {
            const { data: session } = await supabase.auth.getSession();
            if (!session.session) {
                throw new Error("No hay sesión activa.");
            }

            // Llamar a la Edge Function
            const { error } = await supabase.functions.invoke('delete-user-account', {
                method: 'POST',
            });

            if (error) {
                throw error;
            }

            // Si es exitoso, desloguear y redirigir
            await supabase.auth.signOut();
            navigate('/auth');

        } catch (error: any) {
            console.error('Error al eliminar la cuenta:', error);
            setErrorMsg(error.message || 'Ocurrió un error inesperado al eliminar la cuenta.');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="h-full flex flex-col max-w-2xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-6">
            <Link to="/configuracion" className="inline-flex items-center text-sm text-textMuted hover:text-textMain transition-colors w-fit">
                <ArrowLeft size={16} className="mr-2" />
                Volver a Configuración
            </Link>

            <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20">
                    <AlertTriangle size={32} />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-textMain tracking-tight">Zona de Peligro: Eliminar Cuenta</h1>
                <p className="text-textMuted max-w-md">
                    Estás a punto de eliminar tu cuenta permanentemente.
                    <strong className="text-red-400 block mt-2">
                        Esta acción NO se puede deshacer. Todos tus datos, sedes, reservas y configuraciones serán eliminados inmediatamente.
                    </strong>
                </p>
            </div>

            <div className="bg-surface border border-red-500/30 rounded-xl p-6 md:p-8 mt-8 shadow-sm">
                <div className="space-y-4">
                    <label className="block text-sm font-medium text-textMain">
                        Para confirmar, escribe: <span className="font-mono bg-background px-2 py-0.5 rounded text-red-400 border border-border inline-block select-all">{elTextoRequerido}</span>
                    </label>
                    <input
                        type="text"
                        value={confirmacionText}
                        onChange={(e) => setConfirmacionText(e.target.value)}
                        placeholder={elTextoRequerido}
                        className="w-full px-4 py-3 bg-background border border-border rounded-lg text-textMain placeholder-textMuted/50 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all font-mono"
                        disabled={isDeleting}
                    />

                    {errorMsg && (
                        <div className="p-3 mt-4 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                            {errorMsg}
                        </div>
                    )}

                    <button
                        onClick={handleDeleteAccount}
                        disabled={!isButtonEnabled}
                        className={`w-full flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-all ${isButtonEnabled
                            ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20'
                            : 'bg-background border border-border text-textMuted cursor-not-allowed opacity-50'
                            }`}
                    >
                        {isDeleting ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <Trash2 size={18} className="mr-2" />
                                Sí, eliminar mi cuenta e historial
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
