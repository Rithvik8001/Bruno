"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";
import { routes } from "@/lib/auth/rules";

export function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const signOut = async () => {
    setLoading(true);
    await authClient.signOut();
    router.replace(routes.home);
    router.refresh();
  };

  return (
    <Button variant="secondary" loading={loading} onClick={signOut}>
      Sign out
    </Button>
  );
}
