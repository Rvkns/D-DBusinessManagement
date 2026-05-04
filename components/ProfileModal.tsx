import React, { useState } from 'react';
import { User, UserCircle, Save, X } from 'lucide-react';
import { DbUserProfile } from '../services/supabaseClient';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    profile: DbUserProfile;
    onUpdate: (updates: Partial<DbUserProfile>) => Promise<void>;
}

export default function ProfileModal({ isOpen, onClose, profile, onUpdate }: ProfileModalProps) {
    const [displayName, setDisplayName] = useState(profile.display_name || '');
    const [characterName, setCharacterName] = useState(profile.character_name || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!displayName.trim()) {
            setError('Il nome in codice non può essere vuoto.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await onUpdate({
                display_name: displayName.trim(),
                character_name: characterName.trim()
            });
            onClose();
        } catch (err: any) {
            setError(err.message || 'Errore durante l\'aggiornamento del profilo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-drow-900 border border-drow-600 rounded-xl shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-drow-700 flex justify-between items-center bg-black/20">
                    <h3 className="text-lg font-serif text-white flex items-center gap-2">
                        <UserCircle className="text-drow-400" size={20} />
                        Gestione Profilo
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-drow-300 mb-2 uppercase tracking-wide">
                            Nome in Codice (Nickname)
                        </label>
                        <div className="relative">
                            <input 
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="w-full bg-black/40 border border-drow-700 rounded-lg p-3 text-white focus:border-drow-400 focus:outline-none focus:ring-1 focus:ring-drow-400 transition-all"
                                placeholder="Come vuoi apparire agli altri?"
                            />
                            <User className="absolute right-3 top-1/2 -translate-y-1/2 text-drow-800" size={18} />
                        </div>
                        <div className="flex justify-between mt-1.5 px-1">
                            <p className="text-[10px] text-drow-500 italic">
                                Visibile a tutto il party.
                            </p>
                            {profile.email && (
                                <p className="text-[10px] text-drow-600 font-mono">
                                    Account: {profile.email}
                                </p>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-drow-300 mb-2 uppercase tracking-wide">
                            Nome Personaggio (Opzionale)
                        </label>
                        <input 
                            type="text"
                            value={characterName}
                            onChange={(e) => setCharacterName(e.target.value)}
                            className="w-full bg-black/40 border border-drow-700 rounded-lg p-3 text-white focus:border-drow-400 focus:outline-none focus:ring-1 focus:ring-drow-400 transition-all"
                            placeholder="Es: Drizzt Do'Urden"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-900/20 border border-red-900/50 text-red-400 text-xs p-3 rounded-lg text-center">
                            {error}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-drow-700 bg-black/10 flex justify-end gap-3">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                    >
                        Annulla
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={loading}
                        className="flex items-center gap-2 bg-drow-600 hover:bg-drow-500 disabled:opacity-50 text-white font-bold py-2 px-6 rounded-lg transition-all shadow-lg"
                    >
                        {loading ? 'Salvataggio...' : (
                            <>
                                <Save size={18} />
                                Salva Profilo
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
