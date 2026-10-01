"use client";

import { useState } from "react";
import { BackLink } from "@/components/patterns/back-link";
import { PopIn } from "@/app/(flow)/_components/pop-in";
import { routes } from "@/lib/auth/rules";
import type { CurrencyCode } from "@/lib/currency";
import type { GroupSummary } from "@/lib/groups/queries";
import type { ScanQuota } from "@/lib/scans/quota";
import { newBillCopy } from "../_data";
import { GroupChips } from "./group-chips";
import { QuotaChip } from "./quota-chip";
import { quotaExhausted } from "../_lib/phase";
import { ScanScreen } from "./scan-screen";
import { TellBrunoCard } from "./tell-bruno-card";
import { TypeItInCard } from "./type-it-in-card";

export interface NewBillEntryProps {
  groups: readonly GroupSummary[];
  selectedId: string;
  currency: CurrencyCode;
  configured: boolean;
  tellConfigured: boolean;
  quota: ScanQuota;
}

export function NewBillEntry({ groups, selectedId, currency, configured, tellConfigured, quota: initialQuota }: NewBillEntryProps) {
  const copy = newBillCopy.entry;
  const [quota, setQuota] = useState(initialQuota);
  return (
    <div className="grid gap-6 px-5 pt-5 pb-10">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <BackLink href={routes.app} label={copy.back} />
        {(configured || tellConfigured) && (
          <PopIn popKey={quota.left}>
            <QuotaChip quota={quota} />
          </PopIn>
        )}
      </div>
      <div className="grid gap-1.5">
        <h1 className="m-0 text-heading">{copy.title}</h1>
        <p className="m-0 text-text-2">{copy.body}</p>
      </div>
      <GroupChips groups={groups} selectedId={selectedId} />
      <ScanScreen key={selectedId} groupId={selectedId} currency={currency} configured={configured} quota={quota} onQuota={setQuota}>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))] gap-3">
          {tellConfigured && <TellBrunoCard href={routes.tellBill(selectedId)} locked={quotaExhausted(quota)} />}
          <TypeItInCard href={routes.manualBill(selectedId)} />
        </div>
      </ScanScreen>
    </div>
  );
}
