import React from "react"
import { Modal, Button, message } from "antd"
import { FAQBlock, SectionData } from "./EditorTypes"

interface Props {
  sections: SectionData[]
  faq: FAQBlock | null
  onClose: () => void
}

export default function PreviewModal({ sections, faq, onClose }: Props) {
  // Collect final combined HTML to copy
  const buildFullHTML = () => {
    let html = ""

    sections.forEach(sec => {
      html += `<h2>${sec.title}</h2>\n${sec.content}\n\n`
    })

    if (faq) {
      html += `<h2>${faq.heading}</h2>`
      faq.qa.forEach(q => {
        html += `<h3>${q.question}</h3><p>${q.answer}</p>\n`
      })
    }

    return html
  }

  const copyContent = async () => {
    try {
      await navigator.clipboard.writeText(buildFullHTML())
      message.success("Copied full preview to clipboard!")
    } catch (err) {
      message.error("Failed to copy.")
    }
  }

  return (
    <Modal
      open={true}
      onCancel={onClose}
      footer={null}
      width={800}
      centered
      title={
        <div className="flex justify-between items-center w-full">
          <span className="text-xl font-bold">Preview</span>
          <Button type="primary" onClick={copyContent}>
            Copy All
          </Button>
        </div>
      }
    >
      <div className="max-h-[70vh] overflow-y-auto px-2">
        {sections.map((sec: SectionData, i: number) => (
          <div key={i} className="mb-10">
            <h2 className="text-2xl font-bold">{sec.title}</h2>

            <div className="prose mt-4" dangerouslySetInnerHTML={{ __html: sec.content }} />
          </div>
        ))}

        {faq && (
          <div className="mt-10">
            <h2 className="text-2xl font-bold">{faq.heading}</h2>

            {faq.qa.map((item, i) => (
              <div key={i} className="mt-4">
                <h3 className="font-semibold">{item.question}</h3>
                <p className="text-gray-700">{item.answer}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}
