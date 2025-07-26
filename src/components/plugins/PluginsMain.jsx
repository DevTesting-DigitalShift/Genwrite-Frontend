import { useState, useEffect, useMemo } from "react";
import DifferentPlugins from "./DifferentPlugins";
import Modal from "react-modal";
import { CiGlobe } from "react-icons/ci";
import { ImGithub } from "react-icons/im";
import { RiCloseLine } from "react-icons/ri";
import { pluginsData } from "@constants/pluginsData";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet";
import axiosInstance from "@api/index";

Modal.setAppElement("#root");

const PluginsMain = () => {
  const [selectedPlugin, setSelectedPlugin] = useState(null);
  const [wordpressStatus, setWordpressStatus] = useState({});
  // Memoize plugins to prevent new array creation on each render
  const plugins = useMemo(() => pluginsData(setWordpressStatus), []);

  // Check connection status for each plugin on mount, only if not already checked
  useEffect(() => {
    const checkAllPlugins = async () => {
      for (const plugin of plugins) {
        // Skip if status is already set
        if (wordpressStatus[plugin.id]?.success) continue;

        try {
          const res = await axiosInstance.get("/wordpress/check");
          setWordpressStatus((prev) => ({
            ...prev,
            [plugin.id]: {
              status: res.data.status,
              message: res.data.message,
              success: res.data.success,
            },
          }));
        } catch (err) {
          console.error(`Error checking plugin ${plugin.pluginName}:`, err);
          setWordpressStatus((prev) => ({
            ...prev,
            [plugin.id]: {
              status: err.response?.status || "error",
              message:
                err.response?.status === 400
                  ? "No wordpress link found. Add wordpress link into your profile."
                  : err.response?.status === 502
                  ? "Wordpress connection failed, check plugin is installed & active"
                  : "Wordpress Connection Error",
              success: false,
            },
          }));
        }
      }
    };

    checkAllPlugins();
  }, [plugins, wordpressStatus]); // Include wordpressStatus to allow re-checking if status changes

  const handlePluginClick = (plugin) => {
    setSelectedPlugin(plugin);
  };

  const closeModal = () => {
    setSelectedPlugin(null);
  };

  return (
    <div className="p-5">
      <Helmet>
        <title>Plugins | GenWrite</title>
      </Helmet>
      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
      >
        Plugins
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-gray-600 max-w-xl mt-2 mb-7"
      >
        Seamlessly integrate tools and features that work exactly how you need them.
      </motion.p>

      <div className="flex flex-col space-y-4">
        {plugins.map((item) => (
          <DifferentPlugins
            key={item.id}
            pluginImage={item.pluginImage}
            pluginName={item.pluginName}
            pluginTitle={item.pluginTitle}
            name={item.name}
            updatedDate={item.updatedDate}
            pluginLink={item.pluginLink}
            onClick={() => handlePluginClick(item)}
            onCheck={item.onCheck}
            wordpressStatus={wordpressStatus[item.id]}
          />
        ))}
      </div>

      {selectedPlugin && (
        <Modal
          isOpen={true}
          onRequestClose={closeModal}
          contentLabel="Plugin Details"
          className="fixed inset-0 flex items-center justify-center z-50"
          overlayClassName="fixed inset-0 bg-black bg-opacity-50 z-40"
        >
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg mx-auto relative">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <img src={selectedPlugin.pluginImage} alt="" className="h-10 w-10 object-contain" />
                <div className="flex flex-col">
                  <h3 className="text-[25px] font-[500] text-[#000000]">
                    {selectedPlugin.pluginName}
                  </h3>
                  <span className="text-[16px] font-[400] text-[#454545]">
                    {selectedPlugin.name}
                  </span>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="bg-transparent border-none text-[#000000] hover:text-red-500 focus:outline-none"
              >
                <RiCloseLine size={25} />
              </button>
            </div>
            <p className="text-[16px] font-400 text-[#454545] mb-4">
              Prototype content blur draft italic strikethrough undo. Underline arrow rectangle
              opacity connection figma. Pencil layer slice ipsum layout flatten asset selection
              union editor. Text library fill fill rotate list. Distribute share figma figma
              underline editor main flatten frame draft.
            </p>
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">More about us</h3>
              <div className="flex items-center gap-4">
                <span className="w-[40px] h-[40px] rounded-full bg-[#F8F9F9] flex items-center justify-center">
                  <CiGlobe size={25} />
                </span>
                <span className="w-[40px] h-[40px] rounded-full bg-[#F8F9F9] flex items-center justify-center">
                  <ImGithub size={25} />
                </span>
              </div>
            </div>
            <p className="text-gray-600 mb-4">Created by: {selectedPlugin.name}</p>
            <p className="text-[#454545] mb-2">
              Last Updated {selectedPlugin.updatedDate} months ago
            </p>
            <p className="text-[#454545] text-[14px] font-[400] mb-2">Support: aryans@gmail.com</p>
            <p className="font-[400] text-[14px] mb-4">
              License under{" "}
              <a href="https://companylicense.com" className="text-[#2790F9] underline">
                Community free license
              </a>
            </p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[14px] font-[500] text-[#454545] underline cursor-pointer">
                Report an issue
              </span>
              <a href={selectedPlugin.pluginInstallUrl} target="_blank" rel="noopener noreferrer">
                <button className="bg-[#1B71CC] text-white py-2 px-6 rounded hover:bg-[#155a9c]">
                  Install
                </button>
              </a>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PluginsMain;