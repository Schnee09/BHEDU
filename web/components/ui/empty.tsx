export default function Empty({
  title = "No data",
  description,
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="text-center py-12 text-gray-500">
      <p className="text-lg font-medium">{title}</p>
      {description && <p className="text-sm mt-1">{description}</p>}
    </div>
  );
}
