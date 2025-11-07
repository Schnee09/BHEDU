// web/components/LoadingScreen.tsx
export default function LoadingScreen({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600" />
        <div className="text-gray-600">{message}</div>
      </div>
    </div>
  );
}
