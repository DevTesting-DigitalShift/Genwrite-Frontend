import React from "react"
import { RotateCcw, Trash2 } from "lucide-react"
import RichTextEditor from "./RichTextEditor"
import { SectionData, SectionWithReveal } from "./EditorTypes"

interface Props {
  index: number
  section: SectionWithReveal
  locked: boolean
  onReveal: () => void
  onDelete: () => void
  onRegenerate: () => void
  onChange: (updated: SectionData) => void
  isEditing: boolean
  onStartEditing: () => void
  onStopEditing: () => void
}

export default function SectionItem({
  section,
  onReveal,
  onDelete,
  onRegenerate,
  onChange,
  isEditing,
  onStartEditing,
}: Props) {
  const openEditor = () => {
    if (!section.revealed) onReveal()
    onStartEditing()
  }

  return (
    <div className="relative border rounded-xl p-5 shadow-sm" onClick={openEditor}>
      {/* Actions */}
      <div className="absolute top-3 right-3 flex gap-3">
        {section.revealed && (
          <button
            onClick={e => {
              e.stopPropagation()
              onRegenerate()
            }}
          >
            <RotateCcw className="w-5 h-5 text-gray-500" />
          </button>
        )}

        <button
          onClick={e => {
            e.stopPropagation()
            onDelete()
          }}
        >
          <Trash2 className="w-5 h-5 text-red-500" />
        </button>
      </div>

      {/* Title */}
      <h2 className="text-xl font-bold mb-2">{section.title}</h2>
      <p className="text-gray-600 text-sm mb-2">{section.summary}</p>

      {/* Keywords */}
      <div className="flex gap-2 flex-wrap mb-4">
        {section.keywords.map((kw: string, i: number) => (
          <span key={i} className="px-2 py-1 bg-blue-100 rounded-md text-xs">
            #{kw}
          </span>
        ))}
      </div>

      {/* Content Viewer — hidden when editing */}
      {!isEditing && (
        <div
          className={`prose max-w-none mb-10 ${
            section.revealed ? "" : "blur-sm pointer-events-none"
          }`}
          dangerouslySetInnerHTML={{ __html: section.content }}
        />
      )}

      {/* Editor — shows only for active index */}
      {section.revealed && isEditing && (
        <div className="mt-3" onClick={e => e.stopPropagation()}>
          <RichTextEditor
            initialContent={section.content}
            onChange={(html: string) => onChange({ ...section, content: html })}
          />
        </div>
      )}
    </div>
  )
}
