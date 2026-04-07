import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

export interface Club {
    id: string;
    nombre: string;
    organizacion_id: string;
    domicilio?: string | null;
    localidad?: string | null;
    telefono?: string | null;
    email?: string | null;
    estado?: 'Operativa' | 'Parcialmente Operativa' | 'Suspendida' | 'Mantenimiento';
}

interface BranchContextType {
    clubs: Club[];
    activeClub: Club | null;
    setActiveClub: (club: Club) => void;
    loadingBranch: boolean;
    refreshClubs: () => Promise<void>;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined)

export function BranchProvider({ children }: { children: React.ReactNode }) {
    const { user, session } = useAuth()
    const [clubs, setClubs] = useState<Club[]>([])
    const [activeClub, setActiveClubState] = useState<Club | null>(null)
    const [loadingBranch, setLoadingBranch] = useState(true)

    const setActiveClub = useCallback((club: Club) => {
        setActiveClubState(club)
        localStorage.setItem('activeClubId', club.id)
    }, [])

    const refreshClubs = useCallback(async () => {
        if (!user || !session) {
            setClubs([])
            setActiveClubState(null)
            setLoadingBranch(false)
            return
        }

        try {
            // Get organizacion_id from JWT payload
            const orgId = session.user.app_metadata?.organizacion_id
            if (!orgId) {
                console.warn('Usuario no tiene organizacion_id en su token')
                setLoadingBranch(false)
                return
            }

            // The RLS policy already scopes this to the user's organization
            const { data, error } = await supabase
                .from('clubes')
                .select('*')
                .order('nombre')

            if (error) throw error

            setClubs(data || [])

            if (data && data.length > 0) {
                const storedId = localStorage.getItem('activeClubId')
                const storedClub = storedId ? data.find(c => c.id === storedId) : null

                if (storedClub) {
                    setActiveClub(storedClub)
                } else {
                    setActiveClub(data[0])
                }
            } else {
                setActiveClubState(null)
            }
        } catch (error) {
            console.error('Error fetching clubs:', error)
        } finally {
            setLoadingBranch(false)
        }
    }, [user, session, setActiveClub])

    useEffect(() => {
        refreshClubs()
    }, [user, session, refreshClubs])

    return (
        <BranchContext.Provider value={{ clubs, activeClub, setActiveClub, loadingBranch, refreshClubs }}>
            {children}
        </BranchContext.Provider>
    )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useBranch() {
    const context = useContext(BranchContext)
    if (context === undefined) {
        throw new Error('useBranch must be used within a BranchProvider')
    }
    return context
}
