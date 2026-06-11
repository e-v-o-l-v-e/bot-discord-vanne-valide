import * as fs from 'fs';
import { join } from 'path';
import { type CustomSlashCommand } from './types.ts';
import { ChatInputCommandInteraction, REST, Routes } from 'discord.js';

const slashCommands: Map<string, CustomSlashCommand> = new Map<string, CustomSlashCommand>


export async function init() {
    const folderPath = join(import.meta.dirname, 'commands')
    for (const file of fs.readdirSync(folderPath).filter(f => f.endsWith('.ts'))) {
        const command = (await import(join(folderPath, file))).default as CustomSlashCommand;
        slashCommands.set(command.data.name, command)
    }

    await deploy();
}


async function deploy() {
    const commands = Array.from(slashCommands.values()).map(command => command.data.toJSON());

    const rest = new REST().setToken(process.env.DISCORD_TOKEN!);
    await rest.put(
        Routes.applicationCommands(process.env.APP_ID!),
        { body: commands }
    );

    console.log('Slash commands registered.');
}


export function get(interaction: ChatInputCommandInteraction): (CustomSlashCommand | undefined) {
    if (!slashCommands.has(interaction.commandName)) {
        console.error("The command doesn't exist");
        return undefined;
    }
    return slashCommands.get(interaction.commandName);
}


export function execute(interaction: ChatInputCommandInteraction) {
    if (!slashCommands.has(interaction.commandName)) {
        console.error("The command doesn't exist");
        return;
    }
    slashCommands.get(interaction.commandName)?.execute(interaction);
}
