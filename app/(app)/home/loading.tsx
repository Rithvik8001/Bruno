import { HomeSkeleton } from "./_components/home-states";

export default function HomeLoading() {
  return (
    <div className="grid gap-8 px-5 pt-7 pb-10">
      <HomeSkeleton />
    </div>
  );
}
