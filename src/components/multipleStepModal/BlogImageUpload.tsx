import React, { useState, useEffect, useMemo } from "react"
import { Upload, Button, Flex, Image, Card, message, Grid, Pagination } from "antd"
import { UploadOutlined, DeleteOutlined, PictureOutlined } from "@ant-design/icons"
import type { UploadFile, UploadProps } from "antd"
import type { RcFile } from "antd/es/upload"
import ImageGalleryPicker from "@components/ImageGalleryPicker"

interface BlogImageUploadProps {
  id: string
  label: string
  initialFiles?: UploadFile[] // previously selected images
  maxCount?: number // default: 15
  onChange?: (files: UploadFile[]) => void
}

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"]
const MAX_SIZE_MB = 1
const ITEMS_PER_PAGE_MOBILE = 6
const ITEMS_PER_PAGE_DESKTOP = 9

const BlogImageUpload: React.FC<BlogImageUploadProps> = ({
  id,
  label,
  initialFiles = [],
  maxCount = 15,
  onChange,
}) => {
  const [fileList, setFileList] = useState<UploadFile[]>(initialFiles)
  const [showGalleryPicker, setShowGalleryPicker] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(ITEMS_PER_PAGE_DESKTOP)

  // Detect screen size for responsive pagination
  const screens = Grid.useBreakpoint()
  useEffect(() => {
    setPageSize(screens.sm ? ITEMS_PER_PAGE_DESKTOP : ITEMS_PER_PAGE_MOBILE)
  }, [screens.sm])

  // Sync initialFiles if provided later (e.g. when navigating back)
  useEffect(() => {
    if (
      initialFiles.length !== fileList.length ||
      initialFiles.some((f, i) => f.uid !== fileList[i]?.uid)
    ) {
      setFileList(initialFiles)
    }
  }, [initialFiles])

  // Reset to page 1 if current page exceeds total pages after deletion
  useEffect(() => {
    const totalPages = Math.ceil(fileList.length / pageSize)
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages)
    }
  }, [fileList.length, pageSize, currentPage])

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

  /** Handle image selection from gallery */
  const handleSelectFromGallery = (url: string, alt: string) => {
    // Check if already at max count
    if (fileList.length >= maxCount) {
      message.warning(`Maximum ${maxCount} images allowed`)
      return
    }

    // Check if this URL already exists
    const exists = fileList.some(f => f.url === url)
    if (exists) {
      message.info("This image is already added")
      return
    }

    // Create a new UploadFile object from the gallery image
    const newFile: UploadFile = {
      uid: `gallery-${Date.now()}-${Math.random()}`,
      name: alt || "Gallery Image",
      status: "done",
      url: url,
      thumbUrl: url,
    }

    const updated = [...fileList, newFile]
    setFileList(updated)
    onChange?.(updated)
    message.success("Image added from gallery")
  }

  // Calculate paginated files
  const paginatedFiles = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return fileList.slice(startIndex, endIndex)
  }, [fileList, currentPage, pageSize])

  return (
    <>
      <Flex vertical gap={12}>
        <Flex justify="space-between" align="center" className="w-full flex-col sm:flex-row gap-2">
          <label htmlFor={id} style={{ fontWeight: 500 }} className="text-sm sm:text-base">
            {label} (Max {maxCount}, each {MAX_SIZE_MB}MB)
          </label>

          <Flex gap={8} className="w-full sm:w-auto">
            {/* Gallery Picker Toggle */}
            <Button
              icon={<PictureOutlined />}
              onClick={() => setShowGalleryPicker(prev => !prev)}
              type={showGalleryPicker ? "primary" : "default"}
              className="flex-1 sm:flex-none text-xs sm:text-sm"
            >
              {showGalleryPicker ? "Hide Gallery" : "Browse Gallery"}
            </Button>

            {/* Upload from Device */}
            <Upload
              id={id}
              accept={ACCEPTED_TYPES.join(",")}
              multiple
              fileList={fileList}
              onChange={handleChange}
              beforeUpload={beforeUpload}
              showUploadList={false}
              maxCount={maxCount}
              className="flex-1 sm:flex-none"
            >
              {fileList.length >= maxCount ? null : (
                <Button
                  icon={<UploadOutlined className="text-base sm:text-lg" />}
                  block
                  className="border-2! hover:ring-1 hover:ring-violet-500 border-blue-500! hover:bg-violet-50! hover:text-gray-700! text-xs sm:text-sm font-medium"
                >
                  Upload from Device
                </Button>
              )}
            </Upload>
          </Flex>
        </Flex>

        {/* Gallery Picker Section */}
        {showGalleryPicker && (
          <div className="border-2 border-blue-200 rounded-lg p-3 sm:p-4 bg-gray-50 h-[400px] sm:h-[500px]">
            <ImageGalleryPicker
              onSelect={handleSelectFromGallery}
              selectedImageUrl={""} // Could track last selected if needed
            />
          </div>
        )}

        {/* Uploaded/Selected Images Grid with Pagination */}
        {fileList.length > 0 && (
          <Flex vertical gap={12} className="mt-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5 border border-violet-200 rounded-lg p-2 min-h-[220px]">
              <Image.PreviewGroup>
                {paginatedFiles.map(file => {
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

            {/* Pagination Controls */}
            {fileList.length > pageSize && (
              <Flex justify="center">
                <Pagination
                  current={currentPage}
                  total={fileList.length}
                  pageSize={pageSize}
                  onChange={page => setCurrentPage(page)}
                  showSizeChanger={false}
                  size="small"
                  showTotal={(total, range) => (
                    <span className="text-xs text-gray-600">
                      {range[0]}-{range[1]} of {total}
                    </span>
                  )}
                  className="text-sm"
                />
              </Flex>
            )}
          </Flex>
        )}
      </Flex>
    </>
  )
}

export default BlogImageUpload
