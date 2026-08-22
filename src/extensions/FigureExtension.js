import { Node, mergeAttributes } from "@tiptap/core"

export const Figure = Node.create({
  name: "figure",

  group: "block",

  content: "block+",

  draggable: true,

  parseHTML() {
    return [{ tag: "figure" }]
  },

  renderHTML({ HTMLAttributes }) {
    return ["figure", mergeAttributes(HTMLAttributes), 0]
  },
})

export const FigCaption = Node.create({
  name: "figcaption",

  group: "block",

  content: "paragraph+", // Usually contains a paragraph with the link

  parseHTML() {
    return [{ tag: "figcaption" }]
  },

  renderHTML({ HTMLAttributes }) {
    return ["figcaption", mergeAttributes(HTMLAttributes), 0]
  },
})
