import axiosInstance from "@api/index"
import { message } from "antd"
import { FaServer, FaWordpressSimple } from "react-icons/fa"

export const pluginsData = (setWordpressStatus) => [
  {
    id: 111,
    name: "WordPress",
    icon: FaWordpressSimple,
    pluginTitle: "A WordPress plugin to upload blogs using AI",
    pluginName: "AI Blogger Sync",
    pluginImage: "./Images/wordpres.png",
    updatedDate: "18th Sep, 2025",
    version: "3.3.3",
    description: "A WordPress plugin to upload blogs using AI",
    message:
      "AI Blogger Sync is a powerful WordPress plugin that let's your wordpress website to connect our genwrite.co domain and let's you upload blogs generated using AI. It is a great tool for bloggers and content creators who want to save time and effort in writing articles. With AI Blogger Sync, you can easily generate high-quality content with just a few clicks at genwrite.co and post to your wordpress website with ease.",
    downloadLink: "/ai-blogger-uploader.zip",
    // onCheck: async () => {
    //   try {
    //     const res = await axiosInstance.get("/wordpress/check")
    //     return {
    //       status: res.data.status,
    //       message: res.data.message,
    //       success: res.data.success,
    //     }
    //   } catch (err) {
    //     return {
    //       status: err.response?.status || "error",
    //       message:
    //         err.response?.status === 400
    //           ? "No wordpress link found. Add wordpress link into your profile."
    //           : err.response?.status === 502
    //           ? "Wordpress connection failed, check plugin is installed & active"
    //           : "Wordpress Connection Error",
    //       success: false,
    //     }
    //   }
    // },
  },
  {
    id: 112,
    name: "Server-to-Server",
    icon: FaServer,
    pluginTitle: "Direct server-to-server integration for seamless data transfer and automation.",
    pluginName: "Server-to-Server",
    pluginImage: "./Images/genwriteIcon.png",
    updatedDate: "Coming Soon",
    version: "Coming Soon",
    description: "Direct server-to-server integration for seamless data transfer and automation.",
    message:
      "Server-to-server integration coming soon. This feature will allow direct communication between your server and our platform for automated content publishing.",
    downloadLink: "#",
    onCheck: async (e) => {
      // No ping check for coming soon
    },
  },
]
