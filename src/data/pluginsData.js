import { pingIntegrationThunk } from "@store/slices/otherSlice"
import { FaServer, FaWordpressSimple, FaShopify, FaWix } from "react-icons/fa"

export const pluginsData = dispatch => [
  {
    id: 111,
    name: "WordPress",
    icon: FaWordpressSimple,
    pluginTitle: "A WordPress plugin to upload blogs using AI",
    pluginName: "AI Blogger Sync",
    pluginImage: "./Images/wordpres.webp",
    updatedDate: "29th Jan, 2026",
    version: "3.3.5",
    description: "A WordPress plugin to upload blogs using AI",
    message:
      "AI Blogger Sync is a powerful WordPress plugin that connects your WordPress website to our genwrite.co domain, enabling you to upload AI-generated blogs effortlessly. It is an excellent tool for bloggers and content creators aiming to save time and effort in content creation. With AI Blogger Sync, you can generate high-quality content with minimal effort and post it to your WordPress website seamlessly.",
    downloadLink: "/plugins/ai-blogger-sync.zip",
    isVisible: true,
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
    pluginImage: "./Images/genwriteIcon.webp",
    updatedDate: "29th Jan, 2026",
    version: "1.0.0",
    description: "Direct server-to-server integration for seamless data transfer and automation.",
    message:
      "Server-to-Server integration enables direct communication between your server and our platform for automated content publishing, including fetching posts, categories, and creating new posts programmatically.",
    downloadLink: "/plugins/ServerEndpoint.md",
    isVisible: true,
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
  {
    id: 113,
    pluginName: "Shopify Integration",
    name: "Shopify",
    pluginImage: "/Images/shopify.webp", // put your temp image inside public/images
    description: "Sync your GenWrite content directly to your Shopify store.",
    version: "1.0.0",
    updatedDate: "Nov 2025",
    downloadLink: "#", // you can later attach doc or zip
    isVisible: true,
    icon: FaShopify, // or use any lucide icon you want
    message: "Easily publish product content and blog posts directly to Shopify.",
    onCheck: async () => ({
      status: 200,
      message: "Temporary mock connection successful",
      success: true,
    }),
  },
  {
    id: 114,
    pluginName: "Wix Studio Integration",
    name: "Wix Studio",
    pluginImage: "/Images/wix.webp",
    description: "Connect your Wix Studio projects with GenWrite for seamless publishing.",
    version: "1.0.0",
    updatedDate: "Nov 2025",
    downloadLink: "#",
    isVisible: false,
    icon: FaWix,
    message: "Push AI-generated blogs and marketing copy directly to your Wix site.",
    onCheck: async () => ({
      status: 200,
      message: "Temporary mock connection successful",
      success: true,
    }),
  },
]
