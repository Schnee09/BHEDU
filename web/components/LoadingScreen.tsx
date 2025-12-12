// web/components/LoadingScreen.tsx
export default function LoadingScreen({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          {/* Outer spinning ring - Light: Primary green, Dark: Cyan */}
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary 
            dark:border-primary dark:shadow-[0_0_20px_rgba(6,182,212,0.4)]" />
          {/* Inner pulsing circle */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="h-8 w-8 rounded-full animate-pulse
              bg-gradient-to-br from-primary/60 to-primary shadow-lg shadow-primary/30
              dark:from-primary/40 dark:to-primary dark:shadow-primary/50" />
          </div>
        </div>
        <div className="text-muted font-medium text-lg">{message}</div>
      </div>
    </div>
  );
}
