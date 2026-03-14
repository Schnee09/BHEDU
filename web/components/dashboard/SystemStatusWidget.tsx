import { cn } from "@/lib/utils";

export function SystemStatusWidget() {
    return (
        <div className="hidden xl:block bg-stone-900 dark:bg-black p-10 rounded-[40px] border border-stone-800 shadow-2xl relative overflow-hidden group">
            {/* Status Glow */}
            <div className="absolute top-[-20%] right-[-20%] w-64 h-64 bg-green-500/10 blur-[100px] rounded-full group-hover:bg-green-500/20 transition-all duration-700" />

            <h4 className="text-[10px] font-bold text-stone-500 uppercase tracking-[0.25em] mb-10 flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                Trạng thái hệ thống
            </h4>
            <div className="space-y-8">
                <StatusItem label="Database Engine" status="online" />
                <StatusItem label="Authentication" status="online" />
                <StatusItem label="Storage Cluster" status="online" />
                <StatusItem label="Edge Functions" status="online" />
            </div>
            <div className="mt-12 pt-8 border-t border-stone-800">
                <p className="text-[10px] text-stone-600 font-bold uppercase tracking-[0.2em] text-center italic opacity-60">Hệ thống đang hoạt động ổn định</p>
            </div>
        </div>
    );
}

function StatusItem({ label, status }: { label: string, status: 'online' | 'offline' }) {
    const isOnline = status === 'online';

    return (
        <div className="flex items-center justify-between group cursor-default">
            <span className="text-xs font-bold text-stone-400 group-hover:text-white transition-colors tracking-tight">{label}</span>
            <div className="flex items-center gap-3">
                <span className={cn(
                    "text-[9px] font-bold uppercase tracking-widest transition-colors",
                    isOnline ? "text-stone-600 opacity-60" : "text-red-500/80"
                )}>{status}</span>
                <div className={cn(
                    "w-2 h-2 rounded-full transition-all group-hover:scale-125",
                    isOnline
                        ? "bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.6)]"
                        : "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.6)]"
                )} />
            </div>
        </div>
    );
}
