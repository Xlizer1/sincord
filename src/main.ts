import { SapphireClient } from "@sapphire/framework";
import { GatewayIntentBits } from "discord.js";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const client = new SapphireClient({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
  ],
  loadMessageCommandListeners: true,
  baseUserDirectory: __dirname,
});

client.on("ready", async () => {
  console.log(`Logged in as ${client.user?.tag}!`);
  console.log(`Bot is in ${client.guilds.cache.size} guilds`);

  try {
    console.log("Registering slash commands...");
    await client.application?.commands.fetch();
    console.log("Slash commands registered successfully!");
  } catch (error) {
    console.error("Failed to register slash commands:", error);
  }
});

client.login(process.env.TOKEN);
