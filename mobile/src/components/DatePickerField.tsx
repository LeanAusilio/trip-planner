import { useState } from 'react'
import { View, Text, Pressable, Modal, ScrollView, useColorScheme } from 'react-native'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameDay,
  isSameMonth,
  parseISO,
  isValid,
} from 'date-fns'

interface Props {
  value: string          // YYYY-MM-DD or ''
  onChange: (date: string) => void
  placeholder?: string
  minDate?: string       // YYYY-MM-DD, inclusive
  maxDate?: string       // YYYY-MM-DD, inclusive
  label?: string
}

function buildCalendarWeeks(viewDate: Date): Date[][] {
  const monthStart = startOfMonth(viewDate)
  const weekStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const weeks: Date[][] = []
  let day = weekStart
  for (let w = 0; w < 6; w++) {
    const week: Date[] = []
    for (let d = 0; d < 7; d++) {
      week.push(day)
      day = addDays(day, 1)
    }
    weeks.push(week)
    if (!isSameMonth(day, monthStart) && w >= 4) break
  }
  return weeks
}

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export default function DatePickerField({ value, onChange, placeholder = 'Select date', minDate, maxDate, label }: Props) {
  const colorScheme = useColorScheme()
  const dark = colorScheme === 'dark'

  const parsedValue = value && isValid(parseISO(value)) ? parseISO(value) : null
  const [open, setOpen] = useState(false)
  const [viewDate, setViewDate] = useState<Date>(parsedValue ?? new Date())

  const minD = minDate && isValid(parseISO(minDate)) ? parseISO(minDate) : null
  const maxD = maxDate && isValid(parseISO(maxDate)) ? parseISO(maxDate) : null

  const handleSelect = (day: Date) => {
    onChange(format(day, 'yyyy-MM-dd'))
    setOpen(false)
  }

  const bg = dark ? '#030712' : '#ffffff'
  const cardBg = dark ? '#111827' : '#f9fafb'
  const border = dark ? '#1f2937' : '#e5e7eb'
  const text = dark ? '#f9fafb' : '#111827'
  const muted = dark ? '#6b7280' : '#9ca3af'
  const weeks = buildCalendarWeeks(viewDate)

  return (
    <>
      {/* Trigger button */}
      <Pressable
        onPress={() => { setViewDate(parsedValue ?? new Date()); setOpen(true) }}
        style={{
          backgroundColor: dark ? '#111827' : '#f9fafb',
          borderWidth: 1,
          borderColor: dark ? '#374151' : '#e5e7eb',
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 12,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: 14, color: parsedValue ? text : muted }}>
          {parsedValue ? format(parsedValue, 'MMMM d, yyyy') : placeholder}
        </Text>
        <Text style={{ fontSize: 14, color: muted }}>📅</Text>
      </Pressable>

      {/* Calendar modal */}
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 }}
          onPress={() => setOpen(false)}
        >
          <Pressable
            style={{ backgroundColor: bg, borderRadius: 20, overflow: 'hidden', width: '100%', maxWidth: 340 }}
            onPress={() => {}}
          >
            {/* Month nav */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: border }}>
              <Pressable onPress={() => setViewDate(subMonths(viewDate, 1))} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 20, color: '#0ea5e9' }}>‹</Text>
              </Pressable>
              <Text style={{ fontSize: 16, fontWeight: '600', color: text }}>
                {format(viewDate, 'MMMM yyyy')}
              </Text>
              <Pressable onPress={() => setViewDate(addMonths(viewDate, 1))} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 20, color: '#0ea5e9' }}>›</Text>
              </Pressable>
            </View>

            {/* Day headers */}
            <View style={{ flexDirection: 'row', paddingHorizontal: 8, paddingTop: 8 }}>
              {DAY_LABELS.map((d) => (
                <View key={d} style={{ flex: 1, alignItems: 'center', paddingBottom: 4 }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: muted }}>{d}</Text>
                </View>
              ))}
            </View>

            {/* Calendar grid */}
            <View style={{ paddingHorizontal: 8, paddingBottom: 16 }}>
              {weeks.map((week, wi) => (
                <View key={wi} style={{ flexDirection: 'row' }}>
                  {week.map((day, di) => {
                    const inMonth = isSameMonth(day, viewDate)
                    const isSelected = parsedValue ? isSameDay(day, parsedValue) : false
                    const isDisabled =
                      (minD != null && day < minD) ||
                      (maxD != null && day > maxD)
                    const isToday = isSameDay(day, new Date())

                    return (
                      <Pressable
                        key={di}
                        onPress={() => !isDisabled && inMonth && handleSelect(day)}
                        style={{
                          flex: 1,
                          height: 44,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 22,
                          backgroundColor: isSelected ? '#0ea5e9' : 'transparent',
                          opacity: (!inMonth || isDisabled) ? 0.25 : 1,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: isToday && !isSelected ? '700' : '400',
                            color: isSelected ? '#ffffff' : isToday ? '#0ea5e9' : text,
                          }}
                        >
                          {format(day, 'd')}
                        </Text>
                      </Pressable>
                    )
                  })}
                </View>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  )
}
