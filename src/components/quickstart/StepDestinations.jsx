import CitySearch from '../CitySearch'

const emptyDest = () => ({ city: '', country: '', countryCode: '', arrival: '', departure: '' })

const inputCls = 'w-full bg-[#2E2E33] border border-[#3A3A40] rounded-xl px-3 py-2.5 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#5A5A60] transition-colors'

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

      <div className="flex flex-col gap-4 max-h-72 overflow-y-auto pr-1">
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
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-[#7A7A80] mb-1">Arrival</label>
                <input
                  type="date"
                  value={dest.arrival}
                  onChange={(e) => update(i, { arrival: e.target.value })}
                  className={inputCls}
                  style={{ colorScheme: 'dark' }}
                />
              </div>
              <div>
                <label className="block text-xs text-[#7A7A80] mb-1">Departure</label>
                <input
                  type="date"
                  value={dest.departure}
                  min={dest.arrival || undefined}
                  onChange={(e) => update(i, { departure: e.target.value })}
                  className={inputCls}
                  style={{ colorScheme: 'dark' }}
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
