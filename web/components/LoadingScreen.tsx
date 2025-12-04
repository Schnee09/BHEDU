// web/components/LoadingScreen.tsx
export default function LoadingScreen({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          {/* Outer spinning ring */}
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-amber-500" />
          {/* Inner pulsing circle */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="h-8 w-8 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-full animate-pulse shadow-lg shadow-amber-500/50" />
          </div>
        </div>
        <div className="text-stone-700 font-medium text-lg">{message}</div>
      </div>
    </div>
  );
}
