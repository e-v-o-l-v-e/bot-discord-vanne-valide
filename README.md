# discord-vanne

Discord bot that automatically forwards messages (as embeds) to a "vannes" ("jokes" in french) channel when they receive enough reactions, and some other random things.

## How it works

- When a message receives a set number of your valid emoji reactions, it is automatically posted as an embed in the *vannes* channel
- Messages posted in the *vannes* channel automatically receive both vote emojis (valid and notValid)
- Messages posted in the *love* channel automatically receive a reaction
- The bot can be configured per-server using slash commands
- Commands are restricted to members with a configured "bot manager" role, or Administrators

## Admin commands

| Command                            | Description                                      |
| ---------------------------------- | ------------------------------------------------ |
| `/set channel_vanne: #channel`     | Set the vannes channel                           |
| `/set channel_admin: #channel`     | Set the admin channel                            |
| `/set channel_love: #channel`      | Set the love channel                             |
| `/set emoji_valid: <:name:id>`     | Set the "valid" emoji                            |
| `/set emoji_not_valid: <:name:id>` | Set the "not valid" emoji                        |
| `/set emoji_loading: <:name:id>`   | Set the loading emoji                            |
| `/set min_reaction_number: number` | Minimum number of reactions to forward a message |
| `/set bot_manager_role: @role`     | Role allowed to manage the bot                   |
| `/show_settings`                   | Show the current configuration                   |
| `/ping`                            | Replies with Pong                                |

`/set` accepts any combination of options at once.

## Setup

```bash
git clone https://github.com/e-v-o-l-v-e/bot-discord-vanne-valide.git bot-vanne
cd bot-vanne
npm install
```

Create a `.env` file at the root dir:

```env
DISCORD_TOKEN=your_bot_token_here
APP_ID=your_application_id_here
```

Slash commands are automatically registered with Discord on startup.

## Run

```bash
node main.ts
```
