import * as fs from 'fs';
import { GuildSettingsMap } from './types';

//-----------------
// HELPERS
//-----------------

export namespace Settings {

    const filepath = './settings.json';


    export function read(gsm: GuildSettingsMap) {
        try {
            const rawData = fs.readFileSync(filepath, 'utf8');
            gsm = JSON.parse(rawData) as GuildSettingsMap;
        } catch {
            console.error("failed to read json");
        }
    }


    export function write(gsm: GuildSettingsMap) {
        fs.writeFileSync(filepath, JSON.stringify(gsm, null, 2));
    }


    export function get(gsm: GuildSettingsMap, id: string) {
        if (!gsm) gsm = {};

        if (!gsm[id]) {
            gsm[id] = {
                channels: { vannes: "", admin: "", love: "" },
                emojis: {
                    valid: { id: "", name: "" },
                    notValid: { id: "", name: "" },
                    loading: { id: "", name: "" }
                },
                minReactionNumber: 2,
            };
            write(gsm);
            read(gsm);
        }
        return gsm[id];
    }
}

