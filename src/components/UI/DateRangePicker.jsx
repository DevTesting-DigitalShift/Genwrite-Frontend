import React, { useState, useEffect } from "react"
import dayjs from "dayjs"
import { Calendar as CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { Calendar } from "./calendar"
import clsx from "clsx"

export default function DateRangePicker({ value, onChange, minDate, maxDate, className }) {
  // value is expected to be [dayjs, dayjs]
  const [date, setDate] = useState({ from: value?.[0]?.toDate(), to: value?.[1]?.toDate() })

  // Sync state if props change (e.g. from parent Reset All)
  useEffect(() => {
    setDate({ from: value?.[0]?.toDate() || undefined, to: value?.[1]?.toDate() || undefined })
  }, [value])

  const [isOpen, setIsOpen] = useState(false)

  const handleSelect = selectedRange => {
    setDate(selectedRange)
    if (selectedRange?.from) {
      const start = dayjs(selectedRange.from).startOf("day")
      const end = selectedRange.to ? dayjs(selectedRange.to).endOf("day") : start.endOf("day")
      onChange([start, end])
    } else {
      onChange([null, null])
    }
  }

  // Format the date label
  let displayString = "Select date range"
  if (date?.from) {
    if (date.to) {
      displayString = `${dayjs(date.from).format("MM/DD/YYYY")} - ${dayjs(date.to).format("MM/DD/YYYY")}`
    } else {
      displayString = dayjs(date.from).format("MM/DD/YYYY")
    }
  }

  return (
    <div className={clsx("grid gap-2 w-full", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            className={clsx(
              "w-full h-10 px-3 inline-flex items-center text-left font-medium rounded-lg bg-white border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-700 hover:bg-slate-50 transition-colors shadow-sm text-sm",
              !date?.from && "text-slate-400"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
            <span className="truncate">{displayString}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-2 rounded-2xl border-slate-200 shadow-xl overflow-hidden bg-white z-100"
          align="end"
          sideOffset={8}
        >
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={1}
            disabled={dateToCheck => {
              if (minDate && dayjs(dateToCheck).isBefore(minDate, "day")) return true
              if (maxDate && dayjs(dateToCheck).isAfter(maxDate, "day")) return true
              return false
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
