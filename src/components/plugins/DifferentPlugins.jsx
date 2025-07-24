import { Button } from "antd";

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
          <Button
            block
            type="primary"
            onClick={onCheck}
            // disabled={wordpressStatus?.success}
            className={`transition-all ${
              wordpressStatus?.success
                ? "bg-green-600 hover:bg-green-600"
                : "bg-[#1B6FC9] hover:bg-[#155a9c]"
            }`}
          >
            {wordpressStatus?.success ? "Connected" : "Connect"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DifferentPlugins;