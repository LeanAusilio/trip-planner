const inputCls = 'w-full bg-[#2E2E33] border border-[#3A3A40] rounded-xl px-3 py-2.5 text-sm text-[#F5F5F5] focus:outline-none focus:border-[#5A5A60] transition-colors'

const ACTIVITY_TYPES = [
  { id: 'attraction', label: 'Attraction' },
  { id: 'restaurant', label: 'Restaurant' },
  { id: 'shopping',   label: 'Shopping'   },
  { id: 'medical',    label: 'Medical'    },
]

function YesNo({ value, onChange }) {
  return (
    <div className="flex gap-2">
      {[true, false].map((val) => (
        <button
          key={String(val)}
          onClick={() => onChange(val)}
          data-testid={val ? 'activities-yes' : 'activities-no'}
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

const emptyActivity = () => ({ name: '', type: 'attraction', date: '' })

export default function StepActivities({ hasActivities, activities, onHasActivitiesChange, onActivitiesChange }) {
  const update = (i, patch) =>
    onActivitiesChange(activities.map((a, idx) => (idx === i ? { ...a, ...patch } : a)))

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-['Fraunces'] text-2xl text-[#F5F5F5] leading-snug mb-1">
          Any activities <em>planned?</em>
        </h2>
        <p className="text-sm text-[#7A7A80]">Restaurants, sights, shows — add them now or later.</p>
      </div>

      <YesNo value={hasActivities} onChange={onHasActivitiesChange} />

      {hasActivities && (
        <div className="flex flex-col gap-3 max-h-56 overflow-y-auto pr-1">
          {activities.map((act, i) => (
            <div key={i} className="bg-[#242428] rounded-xl p-4 flex flex-col gap-3">
              <input
                value={act.name}
                onChange={(e) => update(i, { name: e.target.value })}
                placeholder="Activity name"
                data-testid="activity-name-input"
                className={inputCls}
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-[#7A7A80] mb-1">Type</label>
                  <select value={act.type} onChange={(e) => update(i, { type: e.target.value })} className={inputCls} style={{ colorScheme: 'dark' }}>
                    {ACTIVITY_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#7A7A80] mb-1">Date</label>
                  <input type="date" value={act.date} onChange={(e) => update(i, { date: e.target.value })} className={inputCls} style={{ colorScheme: 'dark' }} />
                </div>
              </div>
            </div>
          ))}
          <button
            onClick={() => onActivitiesChange([...activities, emptyActivity()])}
            className="text-sm text-[#7A7A80] hover:text-[#B8B8BC] border border-dashed border-[#2A2A2E] hover:border-[#3A3A40] rounded-xl py-2 transition-all duration-200"
          >
            + Add another activity
          </button>
        </div>
      )}
    </div>
  )
}
