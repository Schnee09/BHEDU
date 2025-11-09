import { createCourse, createLesson, getCoursesAndLessons } from './actions'

export const dynamic = 'force-dynamic'

export default async function AdminCoursesPage() {
  const { courses, lessonsByCourse } = await getCoursesAndLessons()

  return (
    <main className="p-6 max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-semibold">Admin • Courses & Lessons</h1>

      <section className="p-4 border rounded space-y-3">
        <h2 className="font-medium">Create Course</h2>
        <form action={createCourse} className="flex flex-col gap-2">
          <input name="title" placeholder="Course title" className="border rounded px-3 py-2" />
          <input name="description" placeholder="Description (optional)" className="border rounded px-3 py-2" />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded w-max">Create Course</button>
        </form>
      </section>

      <section className="p-4 border rounded space-y-3">
        <h2 className="font-medium">Create Lesson</h2>
        <form action={createLesson} className="grid grid-cols-1 md:grid-cols-2 gap-2 items-start">
          <select name="course_id" className="border rounded px-3 py-2">
            <option value="">Select a course…</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
          <input name="lesson_title" placeholder="Lesson title" className="border rounded px-3 py-2" />
          <input name="content" placeholder="Content (optional)" className="border rounded px-3 py-2 md:col-span-2" />
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded w-max">Create Lesson</button>
        </form>
      </section>

      <section className="p-4 border rounded">
        <h2 className="font-medium mb-3">Courses</h2>
        {courses.length === 0 && <p className="text-sm text-gray-500">No courses yet.</p>}
        <ul className="space-y-3">
          {courses.map(c => (
            <li key={c.id} className="border rounded p-3">
              <div className="font-medium">{c.title}</div>
              <div className="text-sm text-gray-500">{c.description || '—'}</div>
              <div className="mt-2">
                <strong className="text-sm">Lessons:</strong>
                <ul className="list-disc pl-5 text-sm">
                  {(lessonsByCourse[c.id] || []).map((l: any) => (
                    <li key={l.id}>{l.order_index ?? 0}. {l.title}</li>
                  ))}
                  {(!lessonsByCourse[c.id] || lessonsByCourse[c.id].length === 0) && (
                    <li className="text-gray-400">No lessons yet.</li>
                  )}
                </ul>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
