import React, { useState, useEffect } from "react"
import { Search } from "lucide-react"
import useDebounce from "@/hooks/useDebounce"
import clsx from "clsx"

/**
 * A reusable search input component with built-in debounce functionality.
 *
 * @param {Object} props
 * @param {Function} props.onSearch - Callback function triggered after debounce delay.
 * @param {string} [props.placeholder="Search..."] - Input placeholder text.
 * @param {string} [props.className] - Additional classes for the input element.
 * @param {string} [props.containerClassName] - Additional classes for the container.
 * @param {number} [props.debounceTime=500] - Debounce delay in milliseconds.
 * @param {string} [props.initialValue=""] - Initial value of the search input.
 * @param {boolean} [props.bordered=true] - Whether the input should have a border.
 * @param {Object} [props.iconProps] - Props to pass to the Search icon.
 * @param {boolean} [props.disabled=false] - Whether the input is disabled.
 */
const DebouncedSearchInput = ({
  onSearch,
  placeholder = "Search...",
  className,
  containerClassName,
  debounceTime = 500,
  initialValue = "",
  bordered = true,
  iconProps = {},
  disabled = false,
  ...rest
}) => {
  const [value, setValue] = useState(initialValue)

  // Use our custom useDebounce hook
  const debouncedSearch = useDebounce(onSearch, debounceTime)

  const handleChange = e => {
    const newValue = e.target.value
    setValue(newValue)
    debouncedSearch(newValue)
  }

  // Sync internal state with initialValue prop changes (e.g. on reset)
  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  return (
    <div className={clsx("relative", containerClassName)}>
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10"
        {...iconProps}
      />
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className={clsx(
          "w-full pl-9 pr-3 py-2.5 text-sm rounded-lg transition-all",
          "placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100",
          bordered ? "border border-gray-300 focus:border-blue-500" : "border-none bg-slate-50",
          disabled && "bg-gray-100 text-gray-500 cursor-not-allowed",
          className,
        )}
        {...rest}
      />
    </div>
  )
}

export default DebouncedSearchInput
