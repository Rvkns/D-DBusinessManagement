import React from 'react';
import { Book, Target, TrendingUp, ShieldAlert, Users, Coins, HelpCircle } from 'lucide-react';

interface WikiViewProps {
  onClose: () => void;
}

const WikiView: React.FC<WikiViewProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm">
      <div className="bg-drow-900 border border-drow-600 rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col shadow-[0_0_50px_rgba(107,59,173,0.3)]">
        
        {/* Header */}
        <div className="p-6 border-b border-drow-700 flex justify-between items-center bg-gradient-to-r from-drow-950 to-drow-900">
          <div className="flex items-center space-x-3">
            <div className="bg-drow-700 p-2 rounded-lg">
              <Book className="text-white w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-serif font-bold text-white tracking-tight">Grimorio di Gestione: Ched Nasad</h2>
              <p className="text-xs text-drow-400 uppercase tracking-widest">Manuale Operativo per Business nell'Underdark</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white text-3xl font-light transition-colors"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-8 space-y-12">
          
          {/* Sezione 1: Il Ciclo di Gioco */}
          <section>
            <div className="flex items-center space-x-3 mb-4 border-b border-drow-800 pb-2">
              <Target className="text-drow-400" size={24} />
              <h3 className="text-xl font-bold text-white uppercase tracking-wider">1. Il Ciclo di Gioco</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-300 leading-relaxed">
              <div className="bg-black/20 p-4 rounded-lg border border-white/5">
                <p className="font-bold text-drow-200 mb-2">Fase 1: Gli Ordini (Player)</p>
                <p>I giocatori decidono una <strong>Direttiva</strong> per le loro attività. Questa scelta determina il bonus (o malus) per il prossimo ciclo. Il DM può "bloccare" le direttive una volta confermate.</p>
              </div>
              <div className="bg-black/20 p-4 rounded-lg border border-white/5">
                <p className="font-bold text-drow-200 mb-2">Fase 2: La Simulazione (DM)</p>
                <p>Il DM clicca su "Avanza Ciclo". Il motore matematico lancia un <strong>d100</strong> per ogni attività, applica i modificatori e genera un evento narrativo tramite l'IA.</p>
              </div>
            </div>
          </section>

          {/* Sezione 2: Le Statistiche Chiave */}
          <section>
            <div className="flex items-center space-x-3 mb-4 border-b border-drow-800 pb-2">
              <TrendingUp className="text-green-400" size={24} />
              <h3 className="text-xl font-bold text-white uppercase tracking-wider">2. Le Statistiche</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <div className="bg-green-950/30 p-2 rounded border border-green-900/50 text-green-400 font-bold text-xs min-w-[100px] text-center">EFFICIENZA</div>
                <p className="text-sm text-gray-300">Determina quanto l'attività produce rispetto al suo potenziale massimo. 
                  <br /><span className="text-red-400 text-xs">⚠️ Sotto il 10%: L'attività è SOSPESA (perde solo soldi).</span>
                  <br /><span className="text-blue-400 text-xs">📈 Sopra l'80%: Fornisce +10 ai lanci di dado.</span>
                </p>
              </div>
              <div className="flex items-start space-x-4">
                <div className="bg-purple-950/30 p-2 rounded border border-purple-900/50 text-purple-400 font-bold text-xs min-w-[100px] text-center">LEALTÀ</div>
                <p className="text-sm text-gray-300">Rappresenta la fedeltà dello staff e del manager. 
                  <br /><span className="text-red-400 text-xs">⚠️ Sotto il 40%: Applica -12 ai lanci (rischio sabotaggio/furto).</span>
                  <br /><span className="text-blue-400 text-xs">📈 Sopra l'80%: Fornisce +8 ai lanci.</span>
                </p>
              </div>
              <div className="flex items-start space-x-4">
                <div className="bg-red-950/30 p-2 rounded border border-red-900/50 text-red-400 font-bold text-xs min-w-[100px] text-center">NOTORIETÀ</div>
                <p className="text-sm text-gray-300">Quanto sei visibile alle Casate Drow. 
                  <br /><span className="text-red-400 text-xs">⚠️ Sopra il 50%: Inizia ad applicare malus ai dadi (più sei noto, più ti colpiscono).</span>
                </p>
              </div>
            </div>
          </section>

          {/* Sezione 3: Direttive Principali */}
          <section>
            <div className="flex items-center space-x-3 mb-4 border-b border-drow-800 pb-2">
              <ShieldAlert className="text-amber-400" size={24} />
              <h3 className="text-xl font-bold text-white uppercase tracking-wider">3. Direttive e Strategia</h3>
            </div>
            <div className="grid md:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-black/40 rounded border border-drow-700">
                <p className="font-bold text-white mb-1">💰 Massimizza Profitti</p>
                <p className="text-gray-400">Guadagno +30%, ma perdi lealtà e aumenti drasticamente la notorietà.</p>
              </div>
              <div className="p-3 bg-black/40 rounded border border-drow-700">
                <p className="font-bold text-white mb-1">📈 Espandi</p>
                <p className="text-gray-400">Investi oro per aumentare drasticamente l'Efficienza nel prossimo ciclo.</p>
              </div>
              <div className="p-3 bg-black/40 rounded border border-drow-700">
                <p className="font-bold text-white mb-1">🐍 Stai Basso</p>
                <p className="text-gray-400">Riduci guadagni per abbassare la Notorietà e il rischio di eventi negativi.</p>
              </div>
              <div className="p-3 bg-black/40 rounded border border-drow-700">
                <p className="font-bold text-white mb-1">👥 Recluta Staff</p>
                <p className="text-gray-400">Paga per aumentare la Lealtà dello staff e stabilizzare l'operatività.</p>
              </div>
              <div className="p-3 bg-black/40 rounded border border-drow-700">
                <p className="font-bold text-white mb-1">⚙️ Ordinaria Amministrazione</p>
                <p className="text-gray-400">Nessun costo o bonus extra. Ideale quando tutto va bene.</p>
              </div>
              <div className="p-3 bg-black/40 rounded border border-drow-700">
                <p className="font-bold text-white mb-1">🕸️ Corrompi Fazione</p>
                <p className="text-gray-400">Paga tangenti per ridurre la Notorietà accumulata.</p>
              </div>
            </div>
          </section>

          {/* Sezione 4: Eventi e Narrazione */}
          <section>
            <div className="flex items-center space-x-3 mb-4 border-b border-drow-800 pb-2">
              <Users className="text-blue-400" size={24} />
              <h3 className="text-xl font-bold text-white uppercase tracking-wider">4. Narrazione e Report</h3>
            </div>
            <div className="space-y-4 text-sm text-gray-300">
              <p>Il report generato dall'IA non è solo estetica: fornisce <strong>indizi</strong> su cosa sta per succedere.</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><span className="text-drow-300 font-bold">Rapporto dalle Ombre:</span> Rumors su fazioni e Casate. Se senti di movimenti di truppe, forse è il caso di usare "Investi in Sicurezza".</li>
                <li><span className="text-red-400 font-bold">Il Dilemma:</span> È un gancio per la sessione D&D. Richiede una scelta morale o tattica che il DM può risolvere "a mano" modificando le statistiche.</li>
              </ul>
            </div>
          </section>

          {/* Sezione 5: FAQ */}
          <section className="bg-drow-950/50 p-6 rounded-xl border border-drow-700">
            <div className="flex items-center space-x-3 mb-4">
              <HelpCircle className="text-white" size={20} />
              <h3 className="text-lg font-bold text-white uppercase">FAQ Veloci</h3>
            </div>
            <div className="space-y-4 text-sm">
              <div className="border-l-2 border-drow-500 pl-4">
                <p className="font-bold text-white">"Perché perdo sempre soldi?"</p>
                <p className="text-gray-400 italic">Controlla l'Efficienza. Se è bassa, le entrate non coprono i costi fissi. Usa 'Espandi'.</p>
              </div>
              <div className="border-l-2 border-drow-500 pl-4">
                <p className="font-bold text-white">"I dadi sono truccati?"</p>
                <p className="text-gray-400 italic">No, ma se hai Notorietà alta e Lealtà bassa, il tuo malus (es: -32) rende quasi impossibile fare più di 60.</p>
              </div>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-drow-800 text-center bg-black/20">
          <p className="text-[10px] text-drow-500 uppercase tracking-[0.3em]">Proprietà della Casata Nasadra · Vietata la riproduzione</p>
        </div>

      </div>
    </div>
  );
};

export default WikiView;
