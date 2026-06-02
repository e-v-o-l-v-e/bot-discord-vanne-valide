export interface Data {
    channels: Channels;
    emojis: Emoji;
    minReactionNumber: number;
    embeds: Embed[]
}

export interface Channels {
    vannes: string;
    admin: string;
    love: string;
}

export interface Emoji {
    valid: Valid;
    notValid: Valid;
}

export interface Valid {
    id: string;
    name: string;
}

export interface Embed {
    id: string;
    vanneId: string;
    context: number;
}
