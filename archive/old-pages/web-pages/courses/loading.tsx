export default function LoadingAdminCourses() {
  return (
    <main className="p-6 max-w-4xl mx-auto space-y-8 animate-pulse">
      <div className="h-7 w-64 bg-gray-200 rounded" />

      <section className="p-4 border rounded space-y-3">
        <div className="h-5 w-40 bg-gray-200 rounded" />
        <div className="h-9 w-full bg-gray-200 rounded" />
        <div className="h-9 w-full bg-gray-200 rounded" />
        <div className="h-9 w-40 bg-gray-200 rounded" />
      </section>

      <section className="p-4 border rounded space-y-3">
        <div className="h-5 w-40 bg-gray-200 rounded" />
        <div className="h-9 w-full bg-gray-200 rounded" />
        <div className="h-9 w-full bg-gray-200 rounded" />
        <div className="h-9 w-40 bg-gray-200 rounded" />
      </section>

      <section className="p-4 border rounded space-y-3">
        <div className="h-5 w-24 bg-gray-200 rounded" />
        <ul className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className="border rounded p-3 space-y-2">
              <div className="h-4 w-64 bg-gray-200 rounded" />
              <div className="h-3 w-80 bg-gray-100 rounded" />
              <div className="h-24 w-full bg-gray-50 rounded" />
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
