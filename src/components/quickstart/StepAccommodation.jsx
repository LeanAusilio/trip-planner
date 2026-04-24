import { startOfDay, format } from 'date-fns'
import DateRangePicker from '../DateRangePicker'

const inputCls = 'w-full bg-[#2E2E33] border border-[#3A3A40] rounded-xl px-3 py-2.5 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#5A5A60] transition-colors'

function YesNo({ value, onChange }) {
  return (
    <div className="flex gap-2">
      {[true, false].map((val) => (
        <button
          key={String(val)}
          onClick={() => onChange(val)}
          data-testid={val ? 'accommodation-yes' : 'accommodation-no'}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200 hover:-translate-y-px ${
            value === val
              ? 'bg-[#242428] border-[#5A5A60] text-[#F5F5F5]'
              : 'bg-[#242428] border-[#2A2A2E] text-[#7A7A80] hover:border-[#3A3A40]'
          }`}
        >
          {val ? 'Yes' : 'No'}
        </button>
      ))}
    </div>
  )
}

const emptyHotel = () => ({ name: '', checkIn: '', checkOut: '', address: '' })

export default function StepAccommodation({ hasAccommodation, accommodations, onHasAccommodationChange, onAccommodationsChange }) {
  const update = (i, patch) =>
    onAccommodationsChange(accommodations.map((h, idx) => (idx === i ? { ...h, ...patch } : h)))

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-['Fraunces'] text-2xl text-[#F5F5F5] leading-snug mb-1">
          Got a place to <em>stay?</em>
        </h2>
        <p className="text-sm text-[#7A7A80]">Add your accommodation — you can always skip this.</p>
      </div>

      <YesNo value={hasAccommodation} onChange={onHasAccommodationChange} />

      {hasAccommodation && (
        <div className="flex flex-col gap-3 max-h-[28rem] overflow-y-auto pr-1">
          {accommodations.map((hotel, i) => (
            <div key={i} className="bg-[#242428] rounded-xl p-4 flex flex-col gap-3">
              <input
                value={hotel.name}
                onChange={(e) => update(i, { name: e.target.value })}
                placeholder="Hotel or property name"
                data-testid="hotel-name-input"
                className={inputCls}
              />
              <div className="dark">
                <div className="border border-[#3A3A40] rounded-xl px-3 pt-3 pb-2">
                  <DateRangePicker
                    from={hotel.checkIn ? startOfDay(new Date(hotel.checkIn + 'T00:00:00')) : null}
                    to={hotel.checkOut ? startOfDay(new Date(hotel.checkOut + 'T00:00:00')) : null}
                    onChange={(r) => update(i, {
                      checkIn: r.from ? format(r.from, 'yyyy-MM-dd') : '',
                      checkOut: r.to ? format(r.to, 'yyyy-MM-dd') : '',
                    })}
                  />
                </div>
              </div>
              <input value={hotel.address} onChange={(e) => update(i, { address: e.target.value })} placeholder="Address (optional)" className={inputCls} />
            </div>
          ))}
          <button
            onClick={() => onAccommodationsChange([...accommodations, emptyHotel()])}
            className="text-sm text-[#7A7A80] hover:text-[#B8B8BC] border border-dashed border-[#2A2A2E] hover:border-[#3A3A40] rounded-xl py-2 transition-all duration-200"
          >
            + Add another property
          </button>
        </div>
      )}
    </div>
  )
}
