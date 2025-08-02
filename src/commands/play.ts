import { Command } from "@sapphire/framework";
import { ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder } from "discord.js";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";

export class PlayCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: "play",
      aliases: ["play"],
      description: "Start a movie theater activity",
    });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName("play")
        .setDescription("Start a movie theater in the voice channel")
        .addStringOption(option =>
          option
            .setName("movie")
            .setDescription("Movie to play (default: Rick Roll)")
            .setRequired(false)
        )
    );
  }

  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    try {
      const member = await interaction.guild?.members.fetch(interaction.user.id);
      const voiceChannel = member?.voice.channel;
      
      if (!voiceChannel) {
        return interaction.reply({
          content: "❌ You need to be in a voice channel first!",
          ephemeral: true,
        });
      }

      await interaction.deferReply();

      try {
        // Create an activity invite for the voice channel
        const rest = new REST({ version: '10' }).setToken(process.env.TOKEN!);
        
        const activityInvite = await rest.post(
          Routes.channelInvites(voiceChannel.id),
          {
            body: {
              max_age: 0, // No expiration
              max_uses: 0, // Unlimited uses
              target_type: 2, // Embedded Application
              target_application_id: process.env.DISCORD_APPLICATION_ID!,
            },
          }
        ) as any;

        // The activity will be automatically available in the voice channel
        const embed = new EmbedBuilder()
          .setTitle("🎬 Movie Theater Started!")
          .setDescription(
            `🎥 **Movie Theater** is now available in **${voiceChannel.name}**!\n\n` +
            `**How to join:**\n` +
            `1. Make sure you're in the voice channel\n` +
            `2. Look for the **"Activities"** button in the voice channel\n` +
            `3. Click **"Movie Theater"** to start watching\n\n` +
            `🍿 *Everyone can watch together with synchronized playback!*`
          )
          .setColor(0x5865f2)
          .addFields(
            { name: "🎭 Voice Channel", value: voiceChannel.name, inline: true },
            { name: "👥 Participants", value: `${voiceChannel.members.size}`, inline: true },
            { name: "🎬 Status", value: "Ready to stream", inline: true }
          )
          .setFooter({ text: "Movie Theater Bot • Enjoy the show!" })
          .setTimestamp();

        await interaction.editReply({
          embeds: [embed]
        });

        console.log(`🎬 Movie theater activity started in ${voiceChannel.name} (${voiceChannel.id})`);
        console.log(`🔗 Activity invite created: ${activityInvite.code}`);

      } catch (apiError: any) {
        console.error('Discord API Error:', apiError);
        
        // Provide instructions for manual activation
        const manualEmbed = new EmbedBuilder()
          .setTitle("🎬 Movie Theater Ready!")
          .setDescription(
            `**To start the movie theater:**\n\n` +
            `1. **Right-click** on the **${voiceChannel.name}** voice channel\n` +
            `2. Select **"Start Activity"** or **"Activities"**\n` +
            `3. Choose **"Movie Theater Bot"** from the list\n` +
            `4. Click **"Start Activity"** to begin\n\n` +
            `🎭 Make sure you're in the voice channel first!\n` +
            `🎬 Everyone in the channel can join and watch together.`
          )
          .setColor(0xffa500)
          .addFields(
            { name: "📍 Channel", value: voiceChannel.name, inline: true },
            { name: "⚙️ Setup", value: "Manual", inline: true }
          )
          .setFooter({ text: "If you don't see the activity, check bot permissions" });

        await interaction.editReply({
          embeds: [manualEmbed]
        });
      }

    } catch (error) {
      console.error('Play command error:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setTitle("❌ Error")
        .setDescription("Failed to start the movie theater. Please try again!")
        .setColor(0xff0000)
        .addFields(
          { name: "🔧 Troubleshooting", value: "• Check bot permissions\n• Ensure you're in a voice channel\n• Try again in a few moments" }
        );
        
      if (interaction.deferred) {
        await interaction.editReply({ embeds: [errorEmbed] });
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  }
}