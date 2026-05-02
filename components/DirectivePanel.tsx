import React from 'react';
import { Venture, DirectiveId } from '../types';
import { DIRECTIVES } from '../utils/simulationEngine';
import { ChevronDown, Lock } from 'lucide-react';

interface DirectivePanelProps {
    ventures: Venture[];
    onSelectDirective: (ventureId: string, directiveId: DirectiveId) => void;
    onLockDirective: (ventureId: string) => void;
    isDMView?: boolean;
}

export default function DirectivePanel({ ventures, onSelectDirective, onLockDirective, isDMView = false }: DirectivePanelProps) {
    if (ventures.length === 0) return null;

    return (
        <div className="glass-panel rounded-xl shadow-2xl border border-drow-700/50 overflow-hidden mb-6">
            <div className="bg-black/30 border-b border-drow-800 p-4">
                <h3 className="font-serif text-lg font-bold text-white uppercase tracking-wider flex items-center">
                    📋 Ordini del Ciclo
                    {isDMView && <span className="ml-3 text-xs bg-red-900/40 text-red-400 border border-red-900/50 px-2 py-1 rounded">Vista DM</span>}
                </h3>
                <p className="text-xs text-drow-400 mt-1">
                    {isDMView 
                        ? "Attendi che i giocatori confermino gli ordini prima di simulare." 
                        : "Scegli la direttiva per le tue attività in questo ciclo."}
                </p>
            </div>

            <div className="divide-y divide-drow-800/50">
                {ventures.map(v => {
                    const currentDir = DIRECTIVES[v.currentDirective as DirectiveId] || DIRECTIVES['MAINTAIN'];
                    const isLocked = v.directiveLocked;

                    return (
                        <div key={v.id} className={`p-4 transition-colors ${isLocked ? 'bg-drow-900/10' : 'hover:bg-white/5'}`}>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-gray-200">{v.name}</h4>
                                        {isDMView && <span className="text-[10px] uppercase text-drow-500 bg-black/50 px-2 py-0.5 rounded border border-drow-800">PG: {v.partyMember}</span>}
                                    </div>
                                    
                                    {!isLocked && !isDMView && (
                                        <p className="text-xs text-drow-300 mt-1">Modificatori previsti: {
                                            [
                                                currentDir.effects.goldMultiplier && `${Math.round((currentDir.effects.goldMultiplier - 1) * 100)}% Profitto`,
                                                currentDir.effects.goldFixed && `${currentDir.effects.goldFixed > 0 ? '+' : ''}${currentDir.effects.goldFixed} MO fisse`,
                                                currentDir.effects.efficiencyDelta && `${currentDir.effects.efficiencyDelta > 0 ? '+' : ''}${currentDir.effects.efficiencyDelta} Efficienza`,
                                                currentDir.effects.loyaltyDelta && `${currentDir.effects.loyaltyDelta > 0 ? '+' : ''}${currentDir.effects.loyaltyDelta} Lealtà`,
                                                currentDir.effects.notorietyDelta && `${currentDir.effects.notorietyDelta > 0 ? '+' : ''}${currentDir.effects.notorietyDelta} Notorietà`,
                                                currentDir.effects.nextCycleEfficiencyBonus && `+${currentDir.effects.nextCycleEfficiencyBonus} Efficienza (prossimo)`,
                                            ].filter(Boolean).join(', ') || 'Nessuno'
                                        }</p>
                                    )}
                                </div>

                                <div className="flex items-center gap-3 w-full md:w-auto">
                                    {isLocked ? (
                                        <div className="flex items-center bg-black/40 border border-drow-700/50 rounded p-2.5 flex-1 md:w-64">
                                            <span className="mr-2">{currentDir.icon}</span>
                                            <span className="text-sm font-bold text-gray-300 truncate">{currentDir.label}</span>
                                            <Lock size={14} className="ml-auto text-drow-500" />
                                        </div>
                                    ) : (
                                        <div className="relative flex-1 md:w-64">
                                            <select
                                                disabled={isDMView} // DM shouldn't change player directives typically, or maybe they can? Let's disable for now
                                                value={v.currentDirective}
                                                onChange={(e) => onSelectDirective(v.id, e.target.value as DirectiveId)}
                                                className="w-full bg-black/40 border border-drow-600 rounded p-2.5 text-sm font-bold text-white focus:border-drow-400 focus:outline-none focus:ring-1 focus:ring-drow-400 transition-all appearance-none cursor-pointer"
                                            >
                                                {Object.values(DIRECTIVES).map(dir => (
                                                    <option key={dir.id} value={dir.id} className="bg-drow-900 text-gray-200">
                                                        {dir.icon} {dir.label}
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-drow-400 pointer-events-none" size={16} />
                                        </div>
                                    )}

                                    {!isDMView && !isLocked && (
                                        <button
                                            onClick={() => onLockDirective(v.id)}
                                            className="bg-drow-700 hover:bg-drow-600 text-white p-2.5 rounded border border-drow-500/50 transition-colors shadow-lg shrink-0"
                                            title="Conferma Ordini"
                                        >
                                            <Lock size={18} />
                                        </button>
                                    )}
                                    
                                    {isDMView && !isLocked && (
                                         <span className="text-xs text-yellow-500 font-bold uppercase shrink-0 whitespace-nowrap animate-pulse flex items-center bg-yellow-900/20 px-2 py-1 rounded border border-yellow-700/50">
                                            In Attesa
                                         </span>
                                    )}
                                     {isDMView && isLocked && (
                                         <span className="text-xs text-green-500 font-bold uppercase shrink-0 whitespace-nowrap flex items-center bg-green-900/20 px-2 py-1 rounded border border-green-700/50">
                                            Pronto
                                         </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
