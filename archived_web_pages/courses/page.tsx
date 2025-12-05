import { createCourse, createLesson, getCoursesAndLessons, editCourse, deleteCourse, editLesson, deleteLesson } from './actions'
import { adminAuth } from '@/lib/auth/adminAuth'
import { SubmitButton } from '@/components/SubmitButton'
import ConfirmSubmitButton from '@/components/ConfirmSubmitButton'

export const dynamic = 'force-dynamic'

export default async function AdminCoursesPage() {
  await adminAuth()
  const { courses, lessonsByCourse } = await getCoursesAndLessons()

  return (
    <main className="p-6 max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-semibold">Admin • Courses & Lessons</h1>

      <section className="p-4 border rounded space-y-3">
        <h2 className="font-medium">Create Course</h2>
        <form action={createCourse} className="flex flex-col gap-2">
          <input name="title" placeholder="Course title" className="border rounded px-3 py-2" />
          <input name="description" placeholder="Description (optional)" className="border rounded px-3 py-2" />
          <SubmitButton label="Create Course" pendingLabel="Creating..." variant="primary" />
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
          <SubmitButton label="Create Lesson" pendingLabel="Creating..." variant="success" />
        </form>
      </section>

      <section className="p-4 border rounded">
        <h2 className="font-medium mb-3">Courses</h2>
        {courses.length === 0 && <p className="text-sm text-gray-500">No courses yet.</p>}
        <ul className="space-y-3">
          {courses.map(c => (
            <li key={c.id} className="border rounded p-3 space-y-2">
              <div className="font-medium">{c.title}</div>
              <div className="text-sm text-gray-500">{c.description || 'No description'}</div>
              <details className="border rounded p-2 bg-gray-50">
                <summary className="cursor-pointer text-sm font-semibold">Edit Course</summary>
                <form action={editCourse} className="mt-2 flex flex-col gap-2">
                  <input type="hidden" name="course_id" value={c.id} />
                  <input name="title" defaultValue={c.title} className="border rounded px-2 py-1" />
                  <input name="description" defaultValue={c.description || ''} className="border rounded px-2 py-1" />
                  <label className="inline-flex items-center gap-2 text-xs">
                    <input type="checkbox" name="is_published" defaultChecked={true} /> Published
                  </label>
                  <div className="flex gap-2">
                    <SubmitButton label="Save" pendingLabel="Saving..." variant="warning" />
                    <ConfirmSubmitButton label="Delete" />
                    <input type="hidden" name="course_id" value={c.id} />
                    <button hidden formAction={deleteCourse} />
                  </div>
                </form>
              </details>
              <div className="mt-2">
                <strong className="text-sm">Lessons:</strong>
                <ul className="list-disc pl-5 text-sm">
                  {(lessonsByCourse[c.id] || []).map((l) => {
                    const lessonId = String(l.id || '');
                    const lessonTitle = String(l.title || '');
                    const lessonContent = String(l.content || '');
                    const lessonOrder = Number(l.order_index ?? 0);
                    const lessonPublished = Boolean(l.is_published);
                    
                    return (
                    <li key={lessonId} className="space-y-1">
                      <div>{lessonOrder}. {lessonTitle}</div>
                      <details className="border rounded p-2 bg-gray-50">
                        <summary className="cursor-pointer text-xs font-semibold">Edit Lesson</summary>
                        <form action={editLesson} className="mt-2 flex flex-col gap-2">
                          <input type="hidden" name="lesson_id" value={lessonId} />
                          <input name="lesson_title" defaultValue={lessonTitle} className="border rounded px-2 py-1" />
                          <input name="content" defaultValue={lessonContent} className="border rounded px-2 py-1" />
                          <input name="order_index" defaultValue={lessonOrder} type="number" className="border rounded px-2 py-1" />
                          <label className="inline-flex items-center gap-2 text-xs">
                            <input type="checkbox" name="is_published" defaultChecked={lessonPublished} /> Published
                          </label>
                          <div className="flex gap-2">
                            <SubmitButton label="Save" pendingLabel="Saving..." variant="warning" />
                            <ConfirmSubmitButton label="Delete" />
                            <input type="hidden" name="lesson_id" value={lessonId} />
                            <button hidden formAction={deleteLesson} />
                          </div>
                        </form>
                      </details>
                    </li>
                    );
                  })}
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
