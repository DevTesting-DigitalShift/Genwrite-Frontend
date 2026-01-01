import { Node, mergeAttributes } from "@tiptap/core"

export const Iframe = Node.create({
  name: "iframe",

  group: "block",

  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      title: {
        default: null,
      },
      frameborder: {
        default: "0",
      },
      allow: {
        default:
          "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
      },
      allowfullscreen: {
        default: true,
      },
      class: {
        default: "youtube-embed w-full aspect-video rounded-lg my-4",
      },
      "data-embed-type": {
        default: "youtube",
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: "iframe",
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ["iframe", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)]
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      const container = document.createElement("div")
      container.className = "embed-wrapper relative group my-4"

      const iframe = document.createElement("iframe")
      iframe.src = node.attrs.src
      iframe.title = node.attrs.title || "Embedded video"
      iframe.frameBorder = "0"
      iframe.allow = node.attrs.allow
      iframe.allowFullscreen = true
      iframe.className = "youtube-embed w-full aspect-video rounded-lg"

      // Control overlay for edit/delete
      const overlay = document.createElement("div")
      overlay.className =
        "absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100"
      overlay.contentEditable = "false"

      const buttonContainer = document.createElement("div")
      buttonContainer.className = "flex gap-2"

      // Delete button
      const deleteBtn = document.createElement("button")
      deleteBtn.className =
        "px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 flex items-center gap-1 shadow-lg"
      deleteBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg> Remove`
      deleteBtn.onclick = e => {
        e.preventDefault()
        e.stopPropagation()
        if (typeof getPos === "function") {
          editor
            .chain()
            .focus()
            .deleteRange({ from: getPos(), to: getPos() + node.nodeSize })
            .run()
        }
      }

      buttonContainer.appendChild(deleteBtn)
      overlay.appendChild(buttonContainer)

      container.appendChild(iframe)
      container.appendChild(overlay)

      // Title display
      if (node.attrs.title) {
        const titleEl = document.createElement("p")
        titleEl.className = "text-sm text-gray-600 mt-2 font-medium"
        titleEl.textContent = node.attrs.title
        container.appendChild(titleEl)
      }

      return {
        dom: container,
        contentDOM: null,
        update: updatedNode => {
          if (updatedNode.type.name !== "iframe") return false
          iframe.src = updatedNode.attrs.src
          iframe.title = updatedNode.attrs.title || "Embedded video"
          return true
        },
      }
    }
  },

  addCommands() {
    return {
      setIframe:
        options =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          })
        },
    }
  },
})

export default Iframe
