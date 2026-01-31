<div align="center">
  <img src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" alt="Banner" width="1200" />
</div>

# 🕸️ D&D Business Management - Underdark Edition

**Un simulatore AI-powered per gestire le attività commerciali della tua campagna D&D nell'Underdark!**

Trasforma le tue ventures drow in un sistema economico vivente con narrazioni generate da Gemini AI, perfetto per Game Masters che vogliono aggiungere profondità alle loro campagne.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat&logo=react)
![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?style=flat&logo=vite)
![Gemini AI](https://img.shields.io/badge/Gemini-AI-8E5CD9?style=flat)

---

## ✨ Features

### 🏛️ Gestione Ventures
- **Crea e gestisci attività** (forgie, bordelli, reti di spionaggio, ecc.)
- **Traccia statistiche** (Efficienza, Lealtà, Notorietà, Oro)
- **Assegna proprietari** (Personaggi Giocanti) e manager (PNG)
- **Allineamento fazioni** configurabile (House Drow, organizzazioni indipendenti)

### 🤖 Simulazione AI con Gemini
- **Report narrativi generati da AI** per ogni ciclo (15 giorni in-game)
- **Scalabilità dinamica** basata sul livello del party (1-20)
- **Eventi politici e economici** contestualizzati all'Underdark
- **Upload documenti di lore** (PDF/DOCX/TXT) per dare contesto alle narrazioni

### 📊 Tracciamento Campagna
- **Storia completa** di tutti i cicli simulati
- **Tab History** per rivedere i rapporti passati
- **Persistenza automatica** tramite localStorage
- **Export/Import campagne** come JSON

### 🎨 UI Premium
- **Design dark fantasy** ispirato ai Drow
- **Glassmorphism** e animazioni fluide
- **Tema custom Tailwind** con palette viola/nero
- **Responsive** e mobile-friendly

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18 o superiore)
- **API Key di Google Gemini** ([Ottienila qui](https://ai.google.dev/))

### Installazione

```bash
# 1. Clona la repository
git clone https://github.com/Rvkns/D-D-Business-Management.git
cd D-D-Business-Management

# 2. Installa le dipendenze
npm install

# 3. Configura l'API key
# Crea un file .env.local nella root del progetto
echo "VITE_GEMINI_API_KEY=la_tua_key_qui" > .env.local

# 4. Avvia il server di sviluppo
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000) nel tuo browser! 🎉

---

## 📖 Come Usare

### 1. Crea le tue Ventures
Clicca su **"Nuova Impresa"** e compila:
- Nome (es. "Forgia del Ragno Nero")
- Tipo (es. "Artigianato/Magico")
- Proprietario (PC) e Manager (NPC)
- Entrate/Costi base
- Efficienza e Lealtà

### 2. Aggiungi Contesto (Opzionale)
- **Upload documenti** nella sezione "Archivi di Trama"
- **Scrivi note** nel campo "Note del Master" per eventi immediati

### 3. Simula un Ciclo
Clicca su **"Avanza Ciclo (15gg)"** e Gemini AI genererà:
- 💰 Report economico per ogni venture
- 📦 Status logistico e problemi operativi
- ⚔️ Impatto politico sulle fazioni
- 👁️ Rumors e segreti scoperti
- ⚠️ Dilemma narrativo per la prossima sessione

### 4. Rivedi la Storia
- Passa alla **tab "Storico"** per vedere tutti i cicli passati
- **Esporta** la campagna come backup JSON
- **Importa** campagne salvate

---

## 🎮 Esempio di Workflow

```
Ciclo 1: Il party (Lvl 3) apre "La Forgia del Ragno Nero"
        → Efficienza 85%, Lealtà 90%
        → Gemini AI genera eventi basati sul contesto

🔮 Report AI:
  - Economico: +300mo vendita armi adamantio a guardia minore
  - Logistica: Il fabbro Xullrae chiede più apprendisti
  - Politico: House Nasadra nota l'attività, propone alleanza
  - Shadow: Rumor di sabotaggio da House Melarn
  - Dilemma: Un demone chiede armi in cambio di protezione...

Prossimo ciclo → Il party decide come reagire al dilemma
```

---

## 🛠️ Tech Stack

| Tecnologia | Uso |
|------------|-----|
| **React 19** | UI Framework |
| **TypeScript** | Type Safety |
| **Vite** | Build Tool |
| **Gemini 1.5 Flash** | AI Narrative Generation |
| **TailwindCSS** | Styling (via CDN) |
| **Lucide React** | Icons |
| **PDF.js + Mammoth** | File Parsing |

---

## 📁 Struttura Progetto

```
D&D-Business-Management/
├── components/
│   ├── VentureCard.tsx              # Card per singola venture
│   ├── SimulationReportView.tsx     # Visualizzazione report
│   └── ConfirmModal.tsx             # Modal di conferma custom
├── services/
│   ├── geminiService.ts             # Integrazione Gemini AI
│   └── fileParsing.ts               # Parser PDF/DOCX/TXT
├── utils/
│   └── dataManager.ts               # Export/Import campagne
├── config/
│   └── factions.ts                  # Sistema fazioni configurabile
├── App.tsx                          # Componente principale
├── types.ts                         # TypeScript interfaces
└── vite-env.d.ts                    # Vite environment types
```

---

## 🎲 Fazioni Default

- **Independent** - Operazioni autonome
- **House Nasadra** - Casata Drow dominante
- **House Melarn** - Rivali di Nasadra
- **House D'Artesh** - Alleati mercenari
- **Jaezred Chaulssin** - Organizzazione segreta
- **Bregan D'aerthe** - Mercenari d'élite

*Puoi aggiungere fazioni custom modificando `config/factions.ts`*

---

## 🔧 Script Disponibili

```bash
npm run dev      # Avvia server di sviluppo (porta 3000)
npm run build    # Build per produzione
npm run preview  # Preview build di produzione
```

---

## 🔐 Security Notes

⚠️ **API Key:** Questo progetto è pensato per uso locale. L'API key Gemini è esposta nel bundle JavaScript. Per deployment pubblico, implementa un backend proxy.

🔒 **Soluzioni consigliate:**
- Usa Firebase Functions o Vercel Edge Functions
- Non deployare con API key in produzione senza proxy

---

## 🤝 Contributing

Contributi benvenuti! Per favore:
1. Fai un fork del progetto
2. Crea un branch per la feature (`git checkout -b feature/AmazingFeature`)
3. Commit le modifiche (`git commit -m 'Add AmazingFeature'`)
4. Push sul branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

---

## 📝 Roadmap

- [ ] Backend con autenticazione per API key sicura
- [ ] Database cloud (Firebase/Supabase) per sync multi-dispositivo
- [ ] Grafici statistiche economiche nel tempo
- [ ] Multi-campagna support
- [ ] Export PDF dei report
- [ ] PWA con offline mode

---

## 🐛 Known Issues

- TypeScript lints su imports ESM (non bloccanti, solo warnings IDE)
- Supporto limitato a 1 campagna per browser (localStorage)

---

## 📜 License

Questo progetto è open source e disponibile sotto la [MIT License](LICENSE).

---

## 🙏 Crediti

- **Gemini AI** by Google per la generazione narrativa
- **AI Studio** per l'ispirazione iniziale
- **Drizzt Do'Urden** per l'ispirazione Underdark ☠️

---

<div align="center">
  <p>Creato con 🕷️ per Game Masters dell'Underdark</p>
  <p><em>"La ricchezza scorre come veleno nelle vene di Ched Nasad"</em></p>
</div>
