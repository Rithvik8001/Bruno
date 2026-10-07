"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/icons/icon";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth/client";
import { routes } from "@/lib/auth/rules";
import { disablePush } from "@/lib/push/client";
import { settingsCopy } from "../_data";

export function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const signOut = async () => {
    setLoading(true);
    await disablePush().catch(() => undefined);
    await authClient.signOut();
    router.replace(routes.home);
    router.refresh();
  };

  return (
    <button
      type="button"
      disabled={loading}
      onClick={signOut}
      className="flex min-h-14 w-full cursor-pointer items-center justify-between bg-transparent text-left font-medium disabled:cursor-default"
    >
      {settingsCopy.signOut}
      {loading ? <Spinner /> : <Icon name="chevron-right" size={18} className="text-muted" />}
    </button>
  );
}
