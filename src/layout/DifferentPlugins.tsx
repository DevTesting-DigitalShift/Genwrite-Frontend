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
}: {
  pluginImage?: string
  pluginLink?: string
  pluginName?: string
  pluginTitle?: string
  name?: string
  updatedDate?: string
  onClick?: () => void
  onCheck?: () => void
  wordpressStatus?: { success?: boolean }
}) => {
  return (
    <div className="border-b border-gray-200 mx-0 sm:mx-4 md:mx-8">
      <div className="flex flex-col sm:flex-row bg-white py-3 sm:py-4 px-3 sm:px-4 items-start sm:items-center justify-between gap-3 sm:gap-4">
        <button
          type="button"
          onClick={onClick}
          className="flex items-center gap-3 sm:gap-4 cursor-pointer w-full sm:w-auto text-left"
        >
          <img
            src={pluginImage}
            alt={pluginName}
            className="h-10 w-10 sm:h-12 sm:w-12 object-contain"
          />
          <span className="flex flex-col">
            <span className="block text-base sm:text-lg md:text-xl text-[#000000] font-medium">
              {pluginName}
            </span>
            <span className="block text-xs sm:text-sm text-[#454545] font-normal">
              {pluginTitle}
            </span>
          </span>
        </button>
        <div className="text-xs sm:text-sm text-[#454545] font-normal w-full sm:w-auto">
          <span>{name}</span>
        </div>
        <div className="text-xs sm:text-sm text-[#454545] font-normal w-full sm:w-auto">
          <span>Last Updated {updatedDate} months ago</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <a href={pluginLink} download className="w-full sm:w-auto">
            <button
              type="button"
              className="w-full bg-[#4C5BD6] text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-full hover:bg-[#3B4BB8] transition-all shadow-sm shadow-[#4C5BD6]/10"
            >
              Install Plugin
            </button>
          </a>
          <button
            type="button"
            onClick={onCheck}
            className={`w-full transition-all text-xs sm:text-sm font-bold px-4 py-2 rounded-full text-white shadow-sm ${
              wordpressStatus?.success
                ? "bg-green-600 hover:bg-green-700 shadow-green-600/10"
                : "bg-[#4C5BD6] hover:bg-[#3B4BB8] shadow-[#4C5BD6]/10"
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
