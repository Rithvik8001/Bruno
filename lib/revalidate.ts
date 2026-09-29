import "server-only";
import { revalidatePath } from "next/cache";
import { routes } from "@/lib/auth/rules";

export function refreshGroup(groupId: string): void {
  revalidatePath(routes.group(groupId));
  revalidatePath(routes.groups);
  revalidatePath(routes.app);
  revalidatePath(routes.activity);
  revalidatePath("/bills/[slug]", "page");
  revalidatePath("/groups/[groupId]/settle/[personId]", "page");
}
