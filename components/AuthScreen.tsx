import React, { useState } from 'react';
import { signIn, signUp } from '../services/authService';
import { Gem, Skull } from 'lucide-react';

interface AuthScreenProps {
    onLoginSuccess: () => void;
}

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [role, setRole] = useState<'dm' | 'player'>('player');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                await signIn(email, password);
            } else {
                await signUp(email, password, displayName, role);
            }
            onLoginSuccess();
        } catch (err: any) {
            setError(err.message || 'Errore durante l\'autenticazione');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 selection:bg-drow-500 selection:text-white relative overflow-hidden">
            
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-drow-600/20 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-900/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="glass-panel p-8 rounded-2xl shadow-[0_0_50px_rgba(107,59,173,0.15)] max-w-md w-full relative z-10 border border-drow-700/50">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center bg-drow-600 p-3 rounded-xl shadow-[0_0_20px_rgba(107,59,173,0.5)] mb-4">
                        <Gem className="text-white w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-bold font-serif tracking-wider text-white uppercase" style={{ textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}>
                        Underdark <span className="text-drow-400">Business</span>
                    </h1>
                    <p className="text-drow-300 mt-2 text-sm uppercase tracking-widest">
                        {isLogin ? 'Accesso al Sottosuolo' : 'Nuovo Patto di Sangue'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {!isLogin && (
                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Nome in Codice</label>
                            <input
                                type="text"
                                required
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="w-full bg-black/40 border border-drow-700 rounded-lg p-3 text-white focus:border-drow-400 focus:outline-none focus:ring-1 focus:ring-drow-400 transition-all placeholder-gray-600"
                                placeholder="Come ti chiamano nelle ombre?"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Email (Pergamena Magica)</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-black/40 border border-drow-700 rounded-lg p-3 text-white focus:border-drow-400 focus:outline-none focus:ring-1 focus:ring-drow-400 transition-all placeholder-gray-600"
                            placeholder="tua@email.com"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Parola d'Ordine</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-black/40 border border-drow-700 rounded-lg p-3 text-white focus:border-drow-400 focus:outline-none focus:ring-1 focus:ring-drow-400 transition-all placeholder-gray-600"
                            placeholder="••••••••"
                        />
                    </div>

                    {!isLogin && (
                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Ruolo</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setRole('player')}
                                    className={`py-3 px-4 rounded-lg border flex flex-col items-center justify-center transition-all ${role === 'player' ? 'bg-drow-800/50 border-drow-400 text-white shadow-[0_0_15px_rgba(107,59,173,0.3)]' : 'bg-black/40 border-drow-800 text-gray-500 hover:border-drow-600'}`}
                                >
                                    <span className="font-bold mb-1">Giocatore</span>
                                    <span className="text-[10px] uppercase">Gestisce attività</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRole('dm')}
                                    className={`py-3 px-4 rounded-lg border flex flex-col items-center justify-center transition-all ${role === 'dm' ? 'bg-red-900/30 border-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-black/40 border-drow-800 text-gray-500 hover:border-drow-600'}`}
                                >
                                    <Skull size={18} className={`mb-1 ${role === 'dm' ? 'text-red-400' : 'text-gray-500'}`} />
                                    <span className="font-bold mb-1">Dungeon Master</span>
                                    <span className="text-[10px] uppercase">Tesse le trame</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-950/50 border border-red-900/50 text-red-400 text-xs p-3 rounded-lg text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3.5 rounded-lg font-bold tracking-widest uppercase transition-all shadow-lg flex justify-center items-center ${loading ? 'bg-drow-800 text-drow-400 cursor-not-allowed' : 'bg-gradient-to-r from-drow-600 to-drow-500 hover:from-drow-500 hover:to-drow-400 text-white hover:shadow-[0_0_20px_rgba(107,59,173,0.5)]'}`}
                    >
                        {loading ? 'Consultazione in corso...' : (isLogin ? 'Entra' : 'Giura Fedeltà')}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => { setIsLogin(!isLogin); setError(''); }}
                        className="text-sm text-drow-400 hover:text-white transition-colors uppercase tracking-wider"
                    >
                        {isLogin ? 'Non hai un patto? Registrati' : 'Hai già un patto? Accedi'}
                    </button>
                </div>
            </div>
        </div>
    );
}
