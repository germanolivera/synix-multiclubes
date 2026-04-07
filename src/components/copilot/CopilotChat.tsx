import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageSquare, X, Send, Bot, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type Message = {
    id: string;
    role: 'user' | 'assistant';
    content: string;
};

export default function CopilotChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([
                {
                    id: 'welcome',
                    role: 'assistant',
                    content: '¡Hola! Soy tu asistente inteligente. ¿En qué te puedo ayudar hoy?'
                }
            ]);
        }
    }, [isOpen, messages.length]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input.trim() };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Preparamos el historial para mandarlo a la Edge Function
            // Gemini requiere que el historial comience siempre con un mensaje del usuario (role: 'user')
            // Por lo tanto, filtramos el mensaje de bienvenida local antes de enviarlo
            const apiMessages = [...messages, userMessage]
                .filter(m => m.id !== 'welcome')
                .map(m => ({ role: m.role, content: m.content }));

            const { data, error } = await supabase.functions.invoke('copilot-agent', {
                body: { messages: apiMessages }
            });

            if (error) throw error;

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.reply?.content || 'Hubo un error al procesar tu solicitud.'
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error: any) {
            console.error('Error calling Copilot:', error);

            let errorMessage = 'Lo siento, ocurrió un error al conectarme con el servidor.';

            // Si el error viene de Supabase invoke, es un FunctionsHttpError y tiene context (el Response)
            if (error.context && typeof error.context.json === 'function') {
                try {
                    // Try to clone the response to read it safely
                    const responseClone = error.context.clone();
                    const errorBody = await responseClone.json();
                    if (errorBody.error || errorBody.details) {
                        errorMessage = `Error del Agente:\n${errorBody.error || ''}\nDetalles:\n${errorBody.details || ''}`;
                    }
                } catch (e) {
                    errorMessage = `Error de red o parseo: ${error.message}`;
                }
            } else if (error.message) {
                errorMessage = `Error: ${error.message}`;
            }

            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: errorMessage
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Floating Action Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 p-4 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-all z-50 flex items-center justify-center"
                    aria-label="Abrir asistente"
                >
                    <MessageSquare size={24} />
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 w-[380px] h-[600px] max-h-[80vh] bg-card border border-border rounded-xl shadow-2xl flex flex-col z-50 overflow-hidden text-card-foreground transform transition-all data-[state=open]:animate-in data-[state=closed]:animate-out">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
                        <div className="flex items-center space-x-2">
                            <Bot className="w-5 h-5 text-primary" />
                            <h3 className="font-semibold">Agente Inteligente</h3>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex items-start space-x-2 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
                            >
                                <div className={`p-2 rounded-full flex-shrink-0 ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                    {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                                </div>
                                <div className={`py-2 px-3 flex flex-col rounded-lg max-w-[80%] ${msg.role === 'user'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-foreground'
                                    }`}>
                                    <span className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</span>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex items-start space-x-2">
                                <div className="p-2 rounded-full flex-shrink-0 bg-muted text-muted-foreground">
                                    <Bot size={16} />
                                </div>
                                <div className="py-2 px-3 bg-muted rounded-lg flex space-x-1 items-center h-9">
                                    <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Form */}
                    <form onSubmit={handleSubmit} className="p-4 border-t border-border bg-muted/10">
                        <div className="flex items-center space-x-2 relative">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Hazme una pregunta..."
                                className="flex-1 bg-background border border-input text-foreground rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 pr-10 disabled:opacity-50"
                                disabled={isLoading}
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="absolute right-1 w-8 h-8 flex items-center justify-center text-primary disabled:opacity-50 hover:bg-muted rounded-full transition-colors"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </>
    );
}
