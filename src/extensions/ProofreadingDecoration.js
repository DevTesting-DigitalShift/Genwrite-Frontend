import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Extension } from '@tiptap/core'

export const proofreadingPluginKey = new PluginKey('proofreading')

export const ProofreadingDecoration = Extension.create({
  name: 'proofreadingDecoration',

  addOptions() {
    return {
      suggestions: [],
    }
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: proofreadingPluginKey,
        props: {
          decorations: (state) => {
            const decorations = []
            const docText = state.doc.textContent

            this.options.suggestions.forEach((suggestion) => {
              const original = suggestion.original
              const startIndex = docText.indexOf(original)

              if (startIndex !== -1) {
                const from = startIndex
                const to = startIndex + original.length

                decorations.push(
                  Decoration.inline(from, to, {
                    class: 'proofreading-underline',
                    nodeName: 'span',
                    'data-original': original,
                    'data-suggestion': suggestion.change,
                  })
                )
              }
            })

            return DecorationSet.create(state.doc, decorations)
          },
        },
      }),
    ]
  },
})
