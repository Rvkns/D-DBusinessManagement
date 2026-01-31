import { SimulationState } from '../types';

/**
 * Export campaign data as JSON file
 */
export const exportCampaign = (state: SimulationState, campaignName: string = 'campaign') => {
    const dataStr = JSON.stringify(state, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${campaignName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

/**
 * Import campaign data from JSON file
 */
export const importCampaign = (file: File): Promise<SimulationState> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target?.result as string);

                // Validate basic structure
                if (!data.ventures || !data.history || data.cycle === undefined) {
                    throw new Error('Invalid campaign file format');
                }

                // Ensure all required fields exist with defaults
                const validatedData: SimulationState = {
                    cycle: data.cycle || 1,
                    gold: data.gold || 0,
                    partyLevel: data.partyLevel || 1,
                    ventures: data.ventures || [],
                    loreDocuments: data.loreDocuments || [],
                    history: data.history || [],
                    isSimulating: false,
                    lastError: null
                };

                resolve(validatedData);
            } catch (error) {
                reject(new Error('Failed to parse campaign file. Make sure it\'s a valid JSON export.'));
            }
        };

        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };

        reader.readAsText(file);
    });
};
