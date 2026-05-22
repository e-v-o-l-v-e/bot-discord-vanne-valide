export interface Data {
    channels: Channels;
    emojis: Emoji;
    minReactionNumber: number;
}

export interface Channels {
    vannes: string;
    admin: string;
}

export interface Emoji {
    valid: Valid;
    notValid: Valid;
}

export interface Valid {
    id: string;
    name: string;
}

export const Data = {};
