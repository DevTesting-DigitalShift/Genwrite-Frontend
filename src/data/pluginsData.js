import { pingIntegrationThunk } from "@store/slices/otherSlice"
import { FaServer, FaWordpressSimple } from "react-icons/fa"

export const pluginsData = dispatch => [
  {
    id: 111,
    name: "WordPress",
    icon: FaWordpressSimple,
    pluginTitle: "A WordPress plugin to upload blogs using AI",
    pluginName: "AI Blogger Sync",
    pluginImage: "./Images/wordpres.png",
    updatedDate: "18th Sep, 2025",
    version: "3.3.3",
    description: "A WordPress plugin to upload blogs using AI",
    message:
      "AI Blogger Sync is a powerful WordPress plugin that connects your WordPress website to our genwrite.co domain, enabling you to upload AI-generated blogs effortlessly. It is an excellent tool for bloggers and content creators aiming to save time and effort in content creation. With AI Blogger Sync, you can generate high-quality content with minimal effort and post it to your WordPress website seamlessly.",
    downloadLink: "/plugins/ai-blogger-sync.zip",
    onCheck: async () => {
      try {
        const result = await dispatch(pingIntegrationThunk("WORDPRESS")).unwrap()
        return {
          status: result.status || "success",
          message: result.message || "WordPress connection verified",
          success: result.success !== false,
        }
      } catch (err) {
        return {
          status: "error",
          message: err.message || "WordPress Connection Error",
          success: false,
        }
      }
    },
  },
  {
    id: 112,
    name: "Server-to-Server",
    icon: FaServer,
    pluginTitle: "Direct server-to-server integration for seamless data transfer and automation.",
    pluginName: "Server-to-Server",
    pluginImage: "./Images/genwriteIcon.png",
    updatedDate: "4th Oct, 2025",
    version: "1.0.0",
    description: "Direct server-to-server integration for seamless data transfer and automation.",
    message:
      "Server-to-Server integration enables direct communication between your server and our platform for automated content publishing, including fetching posts, categories, and creating new posts programmatically.",
    downloadLink: "/plugins/ServerEndpointDoc.pdf",
    onCheck: async () => {
      try {
        const result = await dispatch(pingIntegrationThunk("SERVERENDPOINT")).unwrap()
        return {
          status: result.status || "success",
          message: result.message || "Server-to-Server connection verified",
          success: result.success !== false,
        }
      } catch (err) {
        return {
          status: "error",
          message: err.message || "Server-to-Server Connection Error",
          success: false,
        }
      }
    },
  },
]
