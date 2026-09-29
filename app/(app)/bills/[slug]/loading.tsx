import { ListRowSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function BillLoading() {
  return (
    <div aria-busy className="grid gap-6 px-5 pt-5 pb-10">
      <Skeleton className="h-9 w-24 rounded-sm" />
      <div className="grid gap-2">
        <Skeleton className="h-8 w-1/2 rounded-sm" />
        <Skeleton className="h-5 w-1/3 rounded-sm" />
      </div>
      <div className="grid gap-2">
        <ListRowSkeleton titleWidth="40%" captionWidth="55%" />
        <ListRowSkeleton titleWidth="35%" captionWidth="45%" />
        <ListRowSkeleton titleWidth="45%" captionWidth="30%" />
      </div>
      <Skeleton className="h-64 animate-pulse-soft rounded-card bg-surface" />
    </div>
  );
}
