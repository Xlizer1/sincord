import { Command } from "@sapphire/framework";
import { ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js";
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

      if (!voiceChannel.permissionsFor(interaction.guild!.members.me!)?.has([
        PermissionFlagsBits.Connect,
        PermissionFlagsBits.UseEmbeddedActivities
      ])) {
        return interaction.reply({
          content: "❌ I don't have permission to start activities in that voice channel!",
          ephemeral: true,
        });
      }

      await interaction.deferReply();

      try {
        // Start the Discord Activity
        const rest = new REST({ version: '10' }).setToken(process.env.TOKEN!);
        
        const activityResponse = await rest.post(
          Routes.channelInvites(voiceChannel.id),
          {
            body: {
              max_age: 86400, // 24 hours
              max_uses: 0, // Unlimited
              target_type: 2, // Embedded Application
              target_application_id: process.env.DISCORD_APPLICATION_ID!, // Your Discord App ID
            },
          }
        ) as any;

        const activityUrl = `https://discord.com/invite/${activityResponse.code}`;

        await interaction.editReply({
          content: `🎬 **Movie Theater Started!**\n\n` +
                   `🎥 Now Playing: **Rick Astley - Never Gonna Give You Up**\n` +
                   `📺 [**Click here to join the movie theater!**](${activityUrl})\n\n` +
                   `*Everyone in the voice channel can watch together!*`,
        });

        // Log activity start
        console.log(`🎬 Movie theater started in ${voiceChannel.name} (${voiceChannel.id})`);
        console.log(`🔗 Activity URL: ${activityUrl}`);

      } catch (apiError: any) {
        console.error('Discord API Error:', apiError);
        
        // Fallback: Provide manual instructions
        await interaction.editReply({
          content: `🎬 **Movie Theater Ready!**\n\n` +
                   `To start watching:\n` +
                   `1. Right-click the voice channel\n` +
                   `2. Select "Activities"\n` +
                   `3. Choose "Movie Theater Bot"\n` +
                   `4. Enjoy the show! 🍿\n\n` +
                   `*If you don't see the activity, make sure the bot has proper permissions.*`
        });
      }

    } catch (error) {
      console.error('Play command error:', error);
      
      const errorMessage = interaction.deferred 
        ? { content: "❌ Failed to start the movie theater. Please try again!" }
        : { content: "❌ Failed to start the movie theater. Please try again!", ephemeral: true };
        
      if (interaction.deferred) {
        await interaction.editReply(errorMessage);
      } else {
        await interaction.reply(errorMessage);
      }
    }
  }
}