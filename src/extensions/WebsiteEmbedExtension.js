import { Node, mergeAttributes } from "@tiptap/core"

export const WebsiteEmbed = Node.create({
  name: "websiteEmbed",

  group: "block",

  atom: true,

  addAttributes() {
    return {
      href: {
        default: null,
      },
      title: {
        default: null,
      },
      class: {
        default:
          "website-embed block p-4 border border-gray-200 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 my-4 hover:border-blue-300 transition-colors",
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-embed-type="website"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes({ "data-embed-type": "website" }, HTMLAttributes),
      [
        "a",
        {
          href: HTMLAttributes.href,
          target: "_blank",
          rel: "noopener noreferrer",
          class: "flex items-center gap-3 text-blue-700 no-underline",
        },
        ["span"],
        ["span", { class: "font-medium" }, HTMLAttributes.title || HTMLAttributes.href],
      ],
    ]
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      const container = document.createElement("div")
      container.className = "website-embed-wrapper relative group my-4"

      const linkCard = document.createElement("a")
      linkCard.href = node.attrs.href
      linkCard.target = "_blank"
      linkCard.rel = "noopener noreferrer"
      linkCard.className =
        "block p-4 border border-gray-200 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 hover:border-blue-300 transition-colors no-underline"

      const content = document.createElement("div")
      content.className = "flex items-center gap-3"

      const iconWrapper = document.createElement("span")
      const textWrapper = document.createElement("div")
      textWrapper.className = "min-w-0"

      const title = document.createElement("span")
      title.className = "font-medium text-blue-700 block truncate"
      title.textContent = node.attrs.title || node.attrs.href

      const url = document.createElement("span")
      url.className = "text-xs text-gray-500 block truncate"
      url.textContent = node.attrs.href

      textWrapper.appendChild(title)
      textWrapper.appendChild(url)
      content.appendChild(iconWrapper)
      content.appendChild(textWrapper)
      linkCard.appendChild(content)

      // Control overlay for delete
      const overlay = document.createElement("div")
      overlay.className =
        "absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
      overlay.contentEditable = "false"

      const deleteBtn = document.createElement("button")
      deleteBtn.className =
        "p-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 shadow-lg"
      deleteBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>`
      deleteBtn.title = "Remove"
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

      overlay.appendChild(deleteBtn)
      container.appendChild(linkCard)
      container.appendChild(overlay)

      return {
        dom: container,
        contentDOM: null,
        update: updatedNode => {
          if (updatedNode.type.name !== "websiteEmbed") return false
          linkCard.href = updatedNode.attrs.href
          title.textContent = updatedNode.attrs.title || updatedNode.attrs.href
          url.textContent = updatedNode.attrs.href
          return true
        },
      }
    }
  },

  addCommands() {
    return {
      setWebsiteEmbed:
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

export default WebsiteEmbed
