import { PrismaClient, RobloxUserBan } from "@prisma/client";
import { BanParams } from "../../lib/Types";
import { RefreshAllBanlands } from "../../lib/BanlandCacheHelper";
import { logger } from "../../lib/Utility";
import { AllBanlandScopes } from "../../lib/Constants";

export const prisma = new PrismaClient();

function IsValidBanningScope(scope: string): boolean {
	let retval = false;
	AllBanlandScopes.forEach((s) => {
		if (scope === s) {
			retval = true;
		}
	});
	return retval;
}

/**
 * Gets all banned users
 * @returns All banned users
 */
export async function GetAllBans(): Promise<RobloxUserBan[]> {
	try {
		const b = await prisma.robloxUserBan.findMany();
		return b;
	} catch (e_) {
		logger.child({ error: e_ }).error("An error has occoured");
		return [];
	}
}

/**
 * Checks if a user is banned.
 * @param userId The Roblox User ID of the user to check
 * @returns The ban entry if they are banned, null otherwise
 */
export async function GetBanData(
	userId: string
): Promise<RobloxUserBan | null> {
	return await prisma.robloxUserBan.findFirst({
		where: {
			userId: userId,
		},
	});
}

/**
 * Bans a user.
 * @param params The ban parameters
 */
export async function BanUser(params: BanParams): Promise<void> {
	if (await GetBanData(params.UserID)) {
		throw "User is already banned";
		return;
	}
	if (!IsValidBanningScope(params.BannedFrom))
		throw `Invalid banning scope \`${params.BannedFrom}\``;
	logger.info(
		`[NEW BAN] ${params.UserID} by ${params.ModeratorName}, ${new Date(
			parseInt(params.BannedUntil) * 1000
		).toISOString()} (${params.Reason})`
	);
	await prisma.robloxUserBan.create({
		data: {
			userId: params.UserID,
			reason: params.Reason,
			bannedUntil: params.BannedUntil,
			privateReason: params.PrivateReason,
			moderatorId: params.ModeratorId,
			moderatorName: params.ModeratorName,
			bannedFrom: params.BannedFrom,
		},
	});
	await RefreshAllBanlands();
}

/**
 * Unnans a user.
 * @param userid The banned player's Roblox User ID
 */
export async function UnbanUser(userid: string): Promise<void> {
	if (!(await GetBanData(userid))) {
		throw "User is not banned";
		return;
	}
	logger.info(`[UNBAN] ${userid}`);
	await prisma.robloxUserBan.delete({
		where: {
			userId: userid,
		},
	});
	await RefreshAllBanlands();
}

/**
 * Adds a user to the whitelist.
 * @param userId The Discord User ID of the user to whitelist
 */
export async function AddWhitelist(userId: string): Promise<void> {
	const existingWhitelist = await prisma.whitelist.findFirst({
		where: {
			id: userId,
		},
	});
	if (existingWhitelist) {
		throw "User is already whitelisted";
		return;
	}
	logger.info(`[WHITELIST ADD] ${userId}`);
	await prisma.whitelist.create({
		data: {
			id: userId,
		},
	});
}

/**
 * Removes a user from the whitelist.
 * @param userId The Discord User ID of the user to remove from the whitelist
 */
export async function RemoveWhitelist(userId: string): Promise<void> {
	const existingWhitelist = await prisma.whitelist.findFirst({
		where: {
			id: userId,
		},
	});
	if (!existingWhitelist) {
		throw "User is not whitelisted";
		return;
	}
	logger.info(`[WHITELIST REMOVE] ${userId}`);
	await prisma.whitelist.delete({
		where: {
			id: userId,
		},
	});
}

/**
 * Checks if a user is whitelisted.
 * @param userId The Discord User ID of the user to check
 * @returns True if the user is whitelisted, false otherwise
 */
export async function IsWhitelisted(userId: string): Promise<boolean> {
	const existingWhitelist = await prisma.whitelist.findFirst({
		where: {
			id: userId,
		},
	});
	return existingWhitelist !== null;
}
