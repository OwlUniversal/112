import { HandleResolver } from "@atproto/identity";
import { FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { addTest, registerTool } from "../tools";

async function fetchWithTimeout(url: string, opts?: any) {
	const timeout = 2500;

	const controller = new AbortController();
	const id = setTimeout(() => controller.abort(), timeout);

	const response = await fetch(url, {
		...opts,
		signal: controller.signal
	});
	clearTimeout(id);

	if (controller.signal.aborted) {
		throw new Error(`Took too long to fetch ${url} (>${timeout}ms)`);
	}

	return response;
}

const meta: FunctionDeclaration = {
	name: "atproto.did_doc",
	description:
		'Resolves a handle or a DID into the user\'s DID, any atproto signing keys and service endpoints (pds, labeler, etc.). The AT Protocol used for the Social Media Platform called "Bluesky". When calling it a Personal Data Server, add AT Protocol in front of it, so we know what you are refrerring to.',
	parameters: {
		required: ["didOrHandle"],
		type: SchemaType.OBJECT,
		description: "resolveDidDoc parameters",
		properties: {
			didOrHandle: {
				description: "The user's DID or handle",
				type: SchemaType.STRING,
			},
		},
	},
};

addTest(meta.name,{
	didOrHandle: "labeler.ocbwoy3.dev"
});

async function func(args: any): Promise<any> {
	let did = args.didOrHandle as string;

	if (!did.startsWith("did:")) {
		const hdlres = new HandleResolver({});
		did = (await hdlres.resolve(did)) || (args.didOrHandle as string);
	}

	const didDoc = await fetchWithTimeout(`https://plc.directory/${did}`);

	return await didDoc.json();
}

registerTool(func, meta);
