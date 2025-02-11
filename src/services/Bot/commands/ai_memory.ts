import { Command, PreconditionEntryResolvable } from "@sapphire/framework";
import { Subcommand } from "@sapphire/plugin-subcommands";
import { general } from "../../../locale/commands";
import { IsAIWhitelisted } from "../../Database/helpers/AIWhitelist";
import { areGenAIFeaturesEnabled } from "../../GenAI/gemini";
import { chatManager } from "@ocbwoy3chanai/ChatManager";
import { GetChannelPrompt, GetGuildPrompt } from "../../Database/helpers/AISettings";
import { AIContext, Chat } from "@ocbwoy3chanai/chat/index";

import {
	ActionRowBuilder,
	ApplicationIntegrationType,
	AttachmentBuilder,
	GuildChannel,
	InteractionContextType,
	TextChannel
} from "discord.js";
import { Part } from "@google/generative-ai";
import { getDistroNameSync } from "@112/Utility";
import { GetAIModel } from "../listeners/OCbwoy3ChanAI";
import { prisma } from "@db/db";
import { memory } from "@tensorflow/tfjs";

class AskCommand extends Command {
	public constructor(
		context: Subcommand.LoaderContext,
		options: Subcommand.Options
	) {
		super(context, {
			...options,
			description: "Gets all memories OCbwoy3-Chan knows about you",
			preconditions: (<unknown>[]) as PreconditionEntryResolvable[],
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
				.setName("memory")
		);
	}

	public override async chatInputRun(
		interaction: Command.ChatInputCommandInteraction
	) {
		if (!(await IsAIWhitelisted(interaction.user.id))) {
			return await interaction.reply({
				content: general.errors.missingPermission("GENERATIVE_AI"),
				ephemeral: true,
			});
		}
		if (!areGenAIFeaturesEnabled()) {
			return await interaction.reply(general.errors.genai.aiDisabled());
		}

		await interaction.deferReply({
			ephemeral: true,
			fetchReply: true
		});

		const m = await prisma.oCbwoy3ChanAI_UserMemory.findMany({
			where: {
				user: interaction.user.id
			}
		});

		return await interaction.followUp({
			content: "Here are all my memories about you.",
			files: [
				new AttachmentBuilder(Buffer.from(m.map(a=>`ID: ${a.id} | ${a.memory}`).join("\n")), {
					name: "memory.txt",
				}),
			],
			ephemeral: true,
		});
	}
}

export default AskCommand;
