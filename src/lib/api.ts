import { action, cache, redirect } from "@solidjs/router"
import { format, isToday } from "date-fns"
import { marked } from "marked"
import { z } from "vinxi"
import { storage } from "./db"

export const noteIdSchema = z.coerce.number().min(0).int()

export type Note = {
  id: number;
  title: string;
  body: string;
  updatedAt: string;
}

export const getNotes = cache(async (searchText: string) => {
  "use server"
  return (((await storage.getItem("notes:data")) as Note[]) || [])
  .filter(note => !searchText || note.title.toLowerCase().includes(searchText.toLowerCase()))
  .map(note => {
    const updatedAt = new Date(note.updatedAt)
    return {
      ...note,
      updatedAt: isToday(updatedAt) ? format(updatedAt, "h:mm bb") : format(updatedAt, "M/d/yy"),
    }
  })
}, "notes")

export const getNote = cache(async (unsafeId: undefined|number|string) => {
  "use server"
  // runtime validation
  if (!unsafeId) return
  const parsing = noteIdSchema.safeParse(unsafeId)
  if (!parsing.success) return
  const id = parsing.data
  //
  return (((await storage.getItem("notes:data")) as Note[]) || []).find(note => note.id === id)
}, "note")

export const getNotePreview = cache(async (unsafeId: undefined|number|string) => {
  "use server"
  // runtime validation
  if (!unsafeId) return
  const parsing = noteIdSchema.safeParse(unsafeId)
  if (!parsing.success) return
  const id = parsing.data
  //
  const note = (((await storage.getItem("notes:data")) as Note[]) || []).find(
    note => note.id === id,
  )
  if (!note) return
  note.body = await marked(note.body)
  note.updatedAt = format(new Date(note.updatedAt), "d MMM yyyy 'at' h:mm bb")
  return note
}, "note-preview")

export const saveNote = action(async (unsafeId: number | string | undefined, formData: FormData) => {
  "use server"
  // runtime validation
  if (!unsafeId) return
  const parsing = noteIdSchema.safeParse(unsafeId)
  if (!parsing.success) return
  const id = parsing.data
  //
  const title = formData.get("title") as string
  const body = formData.get("body") as string
  let [{ value: notes }, { value: index }] = (await storage.getItems([
    "notes:data",
    "notes:counter",
  ])) as [{ key: string; value: Note[] }, { key: string; value: number }]
  // default value for first write
  notes = notes || []
  index = index || 0

  if (id == undefined) {
    await Promise.all([
      storage.setItem("notes:data", [
        ...notes,
        { id: index, title, body, updatedAt: new Date().toISOString() },
      ]),
      storage.setItem("notes:counter", index + 1),
    ])
    return redirect(`/notes/${index}`)
  }
  await storage.setItem(
    "notes:data",
    notes.map(note => {
      if (note.id !== id) return note
      return { id, title, body, updatedAt: new Date().toISOString() }
    }),
  )
  return redirect(`/notes/${id}`)
})

export const deleteNote = action(async (unsafeId: number|string) => {
  "use server"
  // runtime validation
  if (!unsafeId) return
  const parsing = noteIdSchema.safeParse(unsafeId)
  if (!parsing.success) return
  //
  const id = parsing.data
  const notes = (await storage.getItem("notes:data")) as Note[]
  await storage.setItem(
    "notes:data",
    notes.filter(note => note.id !== id),
  )
})
