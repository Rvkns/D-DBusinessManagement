import React, { useState, useEffect } from 'react';
import { Venture, CycleReport, SimulationState, LoreDocument } from './types';
import VentureCard from './components/VentureCard';
import SimulationReportView from './components/SimulationReportView';
import ConfirmModal from './components/ConfirmModal';
import { generateSimulationCycle } from './services/geminiService';
import { parseFile } from './services/fileParsing';
import { exportCampaign, importCampaign } from './utils/dataManager';
import { getFactions, saveFactions, type Faction } from './config/factions';
import { Plus, Play, History, Skull, Save, RotateCcw, Gem, Upload, FileText, Trash2, BookOpen, ChevronDown, Download, FolderOpen } from 'lucide-react';

const INITIAL_STATE: SimulationState = {
    cycle: 1,
    gold: 1000,
    partyLevel: 3,
    ventures: [],
    loreDocuments: [],
    history: [],
    isSimulating: false,
    lastError: null
};

// Initial Mock Data if empty
const MOCK_VENTURES: Venture[] = [
    {
        id: '1',
        name: "Forgia del Ragno Nero",
        type: "Artigianato/Magico",
        partyMember: "Vicky",
        manager: "Xullrae (Fabbro Drow)",
        description: "Produce armi in adamantio per le guardie minori.",
        baseIncome: 500,
        baseCost: 200,
        efficiency: 85,
        loyalty: 90,
        notoriety: 40,
        factionAlignment: "House Nasadra"
    },
    {
        id: '2',
        name: "Il Sussurro Vellutato",
        type: "Bordello/Spionaggio",
        partyMember: "Liriel",
        manager: "Jhaelrra (Spia)",
        description: "Luogo di piacere dove si raccolgono segreti dai mercenari ubriachi.",
        baseIncome: 300,
        baseCost: 100,
        efficiency: 70,
        loyalty: 60,
        notoriety: 20,
        factionAlignment: "Independent"
    }
];

export default function App() {
    const [state, setState] = useState<SimulationState>(INITIAL_STATE);
    const [gmNotes, setGmNotes] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);
    const [newVenture, setNewVenture] = useState<Partial<Venture>>({});
    const [isUploading, setIsUploading] = useState(false);
    const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void; isDangerous?: boolean }>({ isOpen: false, title: '', message: '', onConfirm: () => { } });
    const [factions, setFactions] = useState<Faction[]>(getFactions());

    // Load from local storage on mount
    useEffect(() => {
        const saved = localStorage.getItem('dnd-sim-state');
        if (saved) {
            // Migration check: ensure new fields exist
            const parsed = JSON.parse(saved);
            if (!parsed.loreDocuments) parsed.loreDocuments = [];
            if (!parsed.partyLevel) parsed.partyLevel = 3;
            setState(parsed);
        } else {
            // Initialize with mocks for first run
            setState(s => ({ ...s, ventures: MOCK_VENTURES }));
        }
    }, []);

    // Save to local storage on change
    useEffect(() => {
        localStorage.setItem('dnd-sim-state', JSON.stringify(state));
    }, [state]);

    const handleSimulate = async () => {
        if (state.ventures.length === 0) {
            alert("Aggiungi almeno un'attività per simulare.");
            return;
        }

        setState(prev => ({ ...prev, isSimulating: true, lastError: null }));

        try {
            const report = await generateSimulationCycle(state.cycle, state.partyLevel, state.ventures, gmNotes, state.loreDocuments);

            setState(prev => ({
                ...prev,
                cycle: prev.cycle + 1,
                gold: prev.gold + report.totalGoldChange,
                history: [report, ...prev.history],
                isSimulating: false
            }));
        } catch (error) {
            setState(prev => ({
                ...prev,
                isSimulating: false,
                lastError: "Errore durante la simulazione. Controlla la chiave API o riprova."
            }));
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        setIsUploading(true);
        const files = Array.from(e.target.files) as File[];

        try {
            const newDocs: LoreDocument[] = [];
            for (const file of files) {
                const doc = await parseFile(file);
                newDocs.push(doc);
            }

            setState(prev => ({
                ...prev,
                loreDocuments: [...prev.loreDocuments, ...newDocs]
            }));
        } catch (error) {
            console.error(error);
            alert("Errore nel caricamento dei file. Assicurati che siano leggibili.");
        } finally {
            setIsUploading(false);
            // Reset input
            e.target.value = '';
        }
    };

    const deleteLoreDocument = (id: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Rimuovi Documento',
            message: 'Rimuovere questo documento dagli archivi?',
            onConfirm: () => {
                setState(prev => ({
                    ...prev,
                    loreDocuments: prev.loreDocuments.filter(d => d.id !== id)
                }));
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            },
            isDangerous: false
        });
    };

    const handleSaveVenture = () => {
        if (!newVenture.name || !newVenture.type) return;

        if (newVenture.id) {
            // Edit existing
            setState(prev => ({
                ...prev,
                ventures: prev.ventures.map(v =>
                    v.id === newVenture.id ? { ...v, ...newVenture } as Venture : v
                )
            }));
        } else {
            // Create new
            const v: Venture = {
                id: crypto.randomUUID(),
                name: newVenture.name!,
                type: newVenture.type || "Generico",
                partyMember: newVenture.partyMember || "Party",
                manager: newVenture.manager || "Sconosciuto",
                description: newVenture.description || "",
                baseIncome: Number(newVenture.baseIncome) || 0,
                baseCost: Number(newVenture.baseCost) || 0,
                efficiency: Number(newVenture.efficiency) || 50,
                loyalty: Number(newVenture.loyalty) || 50,
                notoriety: 10,
                factionAlignment: newVenture.factionAlignment || "Independent"
            };
            setState(prev => ({ ...prev, ventures: [...prev.ventures, v] }));
        }

        setShowAddModal(false);
        setNewVenture({});
    };

    const handleEditVenture = (id: string) => {
        const venture = state.ventures.find(v => v.id === id);
        if (venture) {
            setNewVenture(venture);
            setShowAddModal(true);
        }
    };

    const deleteVenture = (id: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Smantella Attività',
            message: 'Sei sicuro di voler smantellare questa attività? Questa azione non può essere annullata.',
            onConfirm: () => {
                setState(prev => ({ ...prev, ventures: prev.ventures.filter(v => v.id !== id) }));
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            },
            isDangerous: true
        });
    };

    const resetCampaign = () => {
        setConfirmModal({
            isOpen: true,
            title: 'Reset Campagna',
            message: 'ATTENZIONE: Questa azione cancellerà TUTTA LA CAMPAGNA in modo permanente. Vuoi procedere?',
            onConfirm: () => {
                localStorage.removeItem('dnd-sim-state');
                setState({ ...INITIAL_STATE, loreDocuments: [] });
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                window.location.reload();
            },
            isDangerous: true,
            confirmText: 'CANCELLA TUTTO'
        });
    };

    const handleExportCampaign = () => {
        const campaignName = prompt('Nome della campagna per l\'export:', 'Underdark Campaign') || 'campaign';
        exportCampaign(state, campaignName);
    };

    const handleImportCampaign = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        setConfirmModal({
            isOpen: true,
            title: 'Importa Campagna',
            message: 'Importando una campagna sovrascriverai tutti i dati attuali. Vuoi continuare?',
            onConfirm: async () => {
                try {
                    const file = e.target.files![0];
                    const importedState = await importCampaign(file);
                    setState(importedState);
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                } catch (error) {
                    alert((error as Error).message);
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                }
                e.target.value = '';
            },
            isDangerous: true
        });
    }

    const closeModal = () => {
        setShowAddModal(false);
        setNewVenture({});
    };

    const currentReport = state.history.length > 0 ? state.history[0] : null;
    const levels = Array.from({ length: 20 }, (_, i) => i + 1);

    return (
        <div className="min-h-screen font-sans selection:bg-drow-500 selection:text-white pb-10">

            {/* Header */}
            <header className="sticky top-0 z-50 glass-panel border-b border-drow-700/50 shadow-lg shadow-black/50">
                <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0">
                    <div className="flex items-center space-x-4">
                        <div className="bg-drow-600 p-2 rounded-lg shadow-[0_0_15px_rgba(107,59,173,0.5)]">
                            <Gem className="text-white w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold font-serif tracking-wider text-white uppercase" style={{ textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}>
                                Underdark <span className="text-drow-400">Business</span>
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center space-x-6 md:space-x-8">
                        <div className="hidden md:block text-center group relative">
                            <div className="text-[10px] text-drow-400 uppercase font-bold tracking-wider mb-1">Livello Party</div>
                            <div className="relative">
                                <select
                                    value={state.partyLevel}
                                    onChange={(e) => setState(s => ({ ...s, partyLevel: parseInt(e.target.value) }))}
                                    className="w-24 bg-black/40 text-lg font-mono font-bold text-white text-center focus:outline-none border border-drow-800 focus:border-drow-400 rounded py-1 pl-2 pr-6 appearance-none cursor-pointer hover:bg-black/60 transition-colors"
                                >
                                    {levels.map(lvl => (
                                        <option key={lvl} value={lvl} className="bg-drow-900 text-gray-200">
                                            Lvl {lvl}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-drow-500 pointer-events-none" size={14} />
                            </div>
                        </div>

                        <div className="text-center">
                            <div className="text-[10px] text-drow-400 uppercase font-bold tracking-wider mb-1">Ciclo</div>
                            <div className="text-2xl font-mono font-bold text-white leading-none">{state.cycle}</div>
                        </div>

                        <div className="text-center bg-black/30 px-4 py-1.5 rounded border border-drow-800">
                            <div className="text-[10px] text-drow-400 uppercase font-bold tracking-wider">Tesoro Reale</div>
                            <div className={`text-xl md:text-2xl font-mono font-bold ${state.gold < 0 ? 'text-red-500' : 'text-yellow-500'}`} style={{ textShadow: "0 0 10px rgba(234, 179, 8, 0.2)" }}>
                                {state.gold.toLocaleString()} <span className="text-sm text-yellow-700">MO</span>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <button onClick={handleExportCampaign} className="text-drow-500 hover:text-drow-300 transition-colors p-2" title="Export Campaign">
                                <Download size={20} />
                            </button>
                            <label className="text-drow-500 hover:text-drow-300 transition-colors p-2 cursor-pointer" title="Import Campaign">
                                <FolderOpen size={20} />
                                <input type="file" accept=".json" className="hidden" onChange={handleImportCampaign} />
                            </label>
                            <button onClick={resetCampaign} className="text-drow-600 hover:text-red-500 transition-colors p-2" title="Reset Campaign">
                                <RotateCcw size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left Column: Ventures & Controls (5 Cols) */}
                <div className="lg:col-span-5 space-y-6">

                    {/* Simulation Control Panel */}
                    <div className="glass-panel p-6 rounded-xl shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-drow-600 via-drow-400 to-drow-600"></div>

                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-white flex items-center">
                                <Play className="mr-2 text-drow-400" size={20} /> Fase Operativa
                            </h2>
                            {/* Mobile Level Selector */}
                            <div className="md:hidden flex items-center bg-black/40 rounded border border-drow-800 relative">
                                <span className="text-[10px] text-drow-400 uppercase font-bold ml-2 mr-1">LVL</span>
                                <select
                                    value={state.partyLevel}
                                    onChange={(e) => setState(s => ({ ...s, partyLevel: parseInt(e.target.value) }))}
                                    className="bg-transparent text-sm font-mono font-bold text-white text-center focus:outline-none py-1 pl-1 pr-5 appearance-none w-14"
                                >
                                    {levels.map(lvl => (
                                        <option key={lvl} value={lvl} className="bg-drow-900 text-gray-200">
                                            {lvl}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 text-drow-500 pointer-events-none" size={12} />
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-xs font-bold text-drow-300 mb-2 uppercase tracking-wide">Note del Master (Contesto)</label>
                            <textarea
                                className="w-full bg-black/40 border border-drow-700 rounded-lg p-3 text-sm focus:border-drow-400 focus:outline-none focus:ring-1 focus:ring-drow-400 transition-all text-gray-200 resize-none h-24 placeholder-gray-600"
                                placeholder="Es: C'è una guerra civile in corso. La Casata X è debole..."
                                value={gmNotes}
                                onChange={(e) => setGmNotes(e.target.value)}
                            />
                        </div>

                        <button
                            onClick={handleSimulate}
                            disabled={state.isSimulating}
                            className={`w-full py-4 rounded-lg font-bold text-lg tracking-[0.15em] uppercase transition-all flex items-center justify-center shadow-lg border border-transparent
                        ${state.isSimulating
                                    ? 'bg-drow-900 text-drow-500 border-drow-800 cursor-wait'
                                    : 'bg-gradient-to-r from-drow-700 to-drow-600 hover:from-drow-600 hover:to-drow-500 text-white hover:shadow-[0_0_20px_rgba(107,59,173,0.4)] border-drow-500/30'
                                }`}
                        >
                            {state.isSimulating ? (
                                <>
                                    <span className="animate-spin mr-3">🕸️</span> Simulazione...
                                </>
                            ) : (
                                <>Avanza Ciclo (15gg)</>
                            )}
                        </button>
                        {state.lastError && (
                            <p className="text-red-400 text-xs mt-3 text-center bg-red-950/30 p-2 rounded border border-red-900/50">{state.lastError}</p>
                        )}
                    </div>

                    {/* Knowledge Base / Lore Files */}
                    <div className="glass-panel p-6 rounded-xl shadow-2xl border border-drow-700/50">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-white flex items-center">
                                <BookOpen className="mr-2 text-drow-300" size={20} /> Archivi di Trama
                            </h2>
                            <label className="cursor-pointer bg-drow-700 hover:bg-drow-600 text-white p-2 rounded-lg transition-colors shadow-lg border border-drow-500/50">
                                <Upload size={16} />
                                <input type="file" multiple accept=".pdf,.docx,.txt" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                            </label>
                        </div>

                        {isUploading && <p className="text-xs text-drow-300 animate-pulse mb-2">Decifratura pergamene in corso...</p>}

                        {state.loreDocuments.length === 0 ? (
                            <div className="text-center py-6 text-gray-500 text-sm border border-dashed border-drow-800 rounded-lg">
                                Nessun documento di lore caricato.<br />Carica PDF/Word per dare contesto all'IA.
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                                {state.loreDocuments.map(doc => (
                                    <div key={doc.id} className="flex items-center justify-between bg-black/40 p-2 rounded border border-drow-800 hover:border-drow-600 transition-colors group">
                                        <div className="flex items-center overflow-hidden">
                                            <FileText size={14} className="text-drow-400 mr-2 shrink-0" />
                                            <div className="truncate">
                                                <p className="text-sm text-gray-200 truncate" title={doc.name}>{doc.name}</p>
                                                <p className="text-[10px] text-gray-500 uppercase">{doc.type} • {Math.round(doc.size / 1024)} KB</p>
                                            </div>
                                        </div>
                                        <button onClick={() => deleteLoreDocument(doc.id)} className="text-gray-600 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Ventures List */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-end pb-2 border-b border-white/5">
                            <h2 className="text-lg font-serif font-bold text-gray-200">Asset Attivi ({state.ventures.length})</h2>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="flex items-center space-x-1 px-3 py-1.5 bg-drow-700/50 hover:bg-drow-600 text-drow-100 rounded border border-drow-600 hover:border-drow-400 transition-all text-sm font-bold shadow-lg"
                                title="Aggiungi Attività"
                            >
                                <Plus size={16} /> <span>Nuova Impresa</span>
                            </button>
                        </div>

                        {state.ventures.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed border-drow-800 rounded-xl bg-drow-900/20 text-gray-500 flex flex-col items-center">
                                <Skull className="w-10 h-10 mb-2 opacity-20" />
                                <p>Nessuna attività registrata.</p>
                                <p className="text-sm opacity-50">L'Underdark attende i tuoi investimenti.</p>
                            </div>
                        ) : (
                            <div className="grid gap-5">
                                {state.ventures.map(v => (
                                    <VentureCard
                                        key={v.id}
                                        venture={v}
                                        onDelete={deleteVenture}
                                        onEdit={handleEditVenture}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Report & History (7 Cols) */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="glass-panel border border-drow-700/50 rounded-xl shadow-2xl min-h-[700px] flex flex-col relative">
                        {/* Tabs / Header for Right Panel */}
                        <div className="flex border-b border-drow-700/50 bg-black/20 rounded-t-xl">
                            <button
                                onClick={() => setActiveTab('current')}
                                className={`px-6 py-4 font-bold flex items-center transition-all ${activeTab === 'current'
                                        ? 'text-drow-100 border-b-2 border-drow-400 bg-drow-800/20'
                                        : 'text-gray-500 hover:text-gray-300'
                                    }`}
                            >
                                Ultimo Rapporto
                            </button>
                            <button
                                onClick={() => setActiveTab('history')}
                                className={`px-6 py-4 flex items-center transition-all ${activeTab === 'history'
                                        ? 'text-drow-100 border-b-2 border-drow-400 bg-drow-800/20 font-bold'
                                        : 'text-gray-500 hover:text-gray-300'
                                    }`}
                            >
                                <History size={16} className="mr-2" /> Storico ({state.history.length})
                            </button>
                        </div>

                        <div className="p-6 flex-grow overflow-y-auto">
                            {state.isSimulating ? (
                                <div className="h-full flex flex-col items-center justify-center text-drow-400 animate-pulse">
                                    <div className="relative w-24 h-24 mb-6">
                                        <div className="absolute inset-0 bg-drow-500 rounded-full blur-xl opacity-20 animate-ping"></div>
                                        <Skull className="w-24 h-24 relative z-10 text-drow-300" />
                                    </div>
                                    <p className="font-serif text-2xl text-white tracking-wide mb-2">Consultazione delle Ombre</p>
                                    <p className="text-sm text-drow-400">Le Matrone stanno valutando le tue azioni...</p>
                                </div>
                            ) : activeTab === 'current' ? (
                                currentReport ? (
                                    <SimulationReportView report={currentReport} />
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-60">
                                        <Gem className="w-16 h-16 mb-4 text-drow-800" />
                                        <p className="text-lg font-serif">Nessun rapporto disponibile.</p>
                                        <p className="text-sm">Avvia una simulazione per vedere i risultati.</p>
                                    </div>
                                )
                            ) : (
                                <div className="space-y-4">
                                    {state.history.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-60 py-20">
                                            <History className="w-16 h-16 mb-4 text-drow-800" />
                                            <p className="text-lg font-serif">Nessuno storico disponibile.</p>
                                            <p className="text-sm">I rapporti dei cicli passati appariranno qui.</p>
                                        </div>
                                    ) : (
                                        state.history.map((report, index) => (
                                            <div key={`${report.cycleNumber}-${index}`} className="border-b border-drow-800 pb-6 last:border-0">
                                                <SimulationReportView report={report} />
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Modal Add Venture */}
            {showAddModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
                    <div className="bg-drow-900 border border-drow-500 rounded-xl shadow-[0_0_50px_rgba(107,59,173,0.3)] w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="bg-gradient-to-r from-drow-800 to-drow-900 p-5 border-b border-drow-600 flex justify-between items-center shrink-0">
                            <h3 className="font-bold text-xl text-white font-serif flex items-center">
                                <Gem className="mr-2 text-drow-400" size={20} />
                                {newVenture.id ? "Modifica Impresa" : "Registra Nuova Impresa"}
                            </h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-white transition-colors">&times;</button>
                        </div>

                        <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar">

                            {/* Basic Info Section */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-drow-300 mb-1 uppercase">Nome Attività</label>
                                        <input type="text" className="w-full bg-black/40 border border-drow-700 rounded p-2.5 text-white focus:border-drow-400 focus:outline-none transition-colors"
                                            value={newVenture.name || ''} onChange={e => setNewVenture({ ...newVenture, name: e.target.value })} placeholder="Es. Forgia Oscura" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-drow-300 mb-1 uppercase">Tipo</label>
                                        <input type="text" className="w-full bg-black/40 border border-drow-700 rounded p-2.5 text-white focus:border-drow-400 focus:outline-none transition-colors"
                                            value={newVenture.type || ''} onChange={e => setNewVenture({ ...newVenture, type: e.target.value })} placeholder="Es. Commercio, Spionaggio..." />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-yellow-500/80 mb-1 uppercase">Proprietario (PG)</label>
                                        <input type="text" className="w-full bg-black/40 border border-yellow-900/50 rounded p-2.5 text-white focus:border-yellow-500 focus:outline-none transition-colors"
                                            value={newVenture.partyMember || ''} onChange={e => setNewVenture({ ...newVenture, partyMember: e.target.value })} placeholder="Nome del Giocatore (es. Vicky)" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-blue-400/80 mb-1 uppercase">Gestore Operativo (PNG)</label>
                                        <input type="text" className="w-full bg-black/40 border border-blue-900/50 rounded p-2.5 text-white focus:border-blue-500 focus:outline-none transition-colors"
                                            value={newVenture.manager || ''} onChange={e => setNewVenture({ ...newVenture, manager: e.target.value })} placeholder="Chi gestisce in assenza del PG?" />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Descrizione</label>
                                <textarea className="w-full bg-black/40 border border-drow-700 rounded p-3 text-white h-24 focus:border-drow-400 focus:outline-none transition-colors resize-none"
                                    value={newVenture.description || ''} onChange={e => setNewVenture({ ...newVenture, description: e.target.value })} placeholder="Cosa fa questa attività?"></textarea>
                            </div>

                            <div className="p-4 bg-black/20 rounded-lg border border-drow-800/50 grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-green-500 mb-1 uppercase flex items-center"><Plus size={12} className="mr-1" /> Entrate Stimate (MO)</label>
                                    <input type="number" className="w-full bg-black/50 border border-green-900/50 rounded p-2 text-white focus:border-green-500 focus:outline-none"
                                        value={newVenture.baseIncome || ''} onChange={e => setNewVenture({ ...newVenture, baseIncome: parseInt(e.target.value) })} placeholder="0" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-red-500 mb-1 uppercase flex items-center"><span className="mr-1">-</span> Costi Gestione (MO)</label>
                                    <input type="number" className="w-full bg-black/50 border border-red-900/50 rounded p-2 text-white focus:border-red-500 focus:outline-none"
                                        value={newVenture.baseCost || ''} onChange={e => setNewVenture({ ...newVenture, baseCost: parseInt(e.target.value) })} placeholder="0" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8 px-2">
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <label className="text-xs font-bold text-blue-400 uppercase">Efficienza</label>
                                        <span className="text-xs text-white font-mono">{newVenture.efficiency || 50}%</span>
                                    </div>
                                    <input type="range" min="0" max="100" className="w-full accent-blue-500 h-2 bg-drow-800 rounded-lg appearance-none cursor-pointer"
                                        value={newVenture.efficiency || 50} onChange={e => setNewVenture({ ...newVenture, efficiency: parseInt(e.target.value) })} />
                                </div>
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <label className="text-xs font-bold text-purple-400 uppercase">Lealtà</label>
                                        <span className="text-xs text-white font-mono">{newVenture.loyalty || 50}%</span>
                                    </div>
                                    <input type="range" min="0" max="100" className="w-full accent-purple-500 h-2 bg-drow-800 rounded-lg appearance-none cursor-pointer"
                                        value={newVenture.loyalty || 50} onChange={e => setNewVenture({ ...newVenture, loyalty: parseInt(e.target.value) })} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Allineamento Fazione</label>
                                <select className="w-full bg-black/40 border border-drow-700 rounded p-2.5 text-white focus:border-drow-400 focus:outline-none"
                                    value={newVenture.factionAlignment || 'Independent'} onChange={e => setNewVenture({ ...newVenture, factionAlignment: e.target.value })}>
                                    {factions.map(faction => (
                                        <option key={faction.value} value={faction.value}>{faction.label}</option>
                                    ))}
                                </select>
                            </div>

                        </div>
                        <div className="p-5 bg-drow-900 border-t border-drow-700 flex justify-end space-x-3 shrink-0">
                            <button onClick={closeModal} className="px-5 py-2 rounded text-gray-400 hover:text-white hover:bg-drow-800 transition">Annulla</button>
                            <button onClick={handleSaveVenture} className="px-8 py-2 bg-gradient-to-r from-drow-700 to-drow-500 hover:from-drow-600 hover:to-drow-400 text-white rounded shadow-lg flex items-center font-bold tracking-wide transform active:scale-95 transition-all">
                                <Save className="mr-2" size={18} /> {newVenture.id ? "SALVA MODIFICHE" : "SALVA IMPRESA"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Modal */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={(confirmModal as any).confirmText}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                isDangerous={confirmModal.isDangerous}
            />

        </div>
    );
}