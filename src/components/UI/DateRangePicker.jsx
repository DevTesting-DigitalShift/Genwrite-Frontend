import DatePicker from "react-multi-date-picker"
import dayjs from "dayjs"
import { Calendar } from "lucide-react"

export default function DateRangePicker({ value, onChange, minDate, maxDate, className }) {
  const handleChange = dates => {
    if (!dates) {
      onChange([null, null])
      return
    }

    // Check if dates is an array (range selection)
    if (Array.isArray(dates)) {
      const [start, end] = dates
      if (start) {
        // If only start date is selected, or both are selected
        const startDate = dayjs(start.toDate()).startOf("day")
        const endDate = end ? dayjs(end.toDate()).endOf("day") : startDate.endOf("day")
        onChange([startDate, endDate])
      }
    }
  }

  return (
    <div
      className={`relative w-full ${className}`}
      onClick={e => e.stopPropagation()} // Prevent dropdown from closing
    >
      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10 text-slate-400">
        <Calendar size={16} />
      </div>
      <DatePicker
        value={value && value[0] ? [value[0].toDate(), value[1]?.toDate()] : []}
        onChange={handleChange}
        range
        dateSeparator=" - "
        minDate={minDate?.toDate()}
        maxDate={maxDate?.toDate()}
        placeholder="Select date range"
        style={{
          width: "100%",
          height: "40px",
          borderRadius: "0.5rem",
          border: "1px solid #e2e8f0",
          fontSize: "0.875rem",
          paddingLeft: "36px", // Space for icon
          paddingRight: "12px",
          boxSizing: "border-box",
          backgroundColor: "white",
          color: "#334155",
          fontWeight: 500,
        }}
        containerStyle={{ width: "100%" }}
        calendarPosition="bottom-right"
        fixMainPosition={true}
      />
    </div>
  )
}
