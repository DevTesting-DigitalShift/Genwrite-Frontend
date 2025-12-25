import { Node, mergeAttributes } from "@tiptap/core"

export const VideoEmbed = Node.create({
  name: "videoEmbed",

  group: "block",

  atom: true,

  selectable: true,

  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      title: {
        default: null,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: "div.section-iframe-wrapper",
        getAttrs: node => {
          if (typeof node === "string") return false
          const iframe = node.querySelector("iframe")
          return {
            src: iframe?.getAttribute("src"),
            title: iframe?.getAttribute("title"),
          }
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      {
        class: "section-iframe-wrapper",
        style: "padding:8px; margin:8px; display:flex; align-items:center; justify-content:center;",
      },
      [
        "div",
        {
          style:
            "position:relative; width:100%; max-width:560px; max-height:315px; aspect-ratio:16/9; padding:8px;",
        },
        [
          "iframe",
          mergeAttributes(HTMLAttributes, {
            frameborder: "0",
            allowfullscreen: "true",
            style: "position:absolute; top:0; left:0; width:100%; height:100%; border-radius:8px;",
          }),
        ],
      ],
    ]
  },
})
