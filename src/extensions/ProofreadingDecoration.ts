import { Extension } from "@tiptap/core"
import { Plugin, PluginKey } from "@tiptap/pm/state"
import { Decoration, DecorationSet } from "@tiptap/pm/view"

export const proofreadingPluginKey = new PluginKey("proofreading")

export const ProofreadingDecoration = Extension.create({
  name: "proofreadingDecoration",

  addOptions() {
    return {
      suggestions: [], // should be [{ original: '', change: '' }]
    }
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: proofreadingPluginKey,
        props: {
          decorations: (state) => {
            const decorations = []
            const { doc } = state
            const suggestions = this.options.suggestions

            doc.descendants((node, pos) => {
              if (!node.isText) return

              const text = node.text || ""

              suggestions.forEach(({ original, change }) => {
                let start = 0
                while (start < text.length) {
                  const index = text.indexOf(original, start)
                  if (index === -1) break

                  const from = pos + index
                  const to = from + original.length

                  decorations.push(
                    Decoration.inline(from, to, {
                      class: "proofreading-mark",
                      nodeName: "span",
                      "data-original": original,
                      "data-suggestion": change,
                      "data-from": from,
                      "data-to": to,
                    })
                  )

                  start = index + original.length
                }
              })
            })

            return DecorationSet.create(doc, decorations)
          },
        },
      }),
    ]
  },
})
