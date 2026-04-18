import { useEffect, useRef } from 'react'

export default function StepName({ value, onChange }) {
  const ref = useRef(null)
  useEffect(() => { ref.current?.focus() }, [])

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-['Fraunces'] text-2xl text-[#F5F5F5] leading-snug mb-1">
          What shall we call <em>this trip?</em>
        </h2>
        <p className="text-sm text-[#7A7A80]">You can always rename it later.</p>
      </div>
      <input
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.stopPropagation()}
        placeholder="e.g. Japan 2026"
        data-testid="trip-name-input"
        className="w-full bg-[#2E2E33] border border-[#3A3A40] rounded-xl px-4 py-3 text-[#F5F5F5] text-base focus:outline-none focus:border-[#5A5A60] transition-colors placeholder:text-[#4A4A50]"
      />
    </div>
  )
}
