import React from 'react';
import { Venture, CycleReport, DirectiveId } from '../types';
import VentureCard from './VentureCard';
import DirectivePanel from './DirectivePanel';
import SimulationReportView from './SimulationReportView';
import { Gem, LogOut, ShieldCheck, AlertCircle } from 'lucide-react';
import { signOut } from '../services/authService';

interface PlayerViewProps {
    ventures: Venture[];
    history: CycleReport[];
    onSelectDirective: (ventureId: string, directiveId: DirectiveId) => void;
    onLockDirective: (ventureId: string) => void;
}

export default function PlayerView({ ventures, history, onSelectDirective, onLockDirective }: PlayerViewProps) {
    const handleLogout = async () => {
        try {
            await signOut();
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const latestReport = history.length > 0 ? history[0] : null;

    return (
        <div className="min-h-screen font-sans selection:bg-drow-500 selection:text-white pb-10">
            {/* Header */}
            <header className="sticky top-0 z-50 glass-panel border-b border-drow-700/50 shadow-lg shadow-black/50">
                <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <div className="bg-drow-600 p-2 rounded-lg shadow-[0_0_15px_rgba(107,59,173,0.5)]">
                            <Gem className="text-white w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold font-serif tracking-wider text-white uppercase" style={{ textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}>
                                Underdark <span className="text-drow-400">Business</span>
                            </h1>
                            <p className="text-xs text-drow-400 uppercase tracking-widest hidden md:block">Pannello Giocatore</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors p-2 rounded hover:bg-white/5"
                    >
                        <span className="text-sm font-bold uppercase hidden md:inline">Esci</span>
                        <LogOut size={18} />
                    </button>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
                
                {ventures.length === 0 ? (
                    <div className="text-center py-20 border-2 border-dashed border-drow-800 rounded-xl bg-drow-900/20 text-gray-500">
                        <AlertCircle className="mx-auto mb-3 text-drow-500" size={28} />
                        <p className="text-lg">Non hai ancora attività assegnate.</p>
                        <p className="text-sm opacity-70 mt-2">Attendi che il Dungeon Master ti affidi una venture.</p>
                    </div>
                ) : (
                    <>
                        <section>
                            <div className="mb-4 p-3 rounded-lg border border-drow-700 bg-black/30 text-sm text-drow-200 flex items-start gap-2">
                                <ShieldCheck size={16} className="mt-0.5 text-drow-400" />
                                <p><strong>Prossima azione consigliata:</strong> scegli una direttiva per ogni attività e blocca le scelte prima del prossimo ciclo.</p>
                            </div>
                            <h2 className="text-2xl font-serif font-bold text-white mb-6 tracking-wide border-b border-drow-800 pb-2">
                                I Tuoi Ordini
                            </h2>
                            <DirectivePanel 
                                ventures={ventures} 
                                onSelectDirective={onSelectDirective} 
                                onLockDirective={onLockDirective} 
                            />
                        </section>

                        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h2 className="text-xl font-serif font-bold text-white mb-4 tracking-wide border-b border-drow-800 pb-2">
                                    Le Tue Attività
                                </h2>
                                <div className="space-y-4">
                                    {ventures.map(v => (
                                        <VentureCard 
                                            key={v.id} 
                                            venture={v} 
                                            // No edit/delete permissions for players currently
                                            onDelete={() => {}} 
                                            onEdit={() => {}} 
                                        />
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h2 className="text-xl font-serif font-bold text-white mb-4 tracking-wide border-b border-drow-800 pb-2">
                                    Ultimo Rapporto
                                </h2>
                                <div className="glass-panel border border-drow-700/50 rounded-xl shadow-2xl p-6 min-h-[400px]">
                                    {latestReport ? (
                                        <SimulationReportView report={latestReport} />
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-60 py-20">
                                            <p className="text-lg font-serif">Nessun rapporto disponibile.</p>
                                            <p className="text-sm">Attendi la fine del primo ciclo.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>
                    </>
                )}
            </main>
        </div>
    );
}
