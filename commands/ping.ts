import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { type CustomSlashCommand } from "../types.ts";

export default {
    data: new SlashCommandBuilder().setName('ping').setDescription('Replies with Pong!'),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.reply('Pong')
    }
} satisfies CustomSlashCommand;
