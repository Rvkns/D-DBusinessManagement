import React, { useState, useEffect } from 'react';
import { supabase, DbUserProfile } from './services/supabaseClient';
import { getCurrentUser, getUserProfile, onAuthStateChange, signOut } from './services/authService';
import AuthScreen from './components/AuthScreen';
import DMView from './components/DMView';
import PlayerView from './components/PlayerView';
import { CycleReport, Venture, DirectiveId } from './types';
import { Gem, Skull, Link as LinkIcon } from 'lucide-react';

export default function App() {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<DbUserProfile | null>(null);
    const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);
    const [playerVentures, setPlayerVentures] = useState<Venture[]>([]);
    const [playerHistory, setPlayerHistory] = useState<CycleReport[]>([]);
    const [dmCampaignLoading, setDmCampaignLoading] = useState(false);
    const [joinCode, setJoinCode] = useState('');
    const [joinLoading, setJoinLoading] = useState(false);
    const [joinError, setJoinError] = useState<string | null>(null);

    useEffect(() => {
        const initAuth = async () => {
            try {
                const currentUser = await getCurrentUser();
                if (currentUser) {
                    let userProfile = await getUserProfile(currentUser.id);
                    if (currentUser.email === 'sentz01@gmail.com' && userProfile?.role !== 'dm') {
                        await supabase.from('user_profiles').upsert({ id: currentUser.id, role: 'dm' });
                        userProfile = await getUserProfile(currentUser.id);
                    }

                    setUser(currentUser);
                    setProfile(userProfile);
                    if (userProfile?.role === 'player') await fetchPlayerData(currentUser.id, userProfile);
                    else if (userProfile?.role === 'dm') await fetchDMCampaign(currentUser.id);
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
            } finally {
                setLoading(false);
            }
        };

        initAuth();

        const subscription = onAuthStateChange(async (session) => {
            try {
                if (session?.user) {
                    const userProfile = await getUserProfile(session.user.id);
                    setUser(session.user);
                    setProfile(userProfile);
                    if (userProfile?.role === 'player') await fetchPlayerData(session.user.id, userProfile);
                    else if (userProfile?.role === 'dm') await fetchDMCampaign(session.user.id);
                } else {
                    setUser(null);
                    setProfile(null);
                    setActiveCampaignId(null);
                    setPlayerVentures([]);
                    setPlayerHistory([]);
                }
            } catch (error) {
                console.error('Auth state change error:', error);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchPlayerData = async (userId: string, userProfile?: DbUserProfile | null) => {
        const { data: membership } = await supabase
            .from('campaign_members')
            .select('campaign_id')
            .eq('user_id', userId)
            .eq('status', 'active')
            .maybeSingle();

        if (!membership?.campaign_id) {
            setActiveCampaignId(null);
            setPlayerVentures([]);
            setPlayerHistory([]);
            return;
        }

        const campaignId = membership.campaign_id;
        setActiveCampaignId(campaignId);

        const { data: members } = await supabase
            .from('campaign_members')
            .select('user_id')
            .eq('campaign_id', campaignId);

        const memberIds = members?.map(m => m.user_id) || [];
        const { data: profiles } = await supabase
            .from('user_profiles')
            .select('id, display_name')
            .in('id', memberIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p.display_name]));

        const { data: ventures } = await supabase
            .from('ventures')
            .select('*, pending_effects(*)')
            .eq('campaign_id', campaignId);

        if (ventures) {
            const mappedVentures: Venture[] = ventures.map(v => ({
                id: v.id,
                owner_user_id: v.owner_user_id,
                name: v.name,
                type: v.type,
                partyMember: profileMap.get(v.owner_user_id) || 'Sconosciuto',
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
                pendingEffects: (v.pending_effects || []).map((pe: any) => ({
                    id: pe.id,
                    sourceEventId: pe.source_event_id,
                    description: pe.description,
                    efficiencyDelta: pe.efficiency_delta,
                    loyaltyDelta: pe.loyalty_delta,
                    notorietyDelta: pe.notoriety_delta,
                    remainingCycles: pe.remaining_cycles
                }))
            }));
            setPlayerVentures(mappedVentures);
        }

        const { data: history } = await supabase
            .from('cycle_reports')
            .select('*')
            .eq('campaign_id', campaignId)
            .order('cycle_number', { ascending: false });

        if (history) {
            setPlayerHistory(history.map(h => ({
                cycleNumber: h.cycle_number,
                date: new Date(h.created_at).toLocaleDateString(),
                totalGoldChange: h.total_gold_change,
                ventureReports: h.venture_reports,
                shadowReport: h.shadow_report,
                narrativeDilemma: h.narrative_dilemma,
                fullRawText: h.full_raw_text
            })));
        }
    };

    const fetchDMCampaign = async (userId: string) => {
        setDmCampaignLoading(true);
        try {
            const { data: campaign, error: campaignError } = await supabase
                .from('campaigns')
                .select('id')
                .eq('dm_user_id', userId)
                .order('created_at', { ascending: true })
                .limit(1)
                .maybeSingle();

            if (campaignError) {
                console.error('Campaign fetch error:', campaignError);
                setActiveCampaignId(null);
                return;
            }
            if (campaign) return setActiveCampaignId(campaign.id);

            const code = Math.random().toString(36).slice(2, 8).toUpperCase();
            const { data: newCampaign, error: createError } = await supabase
                .from('campaigns')
                .insert({ name: 'Nuova Campagna Underdark', dm_user_id: userId, gold: 1000, party_level: 3, join_code: code })
                .select('id')
                .single();

            if (createError) {
                console.error('Campaign creation error:', createError);
                setActiveCampaignId(null);
                return;
            }
            setActiveCampaignId(newCampaign.id);
        } finally {
            setDmCampaignLoading(false);
        }
    };

    const handleJoinCampaign = async () => {
        if (!user?.id || !joinCode.trim()) return;
        setJoinLoading(true);
        setJoinError(null);
        try {
            const normalized = joinCode.trim().toUpperCase();
            const { data: campaign, error } = await supabase
                .from('campaigns')
                .select('id')
                .eq('join_code', normalized)
                .maybeSingle();
            if (error || !campaign) {
                setJoinError('Codice campagna non valido.');
                return;
            }

            const { error: membershipError } = await supabase
                .from('campaign_members')
                .upsert({ campaign_id: campaign.id, user_id: user.id, status: 'active' }, { onConflict: 'campaign_id,user_id' });

            if (membershipError) {
                setJoinError('Impossibile unirsi alla campagna. Riprova.');
                return;
            }

            setJoinCode('');
            await fetchPlayerData(user.id, profile);
        } finally {
            setJoinLoading(false);
        }
    };

    const handleSelectDirective = async (vId: string, dId: DirectiveId) => {
        setPlayerVentures(prev => prev.map(v => v.id === vId ? { ...v, currentDirective: dId } : v));
        await supabase.from('ventures').update({ current_directive: dId }).eq('id', vId);
    };

    const handleLockDirective = async (vId: string) => {
        setPlayerVentures(prev => prev.map(v => v.id === vId ? { ...v, directiveLocked: true } : v));
        await supabase.from('ventures').update({ directive_locked: true }).eq('id', vId);
    };

    if (loading || (profile?.role === 'dm' && dmCampaignLoading)) {
        return <div className="min-h-screen bg-drow-900 flex flex-col items-center justify-center text-drow-400"><Gem className="w-12 h-12 animate-spin mb-4" /><p className="font-serif uppercase tracking-widest animate-pulse">{profile?.role === 'dm' ? 'Preparazione Trono del Master...' : 'Invocazione alle Ombre...'}</p></div>;
    }

    if (!user) return <AuthScreen onLoginSuccess={() => window.location.reload()} />;
    if (profile?.role === 'dm' && activeCampaignId) return <DMView campaignId={activeCampaignId} />;

    if (profile?.role === 'player') {
        if (!activeCampaignId) {
            return (
                <div className="min-h-screen bg-drow-950 text-white flex items-center justify-center p-6">
                    <div className="w-full max-w-md border border-drow-700 rounded-xl p-6 bg-black/40">
                        <div className="flex items-center gap-2 mb-3"><LinkIcon className="w-5 h-5 text-drow-400" /><h2 className="text-xl font-serif">Unisciti a una Campagna</h2></div>
                        <p className="text-drow-300 text-sm mb-4">Inserisci il codice che ti ha dato il DM.</p>
                        <input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="Es: DROW42" className="w-full bg-drow-950 border border-drow-700 rounded-lg px-3 py-2 mb-3" />
                        {joinError && <p className="text-red-400 text-sm mb-3">{joinError}</p>}
                        <button onClick={handleJoinCampaign} disabled={joinLoading} className="w-full bg-drow-600 hover:bg-drow-500 disabled:opacity-60 rounded-lg py-2 font-bold">{joinLoading ? 'Connessione...' : 'Entra nel Gruppo'}</button>
                    </div>
                </div>
            );
        }

        return <PlayerView currentUserId={user.id} ventures={playerVentures} history={playerHistory} onSelectDirective={handleSelectDirective} onLockDirective={handleLockDirective} />;
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center text-white bg-drow-950 p-6 text-center">
            <Skull className="w-16 h-16 text-red-900 mb-4" />
            <h2 className="text-2xl font-serif mb-2">Anomalia nel Profilo</h2>
            <p className="text-drow-400 max-w-md mb-6">Non abbiamo trovato una campagna attiva o un ruolo valido per il tuo account.</p>
            <button onClick={() => signOut().then(() => window.location.reload())} className="bg-drow-700 px-6 py-2 rounded-lg font-bold">Ritorna all'Ingresso</button>
        </div>
    );
}
