import React from 'react';
import { Venture } from '../types';
import { Coins, Trash2, Crown, UserCog, Pencil, AlertCircle, Eye } from 'lucide-react';

interface VentureCardProps {
  venture: Venture;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  showControls?: boolean;
}

const VentureCard: React.FC<VentureCardProps> = ({ venture, onDelete, onEdit, showControls = true }) => {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-drow-700 bg-gradient-to-br from-drow-800 to-drow-900 p-5 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-drow-500/20 hover:border-drow-500">
      
      {/* Background Decorative Element */}
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-drow-500/10 blur-xl transition-all group-hover:bg-drow-500/20"></div>

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-xl font-serif text-white font-bold tracking-wide drop-shadow-sm group-hover:text-drow-100 transition-colors">
                {venture.name}
            </h3>
            <div className="flex gap-2 mt-1">
                <span className="inline-block text-[10px] uppercase tracking-widest text-drow-300 font-bold bg-drow-950/50 px-2 py-0.5 rounded border border-drow-700/50">
                    {venture.type}
                </span>
                <span className={`inline-block text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded border ${venture.notoriety > 70 ? 'bg-red-950/50 border-red-900 text-red-400' : 'bg-blue-950/50 border-blue-900 text-blue-400'}`}>
                   Notorietà: {venture.notoriety}%
                </span>
            </div>
          </div>
          
          <div className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase border ${venture.factionAlignment === 'Independent' 
            ? 'bg-gray-800/80 border-gray-600 text-gray-300' 
            : 'bg-drow-700/80 border-drow-500 text-drow-100 shadow-[0_0_10px_rgba(107,59,173,0.3)]'}`}>
            {venture.factionAlignment}
          </div>
        </div>
        
        <p className="text-sm text-gray-400 mb-5 line-clamp-2 italic font-serif leading-relaxed">
            "{venture.description}"
        </p>
        
        {/* Personnel Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5 bg-black/20 p-3 rounded-lg border border-white/5">
            <div className="flex flex-col">
                <span className="text-[10px] text-gray-500 uppercase font-bold mb-1 flex items-center">
                    <Crown size={12} className="mr-1 text-yellow-500" /> Proprietario (PG)
                </span>
                <span className="text-sm font-medium text-drow-100 truncate">
                    {venture.partyMember || <span className="text-gray-600 italic">Vacante</span>}
                </span>
            </div>
            <div className="flex flex-col border-l border-white/10 pl-3">
                <span className="text-[10px] text-gray-500 uppercase font-bold mb-1 flex items-center">
                    <UserCog size={12} className="mr-1 text-blue-400" /> Gestore (PNG)
                </span>
                <span className="text-sm font-medium text-gray-300 truncate">
                    {venture.manager}
                </span>
            </div>
        </div>

        {/* Stats */}
        <div className="space-y-3">
          
          {/* Income Bar */}
          <div className="flex items-center justify-between text-xs mb-2 bg-drow-950/40 p-1.5 rounded border border-white/5">
              <span className="text-gray-400 font-mono flex items-center">
                  <Coins size={12} className="mr-1.5 text-yellow-500" /> 
                  <span className="text-green-400">+{venture.baseIncome}</span> 
                  <span className="mx-1 text-gray-600">/</span> 
                  <span className="text-red-400">-{venture.baseCost}</span>
              </span>
              <span className={`font-bold ${venture.baseIncome - venture.baseCost > 0 ? 'text-green-500' : 'text-red-500'}`}>
                 Netto: {venture.baseIncome - venture.baseCost > 0 ? '+' : ''}{venture.baseIncome - venture.baseCost}
              </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                    <span>Efficienza</span>
                    <span className="text-drow-300">{venture.efficiency}%</span>
                </div>
                <div className="w-full bg-drow-950 rounded-full h-1.5 border border-drow-800 overflow-hidden">
                    <div 
                        className="bg-gradient-to-r from-green-800 to-green-500 h-1.5 rounded-full shadow-[0_0_5px_rgba(34,197,94,0.4)]" 
                        style={{ width: `${venture.efficiency}%` }}
                    ></div>
                </div>
            </div>

            <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                    <span>Lealtà</span>
                    <span className="text-drow-300">{venture.loyalty}%</span>
                </div>
                <div className="w-full bg-drow-950 rounded-full h-1.5 border border-drow-800 overflow-hidden">
                    <div 
                        className="bg-gradient-to-r from-purple-900 to-drow-500 h-1.5 rounded-full shadow-[0_0_5px_rgba(107,59,173,0.4)]" 
                        style={{ width: `${venture.loyalty}%` }}
                    ></div>
                </div>
            </div>
          </div>
        </div>

        {/* Pending Effects */}
        {venture.pendingEffects && venture.pendingEffects.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
                {venture.pendingEffects.map(effect => (
                    <div key={effect.id} className="flex items-center bg-red-900/30 border border-red-800/50 rounded-md px-2 py-1 text-[10px] text-red-300 animate-pulse" title={effect.description}>
                        <AlertCircle size={10} className="mr-1 shrink-0" />
                        <span className="font-bold truncate max-w-[120px]">{effect.description}</span>
                        {effect.sourceEventName && (
                            <span className="ml-1 opacity-50 shrink-0">· {effect.sourceEventName}</span>
                        )}
                        <span className="ml-1 opacity-60 shrink-0">({effect.remainingCycles})</span>
                    </div>
                ))}
            </div>
        )}

        {showControls && (
            <div className="absolute top-3 right-3 flex items-center space-x-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                    onClick={() => onEdit(venture.id)}
                    className="p-1.5 text-blue-400 hover:text-white hover:bg-blue-900/50 rounded transition-all"
                    title="Modifica Attività"
                >
                    <Pencil size={16} />
                </button>
                <button 
                    onClick={() => onDelete(venture.id)}
                    className="p-1.5 text-red-500/70 hover:text-red-400 hover:bg-red-950/50 rounded transition-all"
                    title="Smantella Attività"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default VentureCard;