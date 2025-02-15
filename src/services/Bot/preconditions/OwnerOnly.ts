import { Precondition } from "@sapphire/framework";
import type {
	CommandInteraction,
	ContextMenuCommandInteraction,
	Message,
} from "discord.js";
import { general } from "../../../locale/commands";

export class OwnerOnlyPrecondition extends Precondition {
	public override async messageRun(message: Message) {
		return this.error({ message: "Unsupported" });
	}

	public override async chatInputRun(interaction: CommandInteraction) {
		if (interaction.user.id === process.env.OWNER_ID) {
			return this.ok();
		} else {
			interaction.reply({
				content: general.errors.notOwner(),
				ephemeral: true,
			});
			return this.error({ message: "MissingPermission: OWNER" });
		}
	}

	public override async contextMenuRun(
		interaction: ContextMenuCommandInteraction
	) {
		return this.error({ message: "Unsupported" });
	}
}
