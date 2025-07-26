import { SapphireClient } from "@sapphire/framework";
import { GatewayIntentBits } from "discord.js";
import { dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const requiredEnvVars = ['TOKEN', 'DISCORD_APPLICATION_ID'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

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
  console.log(`🤖 Logged in as ${client.user?.tag}!`);
  console.log(`🏠 Bot is in ${client.guilds.cache.size} guilds`);
  console.log(`🎬 Application ID: ${process.env.DISCORD_APPLICATION_ID}`);

  // Set bot activity
  client.user?.setActivity("🎬 Ready to stream movies!", { type: 3 }); // Type 3 = Watching

  try {
    console.log("⚙️  Registering slash commands...");
    await client.application?.commands.fetch();
    console.log("✅ Slash commands registered successfully!");
  } catch (error) {
    console.error("❌ Failed to register slash commands:", error);
  }
});

client.on("error", (error) => {
  console.error("❌ Discord client error:", error);
});

client.on("warn", (warning) => {
  console.warn("⚠️  Discord client warning:", warning);
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  await client.destroy();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  await client.destroy();
  process.exit(0);
});

console.log("Bot Started");

client.login(process.env.TOKEN);