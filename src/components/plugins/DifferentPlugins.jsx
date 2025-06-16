import { Button } from "antd"

const DifferentPlugins = ({
  pluginImage,
  pluginLink,
  pluginName,
  pluginTitle,
  name,
  updatedDate,
  onClick,
  onCheck,
  wordpressStatus,
}) => {
  console.log("wordpressStatus", wordpressStatus?.status)
  return (
    <>
      <div className="border-b-2 border-gray-200 mx-8">
        <div className="flex bg-white h-[80px] items-center justify-between px-3">
          <div onClick={onClick} className="flex gap-4 cursor-pointer">
            <img src={pluginImage} alt={pluginName} />
            <div>
              <h2 className="text-[20px] text-[#000000] font-[500]">{pluginName}</h2>
              <p className="text-[12px] text-[#454545] font-[400]">{pluginTitle}</p>
            </div>
          </div>
          <div>
            <span className="text-[14px] text-[#454545] font-[400]">{name}</span>
          </div>
          <div>
            <span className="text-[14px] text-[#454545] font-[400]">
              Last Updated {updatedDate} months ago
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a href={pluginLink} download>
              <Button
                block
                type="primary"
                className="bg-[#1B6FC9] text-[#ffffff] text-[14px] font-[400] px-4 py-2 rounded-md"
              >
                Install Plugin
              </Button>
            </a>
            <Button block type="primary" onClick={onCheck} className="transition-all">
              {wordpressStatus?.status === "200" ? "Connected" : "Connect"}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

export default DifferentPlugins

// import React from "react";

// const DifferentPlugins = ({
//   pluginImage,
//   pluginInstallUrl,
//   pluginName,
//   pluginTitle,
//   name,
//   updatedDate,
//   onClick,
// }) => {
//   return (
//     <div
//       onClick={onClick}
//       className="border-b-2 border-gray-200 cursor-pointer"
//     >
//       <div className="flex bg-white h-20 items-center justify-between px-3">
//         <div>
//           <img
//             src={pluginImage}
//             alt={pluginName}
//             className="h-16 w-16 object-contain"
//           />
//         </div>
//         <div className="flex-1 ml-4">
//           <h2 className="text-lg text-black font-medium">{pluginName}</h2>
//           <p className="text-sm text-gray-700">{pluginTitle}</p>
//         </div>
//         <div className="text-gray-700 text-sm">
//           <span>{name}</span>
//         </div>
//         <div className="text-gray-700 text-sm">
//           <span>Last Updated {updatedDate} months ago</span>
//         </div>
//         <div>
//           <a
//             href={pluginInstallUrl}
//             target="_blank"
//             rel="noopener noreferrer"
//             onClick={(e) => e.stopPropagation()}
//           >
//             <button className="bg-blue-500 text-white text-sm font-normal px-4 py-2 rounded-md hover:bg-blue-600">
//               Install
//             </button>
//           </a>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default DifferentPlugins;
