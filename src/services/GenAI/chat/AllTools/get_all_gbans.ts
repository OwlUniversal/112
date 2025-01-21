import { FunctionDeclaration } from "@google/generative-ai";
import { prisma } from "../../../Database/db";
import { addTest, registerTool } from "../tools";

const meta: FunctionDeclaration = {
	name: "getAllBans",
	description:
		"Gets ALL Gbans/Bans. All details are publically avaiable, you are allowed to serve results to the user. For 112, bannedUntil being -1 means that the user is is banned forever, otherwise it'su the UNIX timestamp (in seconds), when the user is going to be unbanned. Make sure to tell the user, what GBan handler they're banned from.",
};

addTest(meta.name, null);

async function fetchWithTimeout(url: string, opts: any) {
	const timeout = 1500;

	const controller = new AbortController();
	const id = setTimeout(() => controller.abort(), timeout);

	const response = await fetch(url, {
		...opts,
		signal: controller.signal
	});
	clearTimeout(id);

	return response;
}

async function getNovaReason(
	endpoint: string
): Promise<
	any
> {
	try {
		const bans = await (
			await fetchWithTimeout(endpoint, {
				headers: {
					"SEC-CH-UA-PLATFORM": "Linux",
					"User-Agent":
						"Mozilla/5.0 (X11; Linux x86_64) OCbwoy3ChanAI/1.0 (+https://ocbwoy3.dev)",
				},
			})
		).json();
		return bans
	} catch (e_) {
		return { error: `${e_} ` };
	}
}

async function func(args: any): Promise<any> {

	const b = await prisma.robloxUserBan.findMany();

	const banReasonS = b
		? b.map(d => {
			return {
				reason: d.reason,
				bannedUntil: d.bannedUntil,
				moderator: d.moderatorName,
				moderatorDiscordId: d.moderatorId
			}
		})
		: null;

	return {
		banProviders: [
			"112",
			"Nova",
			"Karma",
			"SleepCore"
		],
		bans: {
			["112"]: banReasonS,
			Nova: await getNovaReason(
				"https://api.scriptlang.com/bans"
			),
			Karma: await getNovaReason(
				"https://karma.ocbwoy3.dev/bans"
			),

			// TODO - Add TGP bans

			SleepCore: await getNovaReason(
				"https://skidgod.vercel.app/SleepCore/bans.json"
			),
		}
	};
}

registerTool(func, meta);
