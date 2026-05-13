import { GoogleGenAI, Type } from "@google/genai";
import { Venture, CycleReport, LoreDocument, CalculatedVentureResult } from "../types";

const genAI = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
const MODEL_NAME = "gemini-1.5-flash";

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

    ISTRUZIONI CRITICHE PER EL REPORT:
    1. MATCHING ID: Restituisci SEMPRE lo stesso "ventureId" fornito nell'input per ogni attività.
    2. SPIEGAZIONE ECONOMICA: Nel campo "economicResult", spiega NARRATIVAMENTE come si è arrivati al "RISULTATO NETTO FINALE". 
       Esempio: Se c'è un grosso debito, cita furti, sabotaggi o investimenti andati male che corrispondono ai "Dati Economici Reali".
    3. LOGISTICA E POLITICA: Racconta come lo staff ha reagito all'evento e come le Casate Drow (o altre fazioni) guardano l'attività ora.
    4. SHADOW REPORT: Racconta rumors, movimenti di truppe, o segreti che si sussurrano nei mercati di Ched Nasad.
    5. DILEMMA: Crea un cliffhanger o un problema urgente che i giocatori dovranno risolvere nella prossima sessione.

    OUTPUT FORMAT (JSON):
    {
      "ventureReports": [
        {
          "ventureId": "ID dell'attività",
          "economicResult": "Spiegazione narrativa dei flussi d'oro...",
          "logisticsStatus": "Stato del personale e del manager...",
          "politicalImpact": "Reazione delle fazioni esterne..."
        }
      ],
      "shadowReport": "Rumors e segreti della città...",
      "narrativeDilemma": "Gancio per la prossima sessione..."
    }
  `;

  try {
    const response = await genAI.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            ventureReports: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  ventureId: { type: Type.STRING },
                  economicResult: { type: Type.STRING },
                  logisticsStatus: { type: Type.STRING },
                  politicalImpact: { type: Type.STRING }
                }
              }
            },
            shadowReport: { type: Type.STRING },
            narrativeDilemma: { type: Type.STRING }
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response from AI");
    
    // Robust JSON extraction: handle markdown code blocks if the AI includes them
    const cleanJson = jsonText.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
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

  } catch (error) {
    console.error("Simulation AI failed:", error);
    // Return a purely mathematical report if AI fails
    return {
      cycleNumber: currentCycle,
      date: new Date().toLocaleDateString(),
      totalGoldChange: calculatedResults.reduce((sum, res) => sum + res.netGold, 0),
      ventureReports: calculatedResults.map(r => ({
        ventureId: r.ventureId,
        ventureName: r.ventureName,
        economicResult: `Movimento netto di ${r.netGold} mo.`,
        netGold: r.netGold,
        logisticsStatus: "Operatività standard.",
        politicalImpact: "Nessun impatto rilevante.",
        eventName: r.event.name,
        eventCategory: r.event.category,
        modifiedRoll: r.modifiedRoll
      })),
      shadowReport: "Le nebbie dell'Underdark nascondono i movimenti delle fazioni.",
      narrativeDilemma: "Una calma inquietante avvolge le vostre attività.",
      diceRolls: calculatedResults.reduce((acc, r) => ({ ...acc, [r.ventureId]: r.rawRoll }), {}),
      fullRawText: ""
    };
  }
};