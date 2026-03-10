/**
 * Local Storage Service to manage application data in a static web app.
 */

const STORAGE_KEYS = {
  MINUTES: "minutes_data",
  CLIENTS: "clients_data",
  AGREEMENTS: "agreements_data",
  SETTINGS: "settings_data",
  DESIGNS: "designs_data",
};

// Initial data for designs
const INITIAL_DESIGNS = [
  { id: "classic", name: "Clásico LD" },
  { id: "modern", name: "Moderno LD" },
  { id: "minimal", name: "Minimalista LD" },
];

// Helper to get data from localStorage
const get = (key: string, defaultValue: any = []) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
};

// Helper to save data to localStorage
const save = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const storageService = {
  // Clients
  getClients: () => get(STORAGE_KEYS.CLIENTS),
  saveClient: (client: any) => {
    const clients = get(STORAGE_KEYS.CLIENTS);
    if (client.id) {
      const index = clients.findIndex((c: any) => c.id === client.id);
      if (index !== -1) {
        clients[index] = { ...clients[index], ...client, updated_at: new Date().toISOString() };
      }
    } else {
      const newClient = {
        ...client,
        id: Date.now(),
        created_at: new Date().toISOString(),
      };
      clients.push(newClient);
    }
    save(STORAGE_KEYS.CLIENTS, clients);
    return { success: true };
  },
  deleteClient: (id: number) => {
    const clients = get(STORAGE_KEYS.CLIENTS).filter((c: any) => c.id !== id);
    save(STORAGE_KEYS.CLIENTS, clients);
    return { success: true };
  },

  // Minutes
  getMinutes: (clientId?: string) => {
    const minutes = get(STORAGE_KEYS.MINUTES);
    if (clientId) {
      return minutes.filter((m: any) => m.client_id === clientId || m.client_id === parseInt(clientId));
    }
    return minutes.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },
  getMinuteById: (id: number | string) => {
    const minutes = get(STORAGE_KEYS.MINUTES);
    const minute = minutes.find((m: any) => m.id === parseInt(id.toString()));
    if (!minute) return null;

    const agreements = get(STORAGE_KEYS.AGREEMENTS).filter((a: any) => a.minute_id === parseInt(id.toString()));
    return { ...minute, agreements };
  },
  saveMinute: (minuteData: any) => {
    const minutes = get(STORAGE_KEYS.MINUTES);
    const agreements = get(STORAGE_KEYS.AGREEMENTS);
    
    const id = Date.now();
    const { agreements: minuteAgreements, ...minute } = minuteData;

    const newMinute = {
      ...minute,
      id,
      created_at: new Date().toISOString(),
    };
    minutes.push(newMinute);
    save(STORAGE_KEYS.MINUTES, minutes);

    if (minuteAgreements && Array.isArray(minuteAgreements)) {
      const newAgreements = minuteAgreements.map((ag: any) => ({
        ...ag,
        id: Date.now() + Math.random(),
        minute_id: id,
        status: ag.status || "pendiente",
        created_at: new Date().toISOString(),
      }));
      save(STORAGE_KEYS.AGREEMENTS, [...agreements, ...newAgreements]);
    }

    return { id };
  },
  updateMinute: (minuteData: any) => {
    const minutes = get(STORAGE_KEYS.MINUTES);
    const agreements = get(STORAGE_KEYS.AGREEMENTS);
    
    const id = minuteData.id;
    const { agreements: minuteAgreements, ...minute } = minuteData;

    const index = minutes.findIndex((m: any) => m.id === id);
    if (index !== -1) {
      minutes[index] = {
        ...minutes[index],
        ...minute,
        updated_at: new Date().toISOString(),
      };
      save(STORAGE_KEYS.MINUTES, minutes);
    }

    // Replace agreements for this minute
    const otherAgreements = agreements.filter((a: any) => a.minute_id !== id);
    if (minuteAgreements && Array.isArray(minuteAgreements)) {
      const newAgreements = minuteAgreements.map((ag: any) => ({
        ...ag,
        id: ag.id || Date.now() + Math.random(),
        minute_id: id,
        status: ag.status || "pendiente",
        created_at: ag.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
      save(STORAGE_KEYS.AGREEMENTS, [...otherAgreements, ...newAgreements]);
    } else {
      save(STORAGE_KEYS.AGREEMENTS, otherAgreements);
    }

    return { success: true };
  },

  // Agreements
  getAgreements: () => {
    const agreements = get(STORAGE_KEYS.AGREEMENTS);
    const minutes = get(STORAGE_KEYS.MINUTES);
    
    return agreements.map((ag: any) => {
      const minute = minutes.find((m: any) => m.id === ag.minute_id);
      return {
        ...ag,
        minute_number: minute ? minute.minute_number : "N/A",
        client: minute ? minute.client : "N/A",
      };
    }).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },
  updateAgreementStatus: (id: number, status: string) => {
    const agreements = get(STORAGE_KEYS.AGREEMENTS);
    const index = agreements.findIndex((a: any) => a.id === id);
    if (index !== -1) {
      agreements[index].status = status;
      save(STORAGE_KEYS.AGREEMENTS, agreements);
    }
    return { success: true };
  },

  // Settings
  getSettings: () => get(STORAGE_KEYS.SETTINGS, {}),
  saveSettings: (key: string, value: any) => {
    const settings = get(STORAGE_KEYS.SETTINGS, {});
    settings[key] = value;
    save(STORAGE_KEYS.SETTINGS, settings);
    return { success: true };
  },
  getLogo: () => {
    const settings = get(STORAGE_KEYS.SETTINGS, {});
    return settings.logo || null;
  },
  getHeader: () => {
    const settings = get(STORAGE_KEYS.SETTINGS, {});
    return settings.header || null;
  },
  getFooter: () => {
    const settings = get(STORAGE_KEYS.SETTINGS, {});
    return settings.footer || null;
  },

  // Designs
  getDesigns: () => get(STORAGE_KEYS.DESIGNS, INITIAL_DESIGNS),
};
