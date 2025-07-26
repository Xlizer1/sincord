import { entersState, joinVoiceChannel, VoiceConnectionStatus } from "@discordjs/voice";
import { isMessageInstance } from "@sapphire/discord.js-utilities";
import { Command } from "@sapphire/framework";
import { ChatInputCommandInteraction, MessageFlags } from "discord.js";

export class PlayCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: "play",
      aliases: ["play"],
      description: "Play a movie",
    });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName("play")
        .setDescription("Type the movie name and it should start soon...")
    );
  }

  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    try {
      const member = await interaction.guild?.members.fetch(
        interaction.user.id
      );
      const voiceChannel = member?.voice.channel;
      if (!voiceChannel) {
        return interaction.reply({
          content: "❌ You need to be in a voice channel first!",
          ephemeral: true,
        });
      }

      if (!voiceChannel.joinable) {
        return interaction.reply({
          content: "❌ I don't have permission to join that voice channel!",
          ephemeral: true,
        });
      }
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: interaction.guildId!,
        adapterCreator: interaction.guild!.voiceAdapterCreator,
      });

      await entersState(connection, VoiceConnectionStatus.Ready, 30_000);

      await interaction.reply({
        content: `Joined!`,
        ephemeral: false
      });
    } catch (error) {
      console.log(error);
    }
  }
}
