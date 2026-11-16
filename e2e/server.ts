import { type ChildProcess, execFileSync, spawn } from "node:child_process";
import { rmSync } from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { originOf, SERVER_DIR, serverEnv } from "../playwright.config";

// The server's command line, as its operator uses it on the machine, and a
// second server for what only a new one shows: its setup link.

const CARGO = [
  "run",
  "--quiet",
  "--manifest-path",
  path.join(SERVER_DIR, "Cargo.toml"),
  "--",
];

/** `seedling …` on the database of the running server; what it prints on
 * standard output. */
export function seedling(...args: string[]): string {
  return execFileSync("cargo", [...CARGO, ...args], {
    encoding: "utf8",
    env: { ...process.env, ...serverEnv() },
    stdio: ["ignore", "pipe", "ignore"],
  });
}

/** Makes the signed-in account of `page` an administrator, the way the
 * operator of a server that has accounts does: a link from the machine. */
export function administratorLink(): string {
  const address = seedling("admin", "link").trim();
  if (!/\/admin\/claim\/#link=\S+$/.test(address)) {
    throw new Error(`seedling admin link printed: ${address}`);
  }
  return address;
}

export interface NewServer {
  origin: string;
  /** The address the server printed for its first administrator. */
  setupLink: string;
  stop(): Promise<void>;
}

function listening(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host: "127.0.0.1" });
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
  });
}

/** Starts a server that has never run, on its own database, and reads the
 * setup link from what it prints. */
export async function startNewServer(
  port: number,
  settings: Record<string, string> = {},
): Promise<NewServer> {
  const database = path.join(os.tmpdir(), `brigid-e2e-new-${Date.now()}.db`);
  const child: ChildProcess = spawn("cargo", CARGO.slice(0, -1), {
    env: { ...process.env, ...serverEnv(port, database), ...settings },
    stdio: ["ignore", "ignore", "pipe"],
    // Its own process group: `cargo run` starts the server as a child, and
    // both are stopped together.
    detached: true,
  });
  let printed = "";
  child.stderr?.setEncoding("utf8");
  child.stderr?.on("data", (chunk: string) => {
    printed += chunk;
  });
  let exited = false;
  child.once("exit", () => {
    exited = true;
  });

  const stop = async () => {
    if (!exited && child.pid !== undefined) {
      try {
        process.kill(-child.pid, "SIGTERM");
      } catch {
        // Already gone.
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    for (const suffix of ["", "-wal", "-shm"]) {
      rmSync(database + suffix, { force: true });
    }
  };

  const deadline = Date.now() + 120_000;
  for (;;) {
    const link = /(\S+\/setup\/#link=\S+)/.exec(printed)?.[1];
    // oxlint-disable-next-line no-await-in-loop -- polling a process
    if (link && (await listening(port))) {
      return { origin: originOf(port), setupLink: link, stop };
    }
    if (exited || Date.now() > deadline) {
      // oxlint-disable-next-line no-await-in-loop -- on the way out
      await stop();
      throw new Error(`the new server did not start:\n${printed}`);
    }
    // oxlint-disable-next-line no-await-in-loop -- polling a process
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
}
