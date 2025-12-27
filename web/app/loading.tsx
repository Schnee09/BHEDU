import { SkeletonCard, SkeletonList } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <div className="p-6 space-y-6 animate-fade-in">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <div className="h-8 w-48 bg-surface-secondary/50 rounded-lg animate-pulse mb-2" />
                    <div className="h-4 w-32 bg-surface-secondary/30 rounded-lg animate-pulse" />
                </div>
                <div className="h-10 w-10 rounded-full bg-surface-secondary/50 animate-pulse" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
            </div>

            <div className="mt-8">
                <SkeletonList items={5} />
            </div>
        </div>
    );
}
