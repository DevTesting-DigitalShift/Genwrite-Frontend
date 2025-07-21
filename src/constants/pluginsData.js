import axiosInstance from "@api/index"
import { message } from "antd"

export const pluginsData = (setWordpressStatus) => [
  {
    id: 111,
    pluginImage: "./Images/wordpres.png",
    pluginInstallUrl: "https://wordpress.org",
    pluginName: "Wordpress",
    pluginTitle: "Background layer project vertical list thumbnail pixel.",
    name: "Aryan",
    updatedDate: "2",
    pluginLink: "/ai-blogger-uploader.zip",
    onCheck: async (e) => {
      const btn = e.currentTarget
      try {
        btn.innerText = "Connecting"
        btn.disabled = true

        const res = await axiosInstance.get("/wordpress/check")
        setWordpressStatus({
          status: res.status,
          message: res.data.message,
          success: res.data.success,
        })
        if (res.data.success) {
          message.success(res.data.message)
        }
      } catch (err) {
        console.error(err)
        switch (err.status) {
          case 400:
            message.error("No wordpress link found. Add wordpress link into your profile.")
            break
          case 502:
            message.error("Wordpress connection failed, check plugin is installed & active")
            break
          default:
            message.error("Wordpress Connection Error")
        }
      } finally {
        btn.innerText = "Connect"
        btn.disabled = false
      }
    },
  },
]
