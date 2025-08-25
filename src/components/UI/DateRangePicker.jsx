import { useState } from "react";
import { DatePicker, Button } from "antd";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

const { RangePicker } = DatePicker;


/**
 * DateRangePicker component for selecting date ranges.
 * @param {Object} props - Component props.
 * @param {Array} props.value - Selected date range.
 * @param {Function} props.onChange - Callback function for date range change.
 * @param {dayjs.Dayjs} props.minDate - Minimum selectable date.
 * @param {dayjs.Dayjs} props.maxDate - Maximum selectable date.
 * @returns {JSX.Element} DateRangePicker component.
 */
export default function DateRangePicker({
  value,
  onChange,
  minDate,
  maxDate,
}) {
  const PRESET_RANGES = {
  "Last 7 Days": [
    dayjs().subtract(6, "day").startOf("day").isBefore(minDate)
      ? minDate
      : dayjs().subtract(6, "day").startOf("day"),
    maxDate.endOf("day"),
  ],
  "Last 30 Days": [
    dayjs().subtract(29, "day").startOf("day").isBefore(minDate)
      ? minDate
      : dayjs().subtract(29, "day").startOf("day"),
    maxDate.endOf("day"),
  ],
  "Last 3 Months": [
    dayjs().subtract(3, "month").startOf("day").isBefore(minDate)
      ? minDate
      : dayjs().subtract(3, "month").startOf("day"),
    maxDate.endOf("day"),
  ],
  "Last 6 Months": [
    dayjs().subtract(6, "month").startOf("day").isBefore(minDate)
      ? minDate
      : dayjs().subtract(6, "month").startOf("day"),
    maxDate.endOf("day"),
  ],
  "Last 1 Year": [
    dayjs().subtract(1, "year").startOf("day").isBefore(minDate)
      ? minDate
      : dayjs().subtract(1, "year").startOf("day"),
    maxDate.endOf("day"),
  ],
};

  return (
    <div>
      {/* Range picker */}
      <RangePicker
        presets={Object.entries(PRESET_RANGES).map(([label, range]) => ({
          label,
          value: range,
        }))}
        value={value}
        minDate={minDate}
        maxDate={maxDate}
        onChange={(dates) => {
          onChange(
            dates
              ? [dayjs(dates[0]).startOf("day"), dayjs(dates[1]).endOf("day")]
              : [null, null]
          );
        }}
        format="YYYY-MM-DD"
        placeholder={["Start date", "End date"]}
        className="w-full rounded-lg border-gray-300 shadow-sm"
      />
    </div>
  );
}