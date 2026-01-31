export const DEFAULT_FACTIONS = [
    { value: "Independent", label: "Indipendente" },
    { value: "House Nasadra", label: "House Nasadra" },
    { value: "House Melarn", label: "House Melarn" },
    { value: "House D'Artesh", label: "House D'Artesh" },
    { value: "Jaezred Chaulssin", label: "Jaezred Chaulssin" },
    { value: "Szith Morcane", label: "Szith Morcane" },
    { value: "Bregan D'aerthe", label: "Bregan D'aerthe" }
];

export interface Faction {
    value: string;
    label: string;
}

/**
 * Get factions from localStorage or return defaults
 */
export const getFactions = (): Faction[] => {
    const stored = localStorage.getItem('custom-factions');
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch {
            return DEFAULT_FACTIONS;
        }
    }
    return DEFAULT_FACTIONS;
};

/**
 * Save custom factions to localStorage
 */
export const saveFactions = (factions: Faction[]): void => {
    localStorage.setItem('custom-factions', JSON.stringify(factions));
};
