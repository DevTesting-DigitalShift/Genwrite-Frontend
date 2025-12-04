import React, { useState } from "react"
import SectionItem from "./SectionItem"
import PreviewModal from "./PreviewModal"
import { EditorDocument, UserPlan, FAQItem } from "./EditorTypes"
import showdown from "showdown"

interface Props {
  contentJSON: EditorDocument
  userPlan: UserPlan
}

export default function SectionList({ contentJSON, userPlan }: Props) {
  const [sections, setSections] = useState(
    contentJSON.sections.map(sec => ({
      ...sec,
      revealed: false,
      content: markdownToHtml(sec.content), // convert once
    }))
  )

  const [faqRevealed, setFaqRevealed] = useState(false)
  const [openPreview, setOpenPreview] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const handleReveal = (index: number) => {
    setSections(prev => prev.map((s, i) => (i === index ? { ...s, revealed: true } : s)))
  }

  const handleDelete = (index: number) => setSections(prev => prev.filter((_, i) => i !== index))

  const handleRegenerate = () => alert("Regenerate coming soon!")

  const revealedSections = sections.filter(s => s.revealed)

  return (
    <div className="max-w-3xl mx-auto py-10 space-y-10">
      <h1 className="text-3xl font-bold">{contentJSON.title}</h1>
      <p className="text-gray-600">{contentJSON.description}</p>

      {sections.map((section, i) => {
        const locked = userPlan === "free" && i > 1

        return (
          <SectionItem
            key={i}
            index={i}
            section={section}
            locked={locked}
            onReveal={() => handleReveal(i)}
            onDelete={() => handleDelete(i)}
            onRegenerate={() => handleRegenerate()}
            isEditing={editingIndex === i}
            onStartEditing={() => setEditingIndex(i)}
            onStopEditing={() => setEditingIndex(null)}
            onChange={updated =>
              setSections(prev => prev.map((s, idx) => (idx === i ? { ...s, ...updated } : s)))
            }
          />
        )
      })}

      {/* FAQ SECTION ------------------------------------------------ */}
      {contentJSON.faq && (
        <div
          className="border p-5 rounded-xl relative cursor-pointer"
          onClick={() => setFaqRevealed(true)}
        >
          {!faqRevealed && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 rounded-xl"></div>
          )}

          <h2 className="text-2xl font-bold">{contentJSON.faq.heading}</h2>

          <div className="space-y-6 mt-4">
            {contentJSON.faq.qa.map((item: FAQItem, i: number) => (
              <div key={i}>
                <h3 className="font-semibold">{item.question}</h3>
                <p className="text-gray-600 mt-1">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview Button */}
      <button
        className="w-full py-3 bg-black text-white rounded-lg font-semibold"
        onClick={() => setOpenPreview(true)}
      >
        Preview
      </button>

      {/* Modal */}
      {openPreview && (
        <PreviewModal
          sections={revealedSections}
          faq={faqRevealed ? contentJSON.faq : null}
          onClose={() => setOpenPreview(false)}
        />
      )}
    </div>
  )
}

/* Convert Markdown → HTML once */
function markdownToHtml(md: string) {
  const converter = new showdown.Converter()
  return converter.makeHtml(md)
}
