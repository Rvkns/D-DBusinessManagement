import { GoogleGenAI, Type } from "@google/genai";
import { Venture, CycleReport, LoreDocument, CalculatedVentureResult } from "../types";

const genAI = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
const MODEL_NAME = "gemini-2.5-flash";

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
    return `- NOME: ${r.ventureName} (${v.type})
      PROPRIETARIO: ${v.partyMember || "Nessuno"} | MANAGER: ${v.manager}
      DIRETTIVA SCELTA DAL PLAYER: ${r.directive}
      EVENTO ACCADUTO: ${r.event.name} (${r.event.category})
      RISULTATO NUMERICO FISSATO: ${r.netGold > 0 ? '+'+r.netGold : r.netGold} MO
      NUOVE STATISTICHE: Efficienza ${r.newEfficiency}%, Lealtà ${r.newLoyalty}%, Notorietà ${r.newNotoriety}%
      `;
  }).join("\n");

  const loreContext = loreDocuments.length > 0 
    ? `\n\n--- DOCUMENTI DI TRAMA E LORE (FILE UPLOADED) ---\nUse information from these documents to create specific narrative hooks, mention specific NPCs, places, or historical events found within:\n${loreDocuments.map(d => `FILE: ${d.name}\nCONTENT:\n${d.content.substring(0, 50000)}...`).join("\n\n")}\n------------------------------------------\n`
    : "";

  const prompt = `
    SEI IL MOTORE DI SIMULAZIONE NARRATIVA PER UNA CAMPAGNA D&D 5E (UNDERDARK/CHED NASAD).
    I CALCOLI MATEMATICI SONO GIÀ STATI FATTI DAL SISTEMA. IL TUO COMPITO È SOLO RACCONTARE LA STORIA.
    
    CICLO ATTUALE: ${currentCycle} (Periodo di 15 giorni)
    LIVELLO DEL PARTY: ${partyLevel}
    
    NOTE DEL MASTER (CONTESTO IMMEDIATO): 
    ${globalContext || "Nessuna nota specifica."}

    ${loreContext}

    ELENCO ATTIVITÀ (CON RISULTATI GIÀ CALCOLATI):
    ${ventureDescriptions}

    REGOLE DI SIMULAZIONE NARRATIVA:
    1. NON INVENTARE NUMERI: Usa esattamente i "RISULTATO NUMERICO FISSATO" forniti. Giustifica narrativamente PERCHÈ la venture ha guadagnato o perso quella specifica cifra.
    2. GIUSTIFICA L'EVENTO: Se è successo un "SABOTAGGIO", inventa chi è stato (usa le Casate dell'Underdark o le info nella Lore). Se è "STAFF ECCELLENTE", racconta di un PNG specifico che si è distinto.
    3. EFFETTO DELLA DIRETTIVA: Menziona come la "DIRETTIVA SCELTA DAL PLAYER" ha influenzato l'esito. (Es: "Poiché avete scelto di 'Stare Bassi', avete evitato il peggio della ronda...").
    4. PROPRIETARI (PG): Rivolgiti direttamente ai Personaggi Giocanti proprietari quando descrivi le loro attività.
    5. SCALABILITÀ: Adatta le minacce e i PNG al LIVELLO DEL PARTY (${partyLevel}).
    6. TEMA: Mantieni un tono Dark Fantasy, incentrato su intrighi, matriarcato Drow, tradimenti e pericoli sotterranei.

    OUTPUT RICHIESTO (JSON):
    Restituisci un JSON valido con questa struttura esatta:
    {
      "ventureReports": [
        {
          "ventureId": "ID dell'attività (copiato dall'input)",
          "ventureName": "Nome",
          "economicResult": "Narrazione descrittiva economica (es. 'Vendita armi schiavi +300mo')",
          "netGold": (COPIA ESATTAMENTE IL VALORE FORNITO NELL'INPUT, numero intero),
          "logisticsStatus": "Narrazione su staff/manager/problemi basata sull'evento",
          "politicalImpact": "Narrazione sull'impatto politico e l'attenzione delle Casate"
        }
      ],
      "shadowReport": "Testo lungo: Rumors, segreti scoperti o movimenti nell'ombra generali della città.",
      "narrativeDilemma": "Testo lungo: Una situazione critica che richiede l'attenzione del party (hook per la sessione, legato magari a un evento negativo accaduto in questo ciclo)."
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
                  ventureName: { type: Type.STRING },
                  economicResult: { type: Type.STRING },
                  netGold: { type: Type.INTEGER },
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
    
    const data = JSON.parse(jsonText);

    let fullText = `## 🏢 STATO DELLE ATTIVITÀ (Ciclo ${currentCycle})\n\n`;
    
    // Total gold change is now calculated from our engine's exact numbers, NOT the AI's potentially flaky interpretation
    const totalGoldChange = calculatedResults.reduce((sum, res) => sum + res.netGold, 0);

    // Map AI responses back, but enforce our calculated netGold to be absolutely sure
    const enrichedVentureReports = calculatedResults.map(calc => {
        const aiReport = data.ventureReports.find((vr: any) => vr.ventureName === calc.ventureName || vr.ventureId === calc.ventureId) || {
            economicResult: "Nessun report dettagliato.",
            logisticsStatus: "Tutto tranquillo.",
            politicalImpact: "Nessun impatto."
        };

        fullText += `### ${calc.ventureName}\n`;
        fullText += `- **Eco:** ${aiReport.economicResult} (${calc.netGold > 0 ? '+' : ''}${calc.netGold} mo)\n`;
        fullText += `- **Logistica:** ${aiReport.logisticsStatus}\n`;
        fullText += `- **Pol:** ${aiReport.politicalImpact}\n\n`;

        return {
            ventureId: calc.ventureId,
            ventureName: calc.ventureName,
            economicResult: aiReport.economicResult,
            netGold: calc.netGold, // FORCE our calculated gold
            logisticsStatus: aiReport.logisticsStatus,
            politicalImpact: aiReport.politicalImpact,
            eventName: calc.event.name,
            eventCategory: calc.event.category,
            modifiedRoll: calc.modifiedRoll
        };
    });

    fullText += `## 👁️ RAPPORTO DALLE OMBRE\n${data.shadowReport}\n\n`;
    fullText += `## ⚠️ SVILUPPO NARRATIVO\n${data.narrativeDilemma}`;

    const diceRolls: Record<string, number> = {};
    calculatedResults.forEach(r => diceRolls[r.ventureId] = r.rawRoll);

    return {
      cycleNumber: currentCycle,
      date: new Date().toLocaleDateString(),
      totalGoldChange,
      ventureReports: enrichedVentureReports,
      shadowReport: data.shadowReport,
      narrativeDilemma: data.narrativeDilemma,
      fullRawText: fullText,
      diceRolls
    };

  } catch (error) {
    console.error("Simulation failed:", error);
    throw error;
  }
};