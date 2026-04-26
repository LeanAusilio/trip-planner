import { useState } from 'react'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, isSameMonth, isSameDay,
  isAfter, isBefore, isToday, differenceInDays, startOfDay,
} from 'date-fns'

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

function buildCalendarDays(viewDate) {
  const monthStart = startOfMonth(viewDate)
  const monthEnd = endOfMonth(viewDate)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = []
  let cur = calStart
  while (!isAfter(cur, calEnd)) {
    days.push(new Date(cur))
    cur = addDays(cur, 1)
  }
  return days
}

export default function DateRangePicker({ from, to, onChange, minDate = null }) {
  const [viewDate, setViewDate] = useState(() => from || new Date())
  const [hovered, setHovered] = useState(null)

  const picking = from && !to ? 'to' : 'from'

  const isDisabled = (day) => {
    if (minDate && isBefore(startOfDay(day), startOfDay(minDate))) return true
    return false
  }

  const effectiveEnd = to || (picking === 'to' && hovered ? hovered : null)

  const isStart = (day) => from && isSameDay(day, from)
  const isEnd = (day) => to && isSameDay(day, to)
  const isInRange = (day) => {
    if (!from || !effectiveEnd) return false
    if (isSameDay(day, from) || isSameDay(day, effectiveEnd)) return false
    const [lo, hi] = isAfter(effectiveEnd, from)
      ? [from, effectiveEnd]
      : [effectiveEnd, from]
    return isAfter(day, lo) && isBefore(day, hi)
  }

  const showRangeStrip = (day) => {
    if (!from || !effectiveEnd) return null
    const [lo, hi] = isAfter(effectiveEnd, from)
      ? [from, effectiveEnd]
      : [effectiveEnd, from]
    if (isStart(day) && !isSameDay(from, effectiveEnd) && isAfter(effectiveEnd, from)) return 'right'
    if (isEnd(day) && !isSameDay(from, to || hovered)) return 'left'
    if (isInRange(day)) return 'full'
    return null
  }

  const handleDayClick = (day) => {
    if (isDisabled(day)) return
    if (picking === 'from' || !from) {
      onChange({ from: day, to: null })
      setHovered(null)
    } else {
      if (isBefore(day, from) && !isSameDay(day, from)) {
        onChange({ from: day, to: null })
      } else {
        onChange({ from, to: day })
      }
      setHovered(null)
    }
  }

  const days = buildCalendarDays(viewDate)
  const nights = from && to ? differenceInDays(to, from) : null

  return (
    <div className="select-none w-full">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => setViewDate(subMonths(viewDate, 1))}
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors text-lg leading-none"
        >‹</button>
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          {format(viewDate, 'MMMM yyyy')}
        </span>
        <button
          type="button"
          onClick={() => setViewDate(addMonths(viewDate, 1))}
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors text-lg leading-none"
        >›</button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="flex items-center justify-center h-7 text-xs font-medium text-gray-400 dark:text-gray-600">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const disabled = isDisabled(day)
          const start = isStart(day)
          const end = isEnd(day)
          const strip = showRangeStrip(day)
          const inMonth = isSameMonth(day, viewDate)
          const today = isToday(day)

          let dayClass = 'relative z-10 w-8 h-8 flex items-center justify-center text-xs transition-colors rounded-full'
          if (disabled) {
            dayClass += ' text-gray-300 dark:text-gray-700 cursor-default'
          } else if (start || end) {
            dayClass += ' bg-sky-500 text-white font-semibold cursor-pointer'
          } else if (isInRange(day)) {
            dayClass += ' text-sky-700 dark:text-sky-300 cursor-pointer hover:bg-sky-200 dark:hover:bg-sky-800'
          } else if (!inMonth) {
            dayClass += ' text-gray-300 dark:text-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800'
          } else if (today) {
            dayClass += ' text-sky-500 dark:text-sky-400 font-semibold cursor-pointer hover:bg-sky-50 dark:hover:bg-sky-900/30'
          } else {
            dayClass += ' text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800'
          }

          return (
            <div
              key={i}
              className="relative flex items-center justify-center h-11"
              onMouseEnter={() => !disabled && picking === 'to' && from && setHovered(day)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Range strip background */}
              {strip === 'full' && (
                <div className="absolute inset-0 bg-sky-100 dark:bg-sky-900/25" />
              )}
              {strip === 'right' && (
                <div className="absolute top-0 bottom-0 left-1/2 right-0 bg-sky-100 dark:bg-sky-900/25" />
              )}
              {strip === 'left' && (
                <div className="absolute top-0 bottom-0 left-0 right-1/2 bg-sky-100 dark:bg-sky-900/25" />
              )}
              <button
                type="button"
                onClick={() => handleDayClick(day)}
                disabled={disabled}
                className={dayClass}
              >
                {format(day, 'd')}
              </button>
            </div>
          )
        })}
      </div>

      {/* Status hint */}
      <p className="text-xs text-center mt-2.5 h-4 text-gray-400 dark:text-gray-600">
        {!from
          ? 'Tap arrival date'
          : !to
          ? 'Now tap departure date'
          : `${nights} night${nights !== 1 ? 's' : ''}`}
      </p>
    </div>
  )
}
