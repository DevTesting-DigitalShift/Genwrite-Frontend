import { Node, mergeAttributes } from "@tiptap/core"

export const VideoEmbed = Node.create({
  name: "videoEmbed",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      title: { default: "YouTube video player" },
      style: { default: "" },
    }
  },

  parseHTML() {
    return [
      {
        tag: "div",
        getAttrs: el => {
          const iframe = el.querySelector("iframe")
          if (!iframe) return false
          return {
            src: iframe.getAttribute("src"),
            title: iframe.getAttribute("title") || "YouTube video player",
          }
        },
      },
    ]
  },

  renderHTML({ node }) {
    const src = node.attrs.src
    const title = node.attrs.title

    return [
      "div",
      { style: "display:flex; justify-content:center; margin:20px 0;" },
      [
        "div",
        { style: "position:relative; width:100%; max-width:560px; aspect-ratio:16/9;" },
        [
          "iframe",
          mergeAttributes({
            src,
            title,
            frameborder: "0",
            allowfullscreen: "true",
            style: "position:absolute; top:0; left:0; width:100%; height:100%; border-radius:8px;",
          }),
        ],
      ],
    ]
  },
})
