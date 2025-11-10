import { Node, mergeAttributes } from "@tiptap/core"

export const Iframe = Node.create({
  name: "iframe",
  group: "block",
  atom: true, // treat as a single unit
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      title: { default: null },
      frameborder: { default: "0" },
      allowfullscreen: { default: true },
      style: { default: "width:100%; aspect-ratio:16/9; border-radius:8px;" },
    }
  },

  parseHTML() {
    return [{ tag: "iframe" }]
  },

  renderHTML({ HTMLAttributes }) {
    return ["iframe", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)]
  },
})
