const OPTIONS = [
  { id: 'solo',  label: 'Just me',      sub: 'A personal adventure' },
  { id: 'group', label: 'With friends', sub: 'Plan together, travel together' },
]

export default function StepType({ value, onSelect }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-['Fraunces'] text-2xl text-[#F5F5F5] leading-snug mb-1">
          Who's coming <em>along?</em>
        </h2>
        <p className="text-sm text-[#7A7A80]">This sets up how you'll share the trip.</p>
      </div>
      <div className="flex flex-col gap-3">
        {OPTIONS.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onSelect(opt.id)}
            data-testid={`type-${opt.id}`}
            className={`w-full text-left px-5 py-4 rounded-xl border transition-all duration-200 hover:-translate-y-px ${
              value === opt.id
                ? 'bg-[#242428] border-[#5A5A60]'
                : 'bg-[#242428] border-[#2A2A2E] hover:border-[#3A3A40]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#F5F5F5]">{opt.label}</p>
                <p className="text-xs text-[#7A7A80] mt-0.5">{opt.sub}</p>
              </div>
              {value === opt.id && <span className="text-xs text-[#B8B8BC]">✓</span>}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
