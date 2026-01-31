import { GoogleGenAI, Type } from "@google/genai";
import { Venture, CycleReport, LoreDocument } from "../types";

const genAI = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

const MODEL_NAME = "gemini-1.5-flash";

export const generateSimulationCycle = async (
  currentCycle: number,
  partyLevel: number,
  ventures: Venture[],
  globalContext: string,
  loreDocuments: LoreDocument[]
): Promise<CycleReport> => {
  
  const ventureDescriptions = ventures.map(v => 
    `- ID: ${v.id} | NOME: ${v.name} (${v.type}) | PROPRIETARIO (PG): ${v.partyMember || "Nessuno"} | MANAGER (PNG): ${v.manager} | EFFICIENZA: ${v.efficiency}% | LEALTÀ: ${v.loyalty}% | ALLINEAMENTO: ${v.factionAlignment} | BASE ORO: +${v.baseIncome}/-${v.baseCost}`
  ).join("\n");

  // Prepare Lore Content
  const loreContext = loreDocuments.length > 0 
    ? `\n\n--- DOCUMENTI DI TRAMA E LORE (FILE UPLOADED) ---\nUse information from these documents to create specific narrative hooks, mention specific NPCs, places, or historical events found within:\n${loreDocuments.map(d => `FILE: ${d.name}\nCONTENT:\n${d.content.substring(0, 50000)}...`).join("\n\n")}\n------------------------------------------\n`
    : "";

  const prompt = `
    SEI IL MOTORE DI SIMULAZIONE FAZIONI E BUSINESS PER UNA CAMPAGNA D&D 5E (UNDERDARK/CHED NASAD).
    
    CICLO ATTUALE: ${currentCycle} (Periodo di 15 giorni)
    LIVELLO DEL PARTY: ${partyLevel}
    
    NOTE DEL MASTER (CONTESTO IMMEDIATO): 
    ${globalContext || "Nessuna nota specifica."}

    ${loreContext}

    ELENCO ATTIVITÀ (VENTURES):
    ${ventureDescriptions}

    REGOLE DI SIMULAZIONE:
    1. Calcola entrate/uscite basandoti su Efficienza e Lealtà. Includi mazzette, furti o successi critici.
    2. SCALABILITÀ: Adatta tutte le minacce, le ricompense monetarie e la gravità degli eventi politici al LIVELLO DEL PARTY (${partyLevel}). 
       - Se il livello è basso (1-4), i problemi sono locali (gang di strada, ratti giganti).
       - Se medio (5-10), i problemi coinvolgono Casate minori o mostri dell'Underdark classici.
       - Se alto (11-16), coinvolgi Matrone Madri, Demoni o intrighi planari.
       - Se epico (17-20), minacce che potrebbero distruggere la città.
    3. Genera eventi narrativi coerenti con Ched Nasad (Matriarcato Drow). Le donne sono al potere, i maschi sono spendibili.
    4. PROPRIETARI (PG): Cita specificamente i Personaggi Giocanti (PG) associati alle attività se succede qualcosa di rilevante che richiede la loro attenzione diretta.
    5. Reazioni Geopolitiche: Usa le informazioni dai DOCUMENTI DI TRAMA per legare gli eventi alle fazioni e alla storia della campagna.
    6. Sii specifico. Non dire "hai perso oro", di "50mo perse in mazzette alla guardia".

    OUTPUT RICHIESTO (JSON):
    Restituisci un JSON valido con questa struttura esatta:
    {
      "ventureReports": [
        {
          "ventureId": "ID dell'attività",
          "ventureName": "Nome",
          "economicResult": "Breve frase descrittiva economica (es. 'Vendita armi schiavi +300mo')",
          "netGold": (numero intero, positivo o negativo),
          "logisticsStatus": "Frase su staff/manager/problemi",
          "politicalImpact": "Frase su influenza casate/fazioni"
        }
      ],
      "shadowReport": "Testo lungo: Rumors, segreti scoperti o movimenti nell'ombra.",
      "narrativeDilemma": "Testo lungo: Una situazione critica che richiede l'attenzione del party (hook per la sessione).",
      "totalGoldChange": (somma totale netGold)
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
            narrativeDilemma: { type: Type.STRING },
            totalGoldChange: { type: Type.INTEGER }
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response from AI");
    
    const data = JSON.parse(jsonText);

    // Construct full narrative text for raw display if needed
    let fullText = `## 🏢 STATO DELLE ATTIVITÀ (Ciclo ${currentCycle})\n\n`;
    data.ventureReports.forEach((v: any) => {
      fullText += `### ${v.ventureName}\n`;
      fullText += `- **Eco:** ${v.economicResult} (${v.netGold > 0 ? '+' : ''}${v.netGold} mo)\n`;
      fullText += `- **Logistica:** ${v.logisticsStatus}\n`;
      fullText += `- **Pol:** ${v.politicalImpact}\n\n`;
    });
    fullText += `## 👁️ RAPPORTO DALLE OMBRE\n${data.shadowReport}\n\n`;
    fullText += `## ⚠️ SVILUPPO NARRATIVO\n${data.narrativeDilemma}`;

    return {
      cycleNumber: currentCycle,
      date: new Date().toLocaleDateString(),
      totalGoldChange: data.totalGoldChange,
      ventureReports: data.ventureReports,
      shadowReport: data.shadowReport,
      narrativeDilemma: data.narrativeDilemma,
      fullRawText: fullText
    };

  } catch (error) {
    console.error("Simulation failed:", error);
    throw error;
  }
};