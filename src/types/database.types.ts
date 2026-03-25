export interface Deporte {
    id: string;
    club_id: string;
    nombre: string;
    niveles_posibles: string[];
    activo: boolean;
}

export interface Espacio {
    id: string;
    club_id: string;
    nombre: string;
    capacidad: number;
    deporte_id: string | null;
    club_deportes?: { nombre: string }; // For joined queries
    estado: string;
    caracteristicas: Record<string, any>;
    es_multideporte: boolean;
}

export interface Sesion {
    id: string;
    club_id: string;
    espacio_id: string;
    actividad_id: string;
    deporte_id?: string | null;
    cliente_id?: string | null;
    inicio: string;
    fin: string;
    capacidad_total: number;
    plazas_disponibles: number;
    precio: number | null;
    estado_pago?: string;
    clientes_globales?: { nombre: string, apellido: string, telefono: string | null } | null;
    created_by?: string | null;
    anotaciones?: string | null;
}

export interface SesionItem {
    id?: string;
    sesion_id?: string;
    club_id?: string;
    articulo_id?: string | null;
    nombre: string;
    precio: number;
    cantidad: number;
    es_alquiler: boolean;
}

export interface Actividad {
    id: string;
    club_id: string;
    nombre: string;
    modalidad_cobro: string | null;
    activo: boolean;
}

export interface ClienteGlobal {
    id: string;
    club_id: string;
    nombre: string;
    apellido: string;
    email: string | null;
    telefono: string | null;
    dni: string | null;
    tipo: 'jugador' | 'profesor';
    niveles_por_deporte: Record<string, string>; // { deporte_id: "nivel" }
    activo: boolean;
    created_at?: string;
}
