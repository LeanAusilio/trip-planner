import { startOfDay, format } from 'date-fns'
import CitySearch from '../CitySearch'
import DateRangePicker from '../DateRangePicker'

const emptyDest = () => ({ city: '', country: '', countryCode: '', arrival: '', departure: '' })

export default function StepDestinations({ destinations, onChange }) {
  const update = (i, patch) =>
    onChange(destinations.map((d, idx) => (idx === i ? { ...d, ...patch } : d)))

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-['Fraunces'] text-2xl text-[#F5F5F5] leading-snug mb-1">
          Where are you <em>going?</em>
        </h2>
        <p className="text-sm text-[#7A7A80]">Add all your stops — you can edit dates later.</p>
      </div>

      <div className="flex flex-col gap-4 max-h-[28rem] overflow-y-auto pr-1">
        {destinations.map((dest, i) => (
          <div key={i} className="bg-[#242428] rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#7A7A80] font-medium uppercase tracking-wider">
                Stop {i + 1}
              </span>
              {destinations.length > 1 && (
                <button
                  onClick={() => onChange(destinations.filter((_, idx) => idx !== i))}
                  className="text-xs text-[#4A4A50] hover:text-[#D96B5C] transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
            <div className="qs-city-search">
              <CitySearch value={dest} onChange={(c) => update(i, c)} placeholder="Search city…" />
            </div>
            <div className="dark">
              <div className="border border-[#3A3A40] rounded-xl px-3 pt-3 pb-2">
                <DateRangePicker
                  from={dest.arrival ? startOfDay(new Date(dest.arrival + 'T00:00:00')) : null}
                  to={dest.departure ? startOfDay(new Date(dest.departure + 'T00:00:00')) : null}
                  onChange={(r) => update(i, {
                    arrival: r.from ? format(r.from, 'yyyy-MM-dd') : '',
                    departure: r.to ? format(r.to, 'yyyy-MM-dd') : '',
                  })}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => onChange([...destinations, emptyDest()])}
        className="text-sm text-[#7A7A80] hover:text-[#B8B8BC] border border-dashed border-[#2A2A2E] hover:border-[#3A3A40] rounded-xl py-2.5 transition-all duration-200"
      >
        + Add another stop
      </button>
    </div>
  )
}
