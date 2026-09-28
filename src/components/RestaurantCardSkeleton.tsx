export default function RestaurantCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-card animate-pulse" aria-hidden="true">
      <div className="aspect-[4/3] bg-cream-2" />
      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="h-4 w-2/5 rounded-full bg-cream-2" />
          <div className="h-3.5 w-8 rounded-full bg-cream-2" />
        </div>
        <div className="mt-3 h-3 w-full rounded-full bg-cream-2" />
        <div className="mt-2 h-3 w-4/5 rounded-full bg-cream-2" />
        <div className="mt-4 flex items-center justify-between">
          <div className="h-3 w-1/4 rounded-full bg-cream-2" />
          <div className="h-3 w-12 rounded-full bg-cream-2" />
        </div>
      </div>
    </div>
  )
}
