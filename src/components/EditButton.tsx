import type { JSX } from "solid-js"

export default function EditButton(props: { noteId?: number; children: JSX.Element }) {
  const isDraft = !("noteId" in props)
  return (
    <a
      href={!isDraft ? `/notes/${props.noteId}/edit` : `/new`}
      class={["edit-button", isDraft ? "edit-button--solid" : "edit-button--outline"].join(" ")}
      role="menuitem"
    >
      {props.children}
    </a>
  )
}
