export default function Badge({
  children,
  color = "gray",
}: {
  children: React.ReactNode;
  color?: "gray" | "blue" | "green" | "red" | "purple" | "yellow";
}) {
  const map: Record<string, string> = {
    gray: "bg-gray-100 text-gray-700",
    blue: "bg-blue-100 text-blue-700",
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
    purple: "bg-purple-100 text-purple-700",
    yellow: "bg-yellow-100 text-yellow-700",
  };
  return (
    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${map[color]}`}>{children}</span>
  );
}
