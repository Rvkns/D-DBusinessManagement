import React, { useState, useEffect } from 'react';
import { Venture, CycleReport, SimulationState, LoreDocument, DirectiveId } from '../types';
import VentureCard from './VentureCard';
import SimulationReportView from './SimulationReportView';
import ConfirmModal from './ConfirmModal';
import DirectivePanel from './DirectivePanel';
import { generateSimulationCycle } from '../services/geminiService';
import { parseFile } from '../services/fileParsing';
import { runFullSimulation } from '../utils/simulationEngine';
import { supabase } from '../services/supabaseClient';
import { signOut } from '../services/authService';
import { Plus, Play, History, Skull, RotateCcw, Gem, Upload, FileText, Trash2, BookOpen, ChevronDown, LogOut, Users } from 'lucide-react';

interface DMViewProps {
    campaignId: string;
}

export default function DMView({ campaignId }: DMViewProps) {
    const [selectedCampaignId, setSelectedCampaignId] = useState(campaignId);
    const [dmCampaigns, setDmCampaigns] = useState<{id: string; name: string; join_code: string | null}[]>([]);
    const [state, setState] = useState<SimulationState>({
        cycle: 1,
        gold: 1000,
        partyLevel: 3,
        ventures: [],
        loreDocuments: [],
        history: [],
        isSimulating: false,
        lastError: null
    });
    
    const [gmNotes, setGmNotes] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);
    const [newVenture, setNewVenture] = useState<Partial<Venture>>({});
    const [isUploading, setIsUploading] = useState(false);
    const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void; isDangerous?: boolean; confirmText?: string }>({ isOpen: false, title: '', message: '', onConfirm: () => { } });
    const [players, setPlayers] = useState<{id: string, email: string}[]>([]);
    const [campaignJoinCode, setCampaignJoinCode] = useState('');

    // Load everything from Supabase
    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch Campaign Info
                const { data: campaign } = await supabase.from('campaigns').select('*').eq('id', selectedCampaignId).single();
                if (campaign) {
                    setGmNotes(campaign.gm_notes || "");
                    setState(prev => ({ ...prev, cycle: campaign.cycle, gold: campaign.gold, partyLevel: campaign.party_level }));
                    setCampaignJoinCode(campaign.join_code || '');
                }

                // 2. Fetch Players for assignment (needed before ventures mapping)
                const { data: members } = await supabase.from('campaign_members').select('user_id').eq('campaign_id', selectedCampaignId).eq('status', 'active');
                const memberIds = (members || []).map(m => m.user_id);
                const { data: profileData } = memberIds.length > 0
                    ? await supabase.from('user_profiles').select('id, display_name').in('id', memberIds)
                    : { data: [] as any };

                const playerNameById = new Map((profileData || []).map(p => [p.id, p.display_name || "Sconosciuto"]));
                setPlayers((profileData || []).map(p => ({ id: p.id, email: p.display_name || "Sconosciuto" })));

                // 3. Fetch Ventures
                const { data: ventures } = await supabase.from('ventures').select('*, pending_effects(*)').eq('campaign_id', selectedCampaignId);
                if (ventures) {
                    const mappedVentures: Venture[] = ventures.map(v => ({
                        id: v.id,
                        name: v.name,
                        type: v.type,
                        partyMember: playerNameById.get(v.owner_user_id) || "",
                        manager: v.manager,
                        description: v.description,
                        baseIncome: v.base_income,
                        baseCost: v.base_cost,
                        efficiency: v.efficiency,
                        loyalty: v.loyalty,
                        notoriety: v.notoriety,
                        factionAlignment: v.faction_alignment,
                        currentDirective: v.current_directive,
                        directiveLocked: v.directive_locked,
                        pendingEffects: v.pending_effects.map((pe: any) => ({
                            id: pe.id,
                            sourceEventId: pe.source_event_id,
                            description: pe.description,
                            efficiencyDelta: pe.efficiency_delta,
                            loyaltyDelta: pe.loyalty_delta,
                            notorietyDelta: pe.notoriety_delta,
                            remainingCycles: pe.remaining_cycles
                        }))
                    }));
                    setState(prev => ({ ...prev, ventures: mappedVentures }));
                }

                // 4. Fetch History
            const { data: history } = await supabase.from('cycle_reports').select('*').eq('campaign_id', selectedCampaignId).order('cycle_number', { ascending: false });
            if (history) {
                setState(prev => ({ ...prev, history: history.map(h => ({
                    cycleNumber: h.cycle_number,
                    date: new Date(h.created_at).toLocaleDateString(),
                    totalGoldChange: h.total_gold_change,
                    ventureReports: h.venture_reports,
                    shadowReport: h.shadow_report,
                    narrativeDilemma: h.narrative_dilemma,
                    fullRawText: h.full_raw_text,
                    diceRolls: h.dice_rolls
                })) }));
            }

            // 5. Fetch Lore
            const { data: lore } = await supabase.from('lore_documents').select('*').eq('campaign_id', selectedCampaignId);
            if (lore) {
                setState(prev => ({ ...prev, loreDocuments: lore }));
            }

        } catch (error) {
                console.error('Errore caricamento dati DM:', error);
                setState(prev => ({ ...prev, lastError: 'Errore nel caricamento dati campagna.' }));
            }
        };

        fetchData();
    }, [selectedCampaignId]);

    useEffect(() => {
        setSelectedCampaignId(campaignId);
    }, [campaignId]);

    useEffect(() => {
        loadDmCampaigns();
    }, []);

    const loadDmCampaigns = async () => {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;
        if (!userId) return;
        const { data } = await supabase.from('campaigns').select('id,name,join_code').eq('dm_user_id', userId).order('created_at', { ascending: true });
        if (data) setDmCampaigns(data as any);
    };

    const createNewCampaign = async () => {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;
        if (!userId) return;
        const code = Math.random().toString(36).slice(2, 8).toUpperCase();
        const { data, error } = await supabase.from('campaigns').insert({ name: `Campagna ${new Date().toLocaleDateString()}`, dm_user_id: userId, gold: 1000, party_level: 3, join_code: code }).select('id').single();
        if (!error && data?.id) {
            setSelectedCampaignId(data.id);
            await loadDmCampaigns();
        }
    };

    const regenerateJoinCode = async () => {
        const code = Math.random().toString(36).slice(2, 8).toUpperCase();
        const { error } = await supabase.from('campaigns').update({ join_code: code }).eq('id', selectedCampaignId);
        if (!error) setCampaignJoinCode(code);
    };

    const handleSimulate = async () => {
        if (state.ventures.length === 0) {
            alert("Aggiungi almeno un'attività per simulare.");
            return;
        }

        setState(prev => ({ ...prev, isSimulating: true, lastError: null }));

        try {
            // 1. Run Math Engine
            const results = runFullSimulation(state.ventures, state.partyLevel);

            // 2. Run AI Narrative
            const report = await generateSimulationCycle(state.cycle, state.partyLevel, results, state.ventures, gmNotes, state.loreDocuments);

            // 3. Update Supabase - Campaign
            const newGold = state.gold + report.totalGoldChange;
            const newCycle = state.cycle + 1;
            await supabase.from('campaigns').update({ gold: newGold, cycle: newCycle, gm_notes: gmNotes }).eq('id', selectedCampaignId);

            // 4. Update Supabase - Ventures & Pending Effects
            for (const res of results) {
                await supabase.from('ventures').update({
                    efficiency: res.newEfficiency,
                    loyalty: res.newLoyalty,
                    notoriety: res.newNotoriety,
                    current_directive: 'MAINTAIN', // Reset directive
                    directive_locked: false
                }).eq('id', res.ventureId);

                // Clear old pending effects and insert new ones
                await supabase.from('pending_effects').delete().eq('venture_id', res.ventureId);
                if (res.pendingEffects.length > 0) {
                    await supabase.from('pending_effects').insert(res.pendingEffects.map(pe => ({
                        venture_id: res.ventureId,
                        source_event_id: pe.sourceEventId,
                        description: pe.description,
                        efficiency_delta: pe.efficiencyDelta,
                        loyalty_delta: pe.loyaltyDelta,
                        notoriety_delta: pe.notorietyDelta,
                        remaining_cycles: pe.remainingCycles
                    })));
                }
            }

            // 5. Save Report
            await supabase.from('cycle_reports').insert({
                campaign_id: selectedCampaignId,
                cycle_number: state.cycle,
                total_gold_change: report.totalGoldChange,
                venture_reports: report.ventureReports,
                dice_rolls: report.diceRolls,
                shadow_report: report.shadowReport,
                narrative_dilemma: report.narrativeDilemma,
                full_raw_text: report.fullRawText
            });

            // 6. Update local state
            setState(prev => ({
                ...prev,
                cycle: newCycle,
                gold: newGold,
                history: [report, ...prev.history],
                isSimulating: false,
                // Update ventures with new stats locally
                ventures: prev.ventures.map(v => {
                    const res = results.find(r => r.ventureId === v.id);
                    if (res) {
                        return { ...v, efficiency: res.newEfficiency, loyalty: res.newLoyalty, notoriety: res.newNotoriety, currentDirective: 'MAINTAIN', directiveLocked: false, pendingEffects: res.pendingEffects };
                    }
                    return v;
                })
            }));

        } catch (error) {
            console.error(error);
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
        try {
            for (const file of Array.from(e.target.files)) {
                const doc = await parseFile(file);
                const { data } = await supabase.from('lore_documents').insert({
                    campaign_id: selectedCampaignId,
                    name: doc.name,
                    type: doc.type,
                    content: doc.content,
                    size: doc.size
                }).select().single();
                
                if (data) {
                    setState(prev => ({ ...prev, loreDocuments: [...prev.loreDocuments, data as LoreDocument] }));
                }
            }
        } catch (error) {
            alert("Errore nel caricamento.");
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
    };

    const deleteLoreDocument = async (id: string) => {
        await supabase.from('lore_documents').delete().eq('id', id);
        setState(prev => ({ ...prev, loreDocuments: prev.loreDocuments.filter(d => d.id !== id) }));
    };

    const handleSaveVenture = async () => {
        if (!newVenture.name || !newVenture.type) return;

        const ventureData = {
            campaign_id: selectedCampaignId,
            name: newVenture.name,
            type: newVenture.type || "Generico",
            manager: newVenture.manager || "Sconosciuto",
            description: newVenture.description || "",
            base_income: Number(newVenture.baseIncome) || 0,
            base_cost: Number(newVenture.baseCost) || 0,
            efficiency: Number(newVenture.efficiency) || 50,
            loyalty: Number(newVenture.loyalty) || 50,
            notoriety: Number(newVenture.notoriety) || 10,
            faction_alignment: newVenture.factionAlignment || "Independent",
            owner_user_id: newVenture.owner_user_id // ID of the player user
        };

        if (newVenture.id) {
            await supabase.from('ventures').update(ventureData).eq('id', newVenture.id);
            setState(prev => ({
                ...prev,
                ventures: prev.ventures.map(v => v.id === newVenture.id ? { ...v, ...newVenture } as Venture : v)
            }));
        } else {
            const { data } = await supabase.from('ventures').insert(ventureData).select().single();
            if (data) {
                setState(prev => ({ ...prev, ventures: [...prev.ventures, { ...data, id: data.id, partyMember: players.find(p => p.id === data.owner_user_id)?.email || "" } as any] }));
            }
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

    const deleteVenture = async (id: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Smantella Attività',
            message: 'Sei sicuro? L\'operazione è irreversibile.',
            onConfirm: async () => {
                await supabase.from('ventures').delete().eq('id', id);
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
            message: 'CANCELLERAI TUTTI I DATI. Procedere?',
            onConfirm: async () => {
                // Implementation for hard reset if needed
                window.location.reload();
            },
            isDangerous: true,
            confirmText: 'CANCELLA TUTTO'
        });
    };

    const handleSelectDirective = (vId: string, dId: DirectiveId) => {
        setState(prev => ({
            ...prev,
            ventures: prev.ventures.map(v => v.id === vId ? { ...v, currentDirective: dId } : v)
        }));
    };

    const handleLockDirective = (vId: string) => {
        setState(prev => ({
            ...prev,
            ventures: prev.ventures.map(v => v.id === vId ? { ...v, directiveLocked: true } : v)
        }));
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
                            <select
                                value={state.partyLevel}
                                onChange={(e) => setState(s => ({ ...s, partyLevel: parseInt(e.target.value) }))}
                                className="bg-black/40 text-lg font-mono font-bold text-white text-center focus:outline-none border border-drow-800 rounded py-1 px-2"
                            >
                                {levels.map(lvl => <option key={lvl} value={lvl} className="bg-drow-900">Lvl {lvl}</option>)}
                            </select>
                        </div>
                        <div className="text-center">
                            <div className="text-[10px] text-drow-400 uppercase font-bold tracking-wider mb-1">Ciclo</div>
                            <div className="text-2xl font-mono font-bold text-white leading-none">{state.cycle}</div>
                        </div>
                        <div className="text-center bg-black/30 px-4 py-1.5 rounded border border-drow-800">
                            <div className="text-[10px] text-drow-400 uppercase font-bold tracking-wider">Tesoro Reale</div>
                            <div className={`text-xl md:text-2xl font-mono font-bold ${state.gold < 0 ? 'text-red-500' : 'text-yellow-500'}`}>
                                {state.gold.toLocaleString()} <span className="text-sm text-yellow-700">MO</span>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button onClick={() => signOut()} className="text-drow-500 hover:text-red-500 p-2 transition-colors">
                                <LogOut size={20} />
                            </button>
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
                    {/* Directive Panel */}
                    <DirectivePanel 
                        ventures={state.ventures} 
                        onSelectDirective={handleSelectDirective}
                        onLockDirective={handleLockDirective}
                        isDMView={true}
                    />

                    {/* Simulation Control Panel */}
                    <div className="glass-panel p-6 rounded-xl shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-drow-600 via-drow-400 to-drow-600"></div>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-white flex items-center">
                                <Play className="mr-2 text-drow-400" size={20} /> Fase Operativa
                            </h2>
                        </div>
                        <div className="mb-6">
                            <label className="block text-xs font-bold text-drow-300 mb-2 uppercase tracking-wide">Note del Master (Contesto)</label>
                            <textarea
                                className="w-full bg-black/40 border border-drow-700 rounded-lg p-3 text-sm focus:border-drow-400 text-gray-200 h-24 resize-none"
                                placeholder="Es: Guerra civile in corso..."
                                value={gmNotes}
                                onChange={(e) => setGmNotes(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={handleSimulate}
                            disabled={state.isSimulating}
                            className={`w-full py-4 rounded-lg font-bold text-lg tracking-[0.15em] uppercase transition-all flex items-center justify-center ${state.isSimulating ? 'bg-drow-900 text-drow-500 cursor-wait' : 'bg-gradient-to-r from-drow-700 to-drow-600 text-white'}`}
                        >
                            {state.isSimulating ? "Simulazione..." : "Avanza Ciclo (15gg)"}
                        </button>
                    </div>

                    {/* Lore Files */}
                    <div className="glass-panel p-6 rounded-xl shadow-2xl border border-drow-700/50">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-white flex items-center"><BookOpen className="mr-2 text-drow-300" size={20} /> Archivi</h2>
                            <label className="cursor-pointer bg-drow-700 hover:bg-drow-600 p-2 rounded-lg"><Upload size={16} /><input type="file" multiple accept=".pdf,.docx,.txt" className="hidden" onChange={handleFileUpload} disabled={isUploading} /></label>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {state.loreDocuments.map(doc => (
                                <div key={doc.id} className="flex items-center justify-between bg-black/40 p-2 rounded border border-drow-800">
                                    <div className="flex items-center"><FileText size={14} className="text-drow-400 mr-2" /><span className="text-sm text-gray-200">{doc.name}</span></div>
                                    <button onClick={() => deleteLoreDocument(doc.id)} className="text-gray-600 hover:text-red-400"><Trash2 size={14} /></button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Asset List */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-end pb-2 border-b border-white/5">
                            <h2 className="text-lg font-serif font-bold text-gray-200">Asset Attivi ({state.ventures.length})</h2>
                            <button onClick={() => setShowAddModal(true)} className="flex items-center space-x-1 px-3 py-1.5 bg-drow-700/50 text-drow-100 rounded border border-drow-600 text-sm font-bold"><Plus size={16} /> <span>Nuova Impresa</span></button>
                        </div>
                        <div className="grid gap-5">
                            {state.ventures.map(v => <VentureCard key={v.id} venture={v} onDelete={deleteVenture} onEdit={handleEditVenture} />)}
                        </div>
                    </div>
                </div>

                {/* Right Column: Report & History (7 Cols) */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="glass-panel border border-drow-700/50 rounded-xl shadow-2xl min-h-[700px] flex flex-col">
                        <div className="flex border-b border-drow-700/50 bg-black/20 rounded-t-xl">
                            <button onClick={() => setActiveTab('current')} className={`px-6 py-4 font-bold transition-all ${activeTab === 'current' ? 'text-drow-100 border-b-2 border-drow-400' : 'text-gray-500'}`}>Ultimo Rapporto</button>
                            <button onClick={() => setActiveTab('history')} className={`px-6 py-4 transition-all ${activeTab === 'history' ? 'text-drow-100 border-b-2 border-drow-400 font-bold' : 'text-gray-500'}`}><History size={16} className="mr-2 inline" /> Storico ({state.history.length})</button>
                        </div>
                        <div className="p-6 flex-grow overflow-y-auto">
                            {activeTab === 'current' ? (currentReport ? <SimulationReportView report={currentReport} /> : <p className="text-center text-gray-600 mt-20">Nessun rapporto.</p>) : state.history.map((r, i) => <div key={i} className="mb-6"><SimulationReportView report={r} /></div>)}
                        </div>
                    </div>
                </div>
            </main>

            {/* Modal Add Venture */}
            {showAddModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4">
                    <div className="bg-drow-900 border border-drow-500 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-5 border-b border-drow-600 flex justify-between items-center text-white font-serif font-bold text-xl">
                            {newVenture.id ? "Modifica Impresa" : "Nuova Impresa"}
                            <button onClick={() => setShowAddModal(false)}>&times;</button>
                        </div>
                        <div className="p-8 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <input type="text" placeholder="Nome" className="bg-black/40 border border-drow-700 p-2 text-white" value={newVenture.name || ""} onChange={e => setNewVenture({...newVenture, name: e.target.value})} />
                                <input type="text" placeholder="Tipo" className="bg-black/40 border border-drow-700 p-2 text-white" value={newVenture.type || ""} onChange={e => setNewVenture({...newVenture, type: e.target.value})} />
                                <select className="bg-black/40 border border-drow-700 p-2 text-white" value={newVenture.owner_user_id || ""} onChange={e => setNewVenture({...newVenture, owner_user_id: e.target.value})}>
                                    <option value="">Seleziona Player</option>
                                    {players.map(p => <option key={p.id} value={p.id}>{p.email}</option>)}
                                </select>
                                <input type="text" placeholder="Manager PNG" className="bg-black/40 border border-drow-700 p-2 text-white" value={newVenture.manager || ""} onChange={e => setNewVenture({...newVenture, manager: e.target.value})} />
                            </div>
                            <textarea placeholder="Descrizione" className="w-full bg-black/40 border border-drow-700 p-2 text-white h-20" value={newVenture.description || ""} onChange={e => setNewVenture({...newVenture, description: e.target.value})} />
                            <div className="grid grid-cols-2 gap-4">
                                <input type="number" placeholder="Entrate Base" className="bg-black/40 border border-drow-700 p-2 text-white" value={newVenture.baseIncome || ""} onChange={e => setNewVenture({...newVenture, baseIncome: parseInt(e.target.value)})} />
                                <input type="number" placeholder="Costo Base" className="bg-black/40 border border-drow-700 p-2 text-white" value={newVenture.baseCost || ""} onChange={e => setNewVenture({...newVenture, baseCost: parseInt(e.target.value)})} />
                            </div>
                        </div>
                        <div className="p-5 flex justify-end gap-2 border-t border-drow-700">
                            <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-gray-400">Annulla</button>
                            <button onClick={handleSaveVenture} className="px-6 py-2 bg-drow-600 text-white font-bold rounded">Salva</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Modal */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                isDangerous={confirmModal.isDangerous}
            />
        </div>
    );
}
