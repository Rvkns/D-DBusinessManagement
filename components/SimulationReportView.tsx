import React from 'react';
import { CycleReport } from '../types';
import { ScrollText, TrendingUp, TrendingDown, Eye, AlertTriangle, Dice6 } from 'lucide-react';

const CATEGORY_STYLES: Record<string, string> = {
  CRITICAL:  'bg-red-900/60 text-red-300 border-red-700',
  NEGATIVE:  'bg-orange-900/60 text-orange-300 border-orange-700',
  NEUTRAL:   'bg-gray-800/60 text-gray-400 border-gray-600',
  POSITIVE:  'bg-green-900/60 text-green-300 border-green-700',
};

interface SimulationReportViewProps {
  report: CycleReport;
}

const SimulationReportView: React.FC<SimulationReportViewProps> = ({ report }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between border-b border-drow-600 pb-4">
        <div>
            <h2 className="text-2xl font-serif text-drow-100 flex items-center">
                <ScrollText className="mr-3 text-drow-400" />
                Report Ciclo {report.cycleNumber}
            </h2>
            <p className="text-gray-400 text-sm">{report.date}</p>
        </div>
        <div className={`text-2xl font-bold ${report.totalGoldChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {report.totalGoldChange > 0 ? '+' : ''}{report.totalGoldChange} mo
        </div>
      </div>

      {/* Venture Breakdown */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-drow-300 uppercase tracking-widest text-xs border-l-2 border-drow-500 pl-2">Stato delle Attività</h3>
        <div className="grid gap-4">
            {report.ventureReports.map((v) => (
                <div key={v.ventureId} className="bg-drow-900/50 p-4 rounded border-l-4 border-drow-600 hover:border-drow-400 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="font-bold text-drow-100">{v.ventureName}</h4>
                        <span className={`text-sm font-mono ${v.netGold >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {v.netGold > 0 ? '+' : ''}{v.netGold} mo
                        </span>
                    </div>
                    {(v.eventName || report.diceRolls?.[v.ventureId] !== undefined) && (
                        <div className="flex items-center gap-2 mb-3">
                            {v.eventName && v.eventCategory && (
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${CATEGORY_STYLES[v.eventCategory] ?? CATEGORY_STYLES.NEUTRAL}`}>
                                    {v.eventName}
                                </span>
                            )}
                            {report.diceRolls?.[v.ventureId] !== undefined && (
                                <span className="flex items-center gap-1 text-xs text-gray-500 font-mono">
                                    <Dice6 size={12} /> {report.diceRolls[v.ventureId]}
                                </span>
                            )}
                        </div>
                    )}
                    <ul className="text-sm space-y-1 text-gray-300">
                        <li className="flex items-start"><TrendingUp size={14} className="mr-2 mt-1 shrink-0 text-blue-400" /> {v.economicResult}</li>
                        <li className="flex items-start"><TrendingDown size={14} className="mr-2 mt-1 shrink-0 text-yellow-400" /> {v.logisticsStatus}</li>
                        <li className="flex items-start"><AlertTriangle size={14} className="mr-2 mt-1 shrink-0 text-purple-400" /> {v.politicalImpact}</li>
                    </ul>
                </div>
            ))}
        </div>
      </div>

      {/* Shadow Report */}
      <div className="bg-black/30 p-5 rounded-lg border border-drow-800">
        <h3 className="text-lg font-bold text-purple-300 flex items-center mb-3">
            <Eye className="mr-2" /> Rapporto dalle Ombre
        </h3>
        <p className="text-gray-300 italic leading-relaxed text-sm whitespace-pre-wrap">
            {report.shadowReport}
        </p>
      </div>

      {/* Narrative Dilemma */}
      <div className="bg-red-900/10 p-5 rounded-lg border border-red-900/30">
        <h3 className="text-lg font-bold text-red-300 flex items-center mb-3">
            <AlertTriangle className="mr-2" /> Sviluppo Narrativo (Il Dilemma)
        </h3>
        <p className="text-red-100/80 leading-relaxed whitespace-pre-wrap">
            {report.narrativeDilemma}
        </p>
      </div>
    </div>
  );
};

export default SimulationReportView;