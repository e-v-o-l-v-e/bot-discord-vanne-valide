export interface Data {
    channels: Channels;
    emojis: Emoji;
    minReactionNumber: number;
}

export interface Channels {
    vannes: string;
    admin: string;
    love: string;
}

export interface Emoji {
    valid: Valid;
    notValid: Valid;
    loading: Valid;
}

export interface Valid {
    id: string;
    name: string;
}
