import { 
    Directive, 
    DirectiveId, 
    SimulationEvent, 
    Venture, 
    CalculatedVentureResult,
    PendingEffect
} from '../types';

export const DIRECTIVES: Record<DirectiveId, Directive> = {
    MAXIMIZE_PROFIT: {
        id: 'MAXIMIZE_PROFIT',
        label: 'Massimizza i Profitti',
        icon: '💰',
        description: 'Spingi lo staff al massimo, tagliando i costi sulla sicurezza.',
        effects: {
            goldMultiplier: 1.3,
            loyaltyDelta: -10,
            notorietyDelta: +10,
            eventRiskModifier: 5 // Subtracted from roll
        }
    },
    LAY_LOW: {
        id: 'LAY_LOW',
        label: 'Stai Basso',
        icon: '🐍',
        description: 'Evita l\'attenzione delle casate e riduci i ritmi.',
        effects: {
            goldMultiplier: 0.8,
            notorietyDelta: -20,
            loyaltyDelta: +5,
            eventRiskModifier: -15 // Added to roll
        }
    },
    EXPAND: {
        id: 'EXPAND',
        label: 'Espandi',
        icon: '📈',
        description: 'Investi oro per aumentare l\'efficienza futura.',
        effects: {
            goldFixed: -50,
            nextCycleEfficiencyBonus: +15,
            eventRiskModifier: 10 // Subtracted from roll
        }
    },
    INVEST_SECURITY: {
        id: 'INVEST_SECURITY',
        label: 'Investi in Sicurezza',
        icon: '🛡️',
        description: 'Assumi guardie e rafforza gli ingressi.',
        effects: {
            goldFixed: -30,
            eventRiskModifier: -20 // Added to roll
        }
    },
    BRIBE_FACTION: {
        id: 'BRIBE_FACTION',
        label: 'Corrompi la Fazione',
        icon: '🕸️',
        description: 'Paga i protettori nell\'ombra per abbassare la notorietà.',
        effects: {
            goldFixed: -80,
            notorietyDelta: -15,
            eventRiskModifier: -10 // Added to roll
        }
    },
    RECRUIT_STAFF: {
        id: 'RECRUIT_STAFF',
        label: 'Recluta Personale',
        icon: '👥',
        description: 'Trova gente nuova e fidata per migliorare l\'ambiente.',
        effects: {
            goldFixed: -40,
            loyaltyDelta: +15,
            efficiencyDelta: +5,
            eventRiskModifier: 0
        }
    },
    MAINTAIN: {
        id: 'MAINTAIN',
        label: 'Ordinaria Amministrazione',
        icon: '⚙️',
        description: 'Lascia fare al manager, mantenendo la rotta attuale.',
        effects: {
            eventRiskModifier: 0
        }
    }
};

const EVENTS: SimulationEvent[] = [
    // CRITICAL NEGATIVE (<= 5)
    {
        id: 'disaster',
        name: 'Disastro',
        category: 'CRITICAL',
        baseWeight: 0,
        effects: {
            goldMultiplier: 0.2,
            efficiencyDelta: -30,
            notorietyDelta: +15,
            nextCyclePenalty: {
                efficiencyDelta: -20,
                remainingCycles: 2,
                description: 'Danni strutturali gravi.'
            }
        }
    },
    {
        id: 'total_betrayal',
        name: 'Tradimento Aperto',
        category: 'CRITICAL',
        baseWeight: 0,
        effects: {
            goldFixed: -150,
            loyaltyDelta: -40,
            notorietyDelta: +20,
            nextCyclePenalty: {
                loyaltyDelta: -15,
                remainingCycles: 1,
                description: 'Faide interne dopo il tradimento.'
            }
        }
    },
    
    // CRITICAL NEG (6-20)
    {
        id: 'sabotage',
        name: 'Sabotaggio',
        category: 'NEGATIVE',
        baseWeight: 0,
        effects: {
            goldMultiplier: 0.5,
            efficiencyDelta: -15,
            nextCyclePenalty: {
                efficiencyDelta: -10,
                remainingCycles: 1,
                description: 'Ripristino equipaggiamento.'
            }
        }
    },
    {
        id: 'heavy_inspection',
        name: 'Ispezione Pesante',
        category: 'NEGATIVE',
        baseWeight: 0,
        effects: {
            goldFixed: -100,
            notorietyDelta: +10,
            efficiencyDelta: -10
        }
    },

    // NEGATIVE (21-40)
    {
        id: 'internal_theft',
        name: 'Furto Interno',
        category: 'NEGATIVE',
        baseWeight: 0,
        effects: {
            goldFixed: -60,
            loyaltyDelta: -10
        }
    },
    {
        id: 'manager_dispute',
        name: 'Lite con il Manager',
        category: 'NEGATIVE',
        baseWeight: 0,
        effects: {
            efficiencyDelta: -10,
            loyaltyDelta: -5
        }
    },
    {
        id: 'faction_fine',
        name: 'Multa dalla Fazione',
        category: 'NEGATIVE',
        baseWeight: 0,
        effects: {
            goldFixed: -80,
            notorietyDelta: +5
        }
    },

    // NEUTRAL (41-65)
    {
        id: 'ordinary_week',
        name: 'Settimana Ordinaria',
        category: 'NEUTRAL',
        baseWeight: 0,
        effects: {}
    },
    {
        id: 'minor_hiccup',
        name: 'Piccolo Inconveniente Logistico',
        category: 'NEUTRAL',
        baseWeight: 0,
        effects: {
            goldFixed: -10
        }
    },

    // POSITIVE (66-85)
    {
        id: 'lucky_contract',
        name: 'Contratto Inatteso',
        category: 'POSITIVE',
        baseWeight: 0,
        effects: {
            goldMultiplier: 1.3
        }
    },
    {
        id: 'staff_excellence',
        name: 'Staff Eccellente',
        category: 'POSITIVE',
        baseWeight: 0,
        effects: {
            loyaltyDelta: +8,
            efficiencyDelta: +5
        }
    },
    {
        id: 'smooth_operations',
        name: 'Operazioni Fluide',
        category: 'POSITIVE',
        baseWeight: 0,
        effects: {
            goldMultiplier: 1.1,
            notorietyDelta: -5
        }
    },

    // OTTIMO (86-99)
    {
        id: 'big_score',
        name: 'Colpo Grosso',
        category: 'POSITIVE',
        baseWeight: 0,
        effects: {
            goldMultiplier: 1.6,
            notorietyDelta: +10
        }
    },
    {
        id: 'advantageous_alliance',
        name: 'Alleanza Vantaggiosa',
        category: 'POSITIVE',
        baseWeight: 0,
        effects: {
            goldFixed: +100,
            notorietyDelta: -10,
            nextCyclePenalty: {
                efficiencyDelta: +15,
                remainingCycles: 1,
                description: 'Supporto dall\'alleanza.'
            }
        }
    },

    // LEGGENDARIO (100+)
    {
        id: 'matron_favor',
        name: 'Favore della Matrona',
        category: 'POSITIVE',
        baseWeight: 0,
        effects: {
            goldMultiplier: 2.0,
            notorietyDelta: -20,
            loyaltyDelta: +20,
            efficiencyDelta: +20
        }
    }
];

export function rollD100(): number {
    return Math.floor(Math.random() * 100) + 1;
}

export function applyModifiers(roll: number, venture: Venture, directive: Directive, partyLevel: number): number {
    let modifiedRoll = roll;

    // Stat Modifiers
    if (venture.efficiency > 80) modifiedRoll += 10;
    if (venture.efficiency < 40) modifiedRoll -= 10;
    
    if (venture.loyalty > 80) modifiedRoll += 8;
    if (venture.loyalty < 40) modifiedRoll -= 12;
    
    if (venture.notoriety > 50) {
        modifiedRoll += -Math.floor((venture.notoriety - 50) / 5);
    }

    // Party Level scaling (e.g. higher level characters attract slightly more dangerous events if notoriety is high, 
    // or maybe they just handle things better. Let's say high level adds a slight buffer against disasters)
    modifiedRoll += Math.floor(partyLevel / 4);

    // Directive Modifiers
    if (directive.effects.eventRiskModifier) {
        modifiedRoll -= directive.effects.eventRiskModifier; // Note: In my previous thought I wrote + or -, here I just subtract to make riskModifier intuitive (positive riskModifier = lower roll)
    }

    return modifiedRoll;
}

export function resolveEvent(modifiedRoll: number): SimulationEvent {
    // Categories based on roll:
    // <= 5   → CATASTROFE
    // 6-20   → CRITICO NEG
    // 21-40  → NEGATIVO
    // 41-65  → NEUTRO
    // 66-85  → POSITIVO
    // 86-99  → OTTIMO
    // 100+   → LEGGENDARIO

    let availableEvents = [];

    if (modifiedRoll <= 5) {
        availableEvents = EVENTS.filter(e => ['disaster', 'total_betrayal'].includes(e.id));
    } else if (modifiedRoll <= 20) {
        availableEvents = EVENTS.filter(e => ['sabotage', 'heavy_inspection'].includes(e.id));
    } else if (modifiedRoll <= 40) {
        availableEvents = EVENTS.filter(e => ['internal_theft', 'manager_dispute', 'faction_fine'].includes(e.id));
    } else if (modifiedRoll <= 65) {
        availableEvents = EVENTS.filter(e => ['ordinary_week', 'minor_hiccup'].includes(e.id));
    } else if (modifiedRoll <= 85) {
        availableEvents = EVENTS.filter(e => ['lucky_contract', 'staff_excellence', 'smooth_operations'].includes(e.id));
    } else if (modifiedRoll <= 99) {
        availableEvents = EVENTS.filter(e => ['big_score', 'advantageous_alliance'].includes(e.id));
    } else {
        availableEvents = EVENTS.filter(e => ['matron_favor'].includes(e.id));
    }

    // Pick a random event from the available ones
    if (availableEvents.length === 0) {
         // Fallback to neutral if something goes wrong
         return EVENTS.find(e => e.id === 'ordinary_week')!;
    }
    const randomIndex = Math.floor(Math.random() * availableEvents.length);
    return availableEvents[randomIndex];
}

export function calculateProfit(venture: Venture, directive: Directive, event: SimulationEvent): number {
    if (venture.efficiency < 10) {
        return Math.round(-(venture.baseCost * 0.3)); // SUSPENDED STATE
    }

    // Multipliers apply only to gross income, never to costs
    let grossIncome = venture.baseIncome * (venture.efficiency / 100);
    if (directive.effects.goldMultiplier !== undefined) {
        grossIncome *= directive.effects.goldMultiplier;
    }
    if (event.effects.goldMultiplier !== undefined) {
        grossIncome *= event.effects.goldMultiplier;
    }

    // Subtract cost once, then apply fixed bonuses/penalties
    let finalProfit = grossIncome - venture.baseCost;
    if (directive.effects.goldFixed !== undefined) {
        finalProfit += directive.effects.goldFixed;
    }
    if (event.effects.goldFixed !== undefined) {
        finalProfit += event.effects.goldFixed;
    }

    return Math.round(finalProfit);
}

export function applyStatDeltas(venture: Venture, directive: Directive, event: SimulationEvent): { newEfficiency: number, newLoyalty: number, newNotoriety: number, pendingEffects: PendingEffect[] } {
    let newEfficiency = venture.efficiency;
    let newLoyalty = venture.loyalty;
    let newNotoriety = venture.notoriety;
    
    let newPendingEffects: PendingEffect[] = venture.pendingEffects ? [...venture.pendingEffects] : [];

    // --- Apply Previous Pending Effects Diffs ---
    // Note: Pending effects shouldn't apply delta EVERY turn, they usually act as a static modifier for N turns.
    // However, if we want them to permanently modify stats, we do it here. 
    // In our design, we'll assume pending effects are modifiers that are applied to base profit/rolls elsewhere, 
    // BUT the prompt asked for them to affect the stats. Let's make them affect stats every cycle they are active for simplicity.
    const activePendingEffects = newPendingEffects.filter(pe => pe.remainingCycles > 0);
    for(const pe of activePendingEffects) {
        newEfficiency += pe.efficiencyDelta || 0;
        newLoyalty += pe.loyaltyDelta || 0;
        newNotoriety += pe.notorietyDelta || 0;
    }

    // --- Apply Directive Deltas ---
    newEfficiency += directive.effects.efficiencyDelta || 0;
    newLoyalty += directive.effects.loyaltyDelta || 0;
    newNotoriety += directive.effects.notorietyDelta || 0;

    // --- Apply Event Deltas ---
    newEfficiency += event.effects.efficiencyDelta || 0;
    newLoyalty += event.effects.loyaltyDelta || 0;
    newNotoriety += event.effects.notorietyDelta || 0;

    // --- Process New Pending Effects from Event ---
    if (event.effects.nextCyclePenalty) {
        newPendingEffects.push({
            id: crypto.randomUUID(),
            sourceEventId: event.id,
            description: event.effects.nextCyclePenalty.description || `Effetto persistente da: ${event.name}`,
            efficiencyDelta: event.effects.nextCyclePenalty.efficiencyDelta || 0,
            loyaltyDelta: event.effects.nextCyclePenalty.loyaltyDelta || 0,
            notorietyDelta: event.effects.nextCyclePenalty.notorietyDelta || 0,
            remainingCycles: event.effects.nextCyclePenalty.remainingCycles
        });
    }

     // --- Process New Pending Effects from Directive ---
     if (directive.effects.nextCycleEfficiencyBonus) {
        newPendingEffects.push({
            id: crypto.randomUUID(),
            sourceEventId: directive.id,
            description: `Effetto dell'investimento: ${directive.label}`,
            efficiencyDelta: directive.effects.nextCycleEfficiencyBonus,
            loyaltyDelta: 0,
            notorietyDelta: 0,
            remainingCycles: 1
        });
     }

    // Decrement active pending effects
    newPendingEffects = newPendingEffects.map(pe => ({...pe, remainingCycles: pe.remainingCycles - 1})).filter(pe => pe.remainingCycles > 0);

    // Clamp values between 0 and 100
    newEfficiency = Math.max(0, Math.min(100, newEfficiency));
    newLoyalty = Math.max(0, Math.min(100, newLoyalty));
    newNotoriety = Math.max(0, Math.min(100, newNotoriety));

    return { newEfficiency, newLoyalty, newNotoriety, pendingEffects: newPendingEffects };
}

export function runFullSimulation(ventures: Venture[], partyLevel: number): CalculatedVentureResult[] {
    const results: CalculatedVentureResult[] = [];

    for (const venture of ventures) {
        // Fallback directive if none chosen or empty string somehow
        const directiveId = venture.currentDirective || 'MAINTAIN'; 
        const directive = DIRECTIVES[directiveId as DirectiveId] || DIRECTIVES['MAINTAIN'];

        const rawRoll = rollD100();
        const modifiedRoll = applyModifiers(rawRoll, venture, directive, partyLevel);
        const event = resolveEvent(modifiedRoll);
        
        const baseProfit = (venture.baseIncome * (venture.efficiency / 100)) - venture.baseCost;
        const netGold = calculateProfit(venture, directive, event);
        
        const { newEfficiency, newLoyalty, newNotoriety, pendingEffects } = applyStatDeltas(venture, directive, event);

        results.push({
            ventureId: venture.id,
            ventureName: venture.name,
            directive: directiveId as DirectiveId,
            rawRoll,
            modifiedRoll,
            event,
            baseProfit: Math.round(baseProfit),
            netGold,
            newEfficiency,
            newLoyalty,
            newNotoriety,
            pendingEffects
        });
    }

    return results;
}
