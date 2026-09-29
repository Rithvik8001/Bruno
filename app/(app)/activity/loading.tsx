import { ListRowSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function ActivityLoading() {
  return (
    <div aria-busy className="grid gap-6 px-5 pt-7 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Skeleton className="my-1 h-6.5 w-32 rounded-sm" />
        <Skeleton className="h-10 w-56 rounded-control bg-surface" />
      </div>
      <div className="grid gap-1.5">
        <Skeleton className="mx-1 h-3 w-16" />
        <ListRowSkeleton titleWidth="55%" captionWidth="30%" />
        <ListRowSkeleton titleWidth="45%" captionWidth="25%" />
        <ListRowSkeleton titleWidth="60%" captionWidth="35%" />
      </div>
    </div>
  );
}
