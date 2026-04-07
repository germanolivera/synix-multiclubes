import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
    session: Session | null
    user: User | null
    isLoading: boolean
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    isLoading: true,
    signOut: async () => { },
})

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null)
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)


    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            setUser(session?.user ?? null)
            setIsLoading(false)
        })

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
            setUser(session?.user ?? null)
            setIsLoading(false)
        })

        return () => subscription.unsubscribe()
    }, [])

    const signOut = useCallback(async () => {
        if (user) {
            await supabase.from('user_sessions').delete().eq('user_id', user.id)
        }
        localStorage.removeItem('synix_session_token')
        await supabase.auth.signOut()
    }, [user])

    useEffect(() => {
        if (!user) return

        let isMounted = true

        const checkSession = async () => {
            // Always read from localStorage to avoid stale React state from before login
            const currentToken = localStorage.getItem('synix_session_token')
            if (!currentToken) return

            const { data, error } = await supabase
                .from('user_sessions')
                .select('session_token')
                .eq('user_id', user.id)
                .single()
            
            // If no record exists, upsert to start tracking
            if (error && error.code === 'PGRST116') {
                await supabase.from('user_sessions').upsert({
                    user_id: user.id,
                    session_token: currentToken
                })
                return
            }

            // If a different token exists in DB, it means someone logged in elsewhere
            if (data && data.session_token !== currentToken) {
                if (isMounted) {
                    await signOut()
                    alert("Tu sesión ha sido cerrada automáticamente porque se inició sesión desde otro dispositivo.")
                }
            }
        }

        const onFocus = () => checkSession()
        window.addEventListener('focus', onFocus)
        const interval = setInterval(checkSession, 30000)
        
        checkSession()

        return () => {
            isMounted = false
            window.removeEventListener('focus', onFocus)
            clearInterval(interval)
        }
    }, [user, signOut])

    const value = {
        session,
        user,
        isLoading,
        signOut
    }

    return (
        <AuthContext.Provider value={value}>
            {!isLoading && children}
        </AuthContext.Provider>
    )
}
