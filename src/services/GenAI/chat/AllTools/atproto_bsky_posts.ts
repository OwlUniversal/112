import { FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { registerTool } from "../tools";
import { HandleResolver } from "@atproto/identity";
import { BskyAgent } from "@atproto/api";

const meta: FunctionDeclaration = {
	name: "getBskyPosts",
	description:
		"Turns a DID or a handle into Bluesky posts. Can also be used to retrieve Bluesky profile information.",
	parameters: {
		required: ["didOrHandle"],
		type: SchemaType.OBJECT,
		description: "getBskyPosts parameters",
		properties: {
			didOrHandle: {
				description: "The user's DID or handle",
				type: SchemaType.STRING,
			},
		},
	},
};

const agent = new BskyAgent({
	service: "https://public.api.bsky.app",
});

async function func(args: any): Promise<any> {
	let did = args.didOrHandle as string;

	if (!did.startsWith("did:")) {
		const hdlres = new HandleResolver({});
		did = (await hdlres.resolve(did)) || (args.didOrHandle as string);
	}

	const didDoc = await fetch(`https://plc.directory/${did}`);
	const didDocJson = await didDoc.json();
	const service = didDocJson.service.find(
		(s: any) =>
			s.id === "#atproto_pds" && s.type === "AtprotoPersonalDataServer"
	);

	if (!service) {
		throw new Error(
			"Cannot find #atproto_pds with type AtprotoPersonalDataServer in user's did doc"
		);
	}

	const serviceEndpoint = service.serviceEndpoint;

	const {
		data: { feed: posts },
	} = await agent.getAuthorFeed({
		actor: did,
		limit: 25,
	});

	const { data: user } = await agent.app.bsky.actor.getProfile({
		actor: did,
	});

	return {
		userDid: did,
		user: {
			did: user.did,
			joinDate: user.indexedAt,
			displayName: user.displayName,
			handle: user.handle,
			description: user.description,
		},
		posts: posts.map((a) => {
			const blobs: { type: string; alt?: string; url: string }[] = [];
			if ((a.post.record as any).embed) {
				if (
					(a.post.record as any).embed.$type ===
					"app.bsky.embed.images"
				) {
					(
						(a.post.record as any).embed.images as {
							type: string;
							alt: string;
							image: { $type: "blob"; ref: { $link: string } };
						}[]
					).forEach((blob) => {
						blobs.push({
							type: "image",
							alt: blob.alt,
							url: `${serviceEndpoint}/xrpc/com.atproto.sync.getBlob?did=${did}&cid=${blob.image.ref}`,
						});
					});
				}
			}
			if ((a.post.record as any).embed) {
				if (
					(a.post.record as any).embed.$type ===
					"app.bsky.embed.video"
				) {
					const vid = (a.post.record as any).embed as {
						type: string;
						video: { $type: "blob"; ref: { $link: string } };
					};
					blobs.push({
						type: "video",
						url: `${serviceEndpoint}/xrpc/com.atproto.sync.getBlob?did=${did}&cid=${vid.video.ref}`,
					});
				}
			}
			return {
				uri: a.post.uri,
				text: (a.post.record as any).text,
				// blobs: blobs,
				replies: a.post.replyCount,
				likes: a.post.likeCount,
				reposts: a.post.repostCount,
				quotes: a.post.quoteCount,
			};
		}),
	};
	/*
	x.posts.forEach(a=>{
		a.blobs.forEach(y=>console.log(y))
	})
	*/
}

registerTool(func, meta);
