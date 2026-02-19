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
  return (
    <div className="border-b border-gray-200 mx-0 sm:mx-4 md:mx-8">
      <div className="flex flex-col sm:flex-row bg-white py-3 sm:py-4 px-3 sm:px-4 items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div
          onClick={onClick}
          className="flex items-center gap-3 sm:gap-4 cursor-pointer w-full sm:w-auto"
        >
          <img
            src={pluginImage}
            alt={pluginName}
            className="h-10 w-10 sm:h-12 sm:w-12 object-contain"
          />
          <div className="flex flex-col">
            <h2 className="text-base sm:text-lg md:text-xl text-[#000000] font-medium">
              {pluginName}
            </h2>
            <p className="text-xs sm:text-sm text-[#454545] font-normal">{pluginTitle}</p>
          </div>
        </div>
        <div className="text-xs sm:text-sm text-[#454545] font-normal w-full sm:w-auto">
          <span>{name}</span>
        </div>
        <div className="text-xs sm:text-sm text-[#454545] font-normal w-full sm:w-auto">
          <span>Last Updated {updatedDate} months ago</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <a href={pluginLink} download className="w-full sm:w-auto">
            <button className="w-full bg-[#1B6FC9] text-white text-xs sm:text-sm font-normal px-3 sm:px-4 py-2 rounded-md hover:bg-[#155a9c] transition-colors">
              Install Plugin
            </button>
          </a>
          <button
            onClick={onCheck}
            className={`w-full transition-all text-xs sm:text-sm font-normal px-3 sm:px-4 py-2 rounded-md text-white ${
              wordpressStatus?.success
                ? "bg-green-600 hover:bg-green-700"
                : "bg-[#1B6FC9] hover:bg-[#155a9c]"
            }`}
          >
            {wordpressStatus?.success ? "Connected" : "Connect"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DifferentPlugins
