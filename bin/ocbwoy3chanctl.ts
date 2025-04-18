import { $ } from "bun";
import chalk from "chalk";
import { Command } from "commander";
import { existsSync, readFileSync } from "fs";

const program = new Command("ocbwoy3chanctl");

program.helpOption("-h, --help");

program.option(
	"-u, --update",
	"Updates OCbwoy3-Chan (command rebuild, ssh only)"
);
program.option("-f, --fast", "Updates OCbwoy3-Chan (fast)");

program.parse(process.argv);

const opts = program.opts();

const PATH = "/home/ocbwoy3/112";
const PASSWORD = readFileSync("/home/ocbwoy3/.ocbwoy3-password").toString(
	"utf-8"
);

if (opts.update) {
	if (!existsSync(PATH)) {
		console.log(chalk.redBright("112's path doesn't exist"));
		throw "path not exists";
	}

	(async () => {
		console.log(chalk.cyanBright("Stashing existing changes"));
		await $`cd ${PATH} && git stash`.nothrow().quiet();

		console.log(chalk.cyanBright("Pulling latest changes"));
		await $`cd ${PATH} && git pull --rebase`.nothrow();
		await $`cd ${PATH} && git stash drop`.nothrow().quiet();

		console.log(chalk.cyanBright("Installing new packages"));
		await $`cd ${PATH} && bun i`.nothrow();

		console.log(chalk.cyanBright("Compiling ocbwoy3chanctl"));
		await $`cd ${PATH} && bun build --compile --minify --outfile dist/ocbwoy3chanctl bin/ocbwoy3chanctl.ts`.nothrow();

		console.log(chalk.cyanBright("Copying ocbwoy3chanctl to usr bin"));
		await $`echo ${PASSWORD} | sudo -S rm /usr/bin/ocbwoy3chanctl`.nothrow();
		await $`echo ${PASSWORD} | sudo -S --chdir=${PATH} cp dist/ocbwoy3chanctl /usr/bin/`.nothrow();

		console.log(chalk.cyanBright("Migrating db"));
		await $`cd ${PATH} && bunx prisma migrate dev --name dev`.nothrow();

		console.log(chalk.cyanBright("Restaring 112"));
		await $`pm2 restart 112`.nothrow();
	})();
} else if (opts.fast) {
	if (!existsSync(PATH)) {
		console.log(chalk.redBright("112's path doesn't exist"));
		throw "path not exists";
	}

	(async () => {
		console.log(chalk.cyanBright("Stashing existing changes"));
		await $`cd ${PATH} && git stash`.nothrow().quiet();

		console.log(chalk.cyanBright("Pulling latest changes"));
		await $`cd ${PATH} && git pull --rebase`.nothrow();
		await $`cd ${PATH} && git stash drop`.nothrow().quiet();

		console.log(chalk.cyanBright("Installing new packages"));
		await $`cd ${PATH} && bun i`.nothrow();

		console.log(chalk.cyanBright("Migrating db"));
		await $`cd ${PATH} && bunx prisma migrate dev --name dev`.nothrow();

		console.log(chalk.cyanBright("Restaring 112"));
		await $`pm2 restart 112`.nothrow();
	})();
}
