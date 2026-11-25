import { readFileSync } from "fs";
import { stripAnsi } from "./ansi";
import { writePrivateFileAtomicSync } from "./atomic-file";

export const TELEGRAM_CONNECT_COMMAND = "telegram-connect";

export function telegramBridgeEnabled(): boolean {
  return Boolean(process.env.STORM_TELEGRAM_SESSION_POINTER);
}

export function isClassicTelegramConnected(status: string | undefined): boolean {
  // pi-telegram's session-local status bar; an optional +N is its queue count.
  return status !== undefined && /^telegram connected(?: \+\d+)?$/.test(stripAnsi(status).trim());
}

export function rememberTelegramSession(sessionId: string): void {
  const path = process.env.STORM_TELEGRAM_SESSION_POINTER;
  if (!path) return;
  try {
    if (readFileSync(path, "utf8").trim() === sessionId) return;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  writePrivateFileAtomicSync(path, `${sessionId}\n`);
}
