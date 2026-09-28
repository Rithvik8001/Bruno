import "server-only";
import { after } from "next/server";

export function runInBackground(label: string, task: () => Promise<void>): void {
  after(async () => {
    try {
      await task();
    } catch (error) {
      console.error(`[background] ${label} failed`, error);
    }
  });
}
