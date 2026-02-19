import { useState } from "react"
import DatePicker from "react-multi-date-picker"
import dayjs from "dayjs"

export default function DateRangePicker({ value, onChange, minDate, maxDate, className }) {
  const handleChange = dates => {
    if (!dates || dates.length === 0) {
      onChange([null, null])
      return
    }
    const start = dates[0] ? dayjs(dates[0].toDate()).startOf("day") : null
    const end = dates[1] ? dayjs(dates[1].toDate()).endOf("day") : null

    if (start && end) {
      onChange([start, end])
    }
  }

  return (
    <div className={`relative ${className}`}>
      <DatePicker
        value={value ? [value[0]?.toDate(), value[1]?.toDate()] : []}
        onChange={handleChange}
        range
        dateSeparator=" ~ "
        minDate={minDate?.toDate()}
        maxDate={maxDate?.toDate()}
        placeholder="Start date - End date"
        className="w-full input input-bordered flex items-center"
        inputClass="w-full bg-transparent outline-none cursor-pointer"
        containerClassName="w-full"
      />
    </div>
  )
}
