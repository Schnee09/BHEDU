export default function Empty({
  title = "No data",
  description,
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="text-center py-12 text-gray-600 dark:text-gray-400">
      <p className="text-lg font-medium text-gray-900 dark:text-gray-100">{title}</p>
      {description && <p className="text-sm mt-1 text-gray-600 dark:text-gray-400">{description}</p>}
    </div>
  );
}
