import { GoogleGenAI, Type } from "@google/genai";
import { Venture, CycleReport, LoreDocument, CalculatedVentureResult } from "../types";

const genAI = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
const MODEL_NAME = "gemini-3.1-flash-lite";

export const generateSimulationCycle = async (
  currentCycle: number,
  partyLevel: number,
  calculatedResults: CalculatedVentureResult[],
  ventures: Venture[],
  globalContext: string,
  loreDocuments: LoreDocument[]
): Promise<CycleReport> => {
  
  const ventureDescriptions = calculatedResults.map(r => {
    const v = ventures.find(vent => vent.id === r.ventureId);
    if (!v) return "";
    
    // Calculate base components for AI to explain
    const grossIncome = Math.round(v.baseIncome * (v.efficiency / 100));
    const costs = v.baseCost;
    
    return `### DATA PER ATTIVITÀ [ID: ${r.ventureId}]
      NOME: ${r.ventureName} (${v.type})
      PROPRIETARIO: ${v.partyMember || "Nessuno"} | MANAGER: ${v.manager}
      DIRETTIVA: ${r.directive}
      EVENTO: ${r.event.name} (${r.event.category})
      
      DATI ECONOMICI REALI (DA SPIEGARE NARRATIVAMENTE):
      - Entrate lorde (basate su efficienza): ${grossIncome} mo
      - Costi fissi: ${costs} mo
      - Impatto Evento/Direttiva: ${r.netGold - (grossIncome - costs)} mo
      - RISULTATO NETTO FINALE: ${r.netGold} mo
      
      NUOVE STATISTICHE POST-EVENTO: Efficienza ${r.newEfficiency}%, Lealtà ${r.newLoyalty}%, Notorietà ${r.newNotoriety}%
      `;
  }).join("\n---\n");

  const prompt = `
    SEI IL MOTORE NARRATIVO PER UNA CAMPAGNA D&D 5E NELL'UNDERDARK (CHED NASAD).
    IL TUO SCOPO È TRASFORMARE I RISULTATI MATEMATICI DI UN CICLO DI 15 GIORNI IN UNA STORIA COINVOLGENTE.
    
    CONTESTO:
    Ciclo: ${currentCycle} | Livello Party: ${partyLevel}
    Note Master: ${globalContext || "Periodo di relativa stabilità a Ched Nasad."}
    ${loreDocuments.length > 0 ? "Usa i documenti di Lore caricati per citare PNG, luoghi e fazioni specifiche." : ""}

    RISULTATI DELLE ATTIVITÀ:
    ${ventureDescriptions}

    
    ISTRUZIONI:
    1. Per ogni attività, scrivi un 'economicResult' che spieghi NARRATIVAMENTE il guadagno o la perdita (usa i dettagli dell'evento e del dado).
    2. Sii oscuro, drow, e coerente con Ched Nasad.
    3. Il 'shadowReport' deve contenere rumors e segreti basati sui risultati.
    4. Il 'narrativeDilemma' deve essere un gancio per la prossima sessione.
    
    RESTITUISCI SOLO JSON. NESSUN TESTO FUORI DAL JSON.
    OUTPUT FORMAT:
    {
      "ventureReports": [
        {
          "ventureId": "ID dell'attività",
          "economicResult": "Spiegazione narrativa...",
          "logisticsStatus": "Stato del personale...",
          "politicalImpact": "Reazione delle fazioni..."
        }
      ],
      "shadowReport": "Rumors e segreti...",
      "narrativeDilemma": "Gancio per la sessione..."
    }
  `;

  try {
    const response = await genAI.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response from AI");
    
    // Find json block if wrapped, otherwise use the whole text
    const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
    let cleanJson = jsonMatch ? jsonMatch[1].trim() : jsonText.trim();
    
    // In case the AI returns something like "JSON\n{" at the start
    if (!cleanJson.startsWith('{') && cleanJson.includes('{')) {
        cleanJson = cleanJson.substring(cleanJson.indexOf('{'));
    }
    if (!cleanJson.endsWith('}') && cleanJson.lastIndexOf('}') !== -1) {
        cleanJson = cleanJson.substring(0, cleanJson.lastIndexOf('}') + 1);
    }

    const data = JSON.parse(cleanJson);

    const enrichedVentureReports = calculatedResults.map(calc => {
        // Find by ID (strict) or Name (partial)
        const aiReport = data.ventureReports?.find((vr: any) => 
            vr.ventureId === calc.ventureId || 
            (vr.ventureName && vr.ventureName.toLowerCase().includes(calc.ventureName.toLowerCase()))
        ) || {
            economicResult: `L'attività ha registrato un movimento netto di ${calc.netGold} mo. I dettagli sono fumosi, ma i registri confermano la cifra.`,
            logisticsStatus: "Il personale sembra scosso dagli ultimi eventi, ma la struttura regge.",
            politicalImpact: "Le Casate osservano in silenzio, pesando il valore dei vostri asset."
        };

        return {
            ventureId: calc.ventureId,
            ventureName: calc.ventureName,
            economicResult: aiReport.economicResult,
            netGold: calc.netGold,
            logisticsStatus: aiReport.logisticsStatus,
            politicalImpact: aiReport.politicalImpact,
            eventName: calc.event.name,
            eventCategory: calc.event.category,
            modifiedRoll: calc.modifiedRoll,
            newEfficiency: calc.newEfficiency,
            newLoyalty: calc.newLoyalty,
            newNotoriety: calc.newNotoriety
        };
    });

    const shadowReport = data.shadowReport || "Le ombre di Ched Nasad si allungano. Si dice che le Casate stiano riposizionando i loro pezzi sulla scacchiera del potere.";
    const narrativeDilemma = data.narrativeDilemma || "Un messaggero è arrivato con una richiesta urgente. Il tempo stringe e la decisione spetta solo a voi.";

    return {
      cycleNumber: currentCycle,
      date: new Date().toLocaleDateString(),
      totalGoldChange: calculatedResults.reduce((sum, res) => sum + res.netGold, 0),
      ventureReports: enrichedVentureReports,
      shadowReport,
      narrativeDilemma,
      diceRolls: calculatedResults.reduce((acc, r) => ({ ...acc, [r.ventureId]: r.rawRoll }), {}),
      fullRawText: ""
    };

  } catch (error: any) {
    console.error("Simulation AI failed:", error);
    // Return a purely mathematical report if AI fails
    return {
      cycleNumber: currentCycle,
      date: new Date().toLocaleDateString(),
      totalGoldChange: calculatedResults.reduce((sum, res) => sum + res.netGold, 0),
      ventureReports: calculatedResults.map(r => ({
        ventureId: r.ventureId,
        ventureName: r.ventureName,
        economicResult: `Movimento netto di ${r.netGold} mo. (Narrativa fallback: Errore IA)`,
        netGold: r.netGold,
        logisticsStatus: "Operatività standard. (Dettagli indisponibili)",
        politicalImpact: "Nessun impatto rilevante registrato.",
        eventName: r.event.name,
        eventCategory: r.event.category,
        modifiedRoll: r.modifiedRoll,
        newEfficiency: r.newEfficiency,
        newLoyalty: r.newLoyalty,
        newNotoriety: r.newNotoriety
      })),
      shadowReport: `Le nebbie dell'Underdark nascondono i movimenti delle fazioni. [SYSTEM LOG: Il motore narrativo ha riscontrato un'anomalia. ${error?.message || "Errore sconosciuto"}]`,
      narrativeDilemma: "Una calma inquietante avvolge le vostre attività. Attendete il prossimo ciclo.",
      diceRolls: calculatedResults.reduce((acc, r) => ({ ...acc, [r.ventureId]: r.rawRoll }), {}),
      fullRawText: ""
    };
  }
};