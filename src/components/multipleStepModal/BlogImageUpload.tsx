import React, { useState, useEffect } from "react"
import { Upload, Button, Flex, Image, Card, message, Grid } from "antd"
import { UploadOutlined, DeleteOutlined } from "@ant-design/icons"
import type { UploadFile, UploadProps } from "antd"
import type { RcFile } from "antd/es/upload"

interface BlogImageUploadProps {
  id: string
  label: string
  initialFiles?: UploadFile[] // previously selected images
  maxCount?: number // default: 15
  onChange?: (files: UploadFile[]) => void
}

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"]
const MAX_SIZE_MB = 1

const BlogImageUpload: React.FC<BlogImageUploadProps> = ({
  id,
  label,
  initialFiles = [],
  maxCount = 15,
  onChange,
}) => {
  const [fileList, setFileList] = useState<UploadFile[]>(initialFiles)

  // Sync initialFiles if provided later (e.g. when navigating back)
  useEffect(() => {
    if (
      initialFiles.length !== fileList.length ||
      initialFiles.some((f, i) => f.uid !== fileList[i]?.uid)
    ) {
      setFileList(initialFiles)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFiles])

  /** Validate before upload */
  const beforeUpload = (file: RcFile) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      message.error(`${file.name} is not a valid image type.`)
      return Upload.LIST_IGNORE
    }

    if (file.size / 1024 / 1024 > MAX_SIZE_MB) {
      message.error(`${file.name} exceeds 1MB limit.`)
      return Upload.LIST_IGNORE
    }

    return false // prevent auto upload
  }

  /** Handle change in upload list */
  const handleChange: UploadProps["onChange"] = ({ fileList: newList }) => {
    const limited = newList.slice(0, maxCount)
    setFileList(limited)
    onChange?.(limited)
  }

  /** Handle image removal */
  const handleRemove = (file: UploadFile) => {
    const updated = fileList.filter(f => f.uid !== file.uid)
    setFileList(updated)
    onChange?.(updated)
  }

  return (
    <>
      <Flex vertical gap={12}>
        <Flex justify="space-between" align="center" className="w-full">
          <label htmlFor={id} style={{ fontWeight: 500 }}>
            {label} (Max {maxCount}, each {MAX_SIZE_MB}MB)
          </label>

          <Upload
            id={id}
            accept={ACCEPTED_TYPES.join(",")}
            multiple
            fileList={fileList}
            onChange={handleChange}
            beforeUpload={beforeUpload}
            showUploadList={false}
            maxCount={maxCount}
            className="w-1/3 grid grid-flow-col"
          >
            {fileList.length >= maxCount ? null : (
              <Button
                icon={<UploadOutlined className="size-6 text-lg" />}
                block
                className="!border-2 hover:ring-1 hover:ring-violet-500 !border-blue-500 hover:!bg-violet-50 hover:!text-gray-700 text-[length:15px] font-medium"
              >
                Upload Images
              </Button>
            )}
          </Upload>
        </Flex>
        {fileList.length > 0 && (
          <div
            style={{
              scrollbarWidth: "thin",
              scrollBehavior: "smooth",
            }}
            className="grid grid-cols-3 gap-2.5 max-h-[250px] mt-2 overflow-y-auto border border-violet-200 rounded-lg p-2"
          >
            <Image.PreviewGroup>
              {fileList.map(file => {
                const url =
                  file.thumbUrl ||
                  (file.originFileObj ? URL.createObjectURL(file.originFileObj) : file.url)

                return (
                  <Card
                    key={file.uid}
                    size="small"
                    hoverable
                    style={{
                      padding: 6,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      border: "1px solid #abd",
                    }}
                    cover={
                      <Image
                        src={url}
                        alt={file.name}
                        width="100%"
                        height={100}
                        style={{
                          objectFit: "cover",
                          borderRadius: 6,
                        }}
                      />
                    }
                    actions={[<DeleteOutlined key="delete" onClick={() => handleRemove(file)} />]}
                  />
                )
              })}
            </Image.PreviewGroup>
          </div>
        )}
      </Flex>
    </>
  )
}

export default BlogImageUpload
