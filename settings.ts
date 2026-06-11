import * as fs from 'fs';
import { type GuildSettingsMap, type GuildSettings } from './types.ts';

//-----------------
// Settings
//-----------------

export let gsm: GuildSettingsMap = {};
const filepath = './settings.json';

const DEFAULT_SETTINGS: GuildSettings = {
    channels: { vannes: "", admin: "", love: "" },
    emojis: {
        valid: { id: "", name: "" },
        notValid: { id: "", name: "" },
        loading: { id: "", name: "" }
    },
    minReactionNumber: 2,
    managerRole: "",
};


export function read() {
    try {
        const rawData = fs.readFileSync(filepath, 'utf8');
        gsm = JSON.parse(rawData) as GuildSettingsMap;
    } catch {
        console.error("failed to read json");
    }
}


export function write() {
    fs.writeFileSync(filepath, JSON.stringify(gsm, null, 2));
}


export function get(id: string): GuildSettings {
    if (!gsm) gsm = {};

    let needsWrite = false;

    if (!gsm[id]) {
        gsm[id] = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
        needsWrite = true;
    } else {
        const repaired = refresh(gsm[id], DEFAULT_SETTINGS);
        if (repaired) needsWrite = true;
    }

    if (needsWrite) {
        write();
        read();
    }

    return gsm[id];
}



function refresh(target: any, source: any): boolean {
    let hasChanges = false;

    for (const key in source) {
        if (source.hasOwnProperty(key)) {
            // If the key doesn't exist at all in the target data, create it
            if (target[key] === undefined) {
                // If it's an object, deep clone it to avoid shared references
                target[key] = typeof source[key] === 'object' && source[key] !== null
                    ? JSON.parse(JSON.stringify(source[key]))
                    : source[key];
                hasChanges = true;
            }
            // If the key exists but it's an object, dive deeper recursively
            else if (typeof source[key] === 'object' && source[key] !== null && typeof target[key] === 'object' && target[key] !== null) {
                const subChanges = refresh(target[key], source[key]);
                if (subChanges) hasChanges = true;
            }
        }
    }

    return hasChanges;
}

