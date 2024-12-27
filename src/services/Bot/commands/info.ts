import { Command } from "@sapphire/framework";
import { infoCommand } from "../../../locale/commands";
import { ApplicationIntegrationType, InteractionContextType } from "discord.js";

class SlashCommand extends Command {
	public constructor(
		context: Command.LoaderContext,
		options: Command.Options
	) {
		super(context, {
			...options,
			description: "Get the bot's information.",
		});
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.setContexts(
					InteractionContextType.BotDM,
					InteractionContextType.Guild,
					InteractionContextType.PrivateChannel
				)
				.setIntegrationTypes(
					ApplicationIntegrationType.GuildInstall,
					ApplicationIntegrationType.UserInstall
				)
		);
	}

	public override async chatInputRun(
		interaction: Command.ChatInputCommandInteraction
	) {
		const diff = Math.round(Date.now() - interaction.createdTimestamp);
		const ping = Math.round(this.container.client.ws.ping); // this shit always ends up being -1 for some stupid fucking reason, or not.
		// console.log(diff,interaction.client.ws.ping)
		const mo = await infoCommand.genContent(
			diff.toString(),
			ping.toString()
		);
		return await interaction.reply(mo);
	}
}

export default SlashCommand;
