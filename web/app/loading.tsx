export default function Loading() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-stone-50 dark:bg-stone-950">
            <div className="space-y-8 flex flex-col items-center">
                {/* Animated Brand Loader */}
                <div className="relative">
                    <div className="absolute inset-0 bg-amber-500/30 blur-3xl rounded-full animate-pulse" />
                    <div className="relative w-20 h-20 bg-white dark:bg-stone-900 rounded-[28px] shadow-2xl border border-stone-200 dark:border-white/5 flex items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 to-transparent" />
                        <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
                    </div>
                </div>

                <div className="space-y-3 text-center">
                    <div className="h-6 w-48 bg-stone-200 dark:bg-stone-800 rounded-lg animate-pulse mx-auto" />
                    <div className="h-4 w-64 bg-stone-100 dark:bg-stone-900 rounded-md animate-pulse mx-auto" />
                </div>
            </div>
        </div>
    );
}
