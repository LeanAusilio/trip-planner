export default function StepFinish({ tripType, onClose }) {
  if (tripType === 'group') {
    return (
      <div className="flex flex-col gap-5">
        <div>
          <h2 className="font-['Fraunces'] text-2xl text-[#F5F5F5] leading-snug mb-1">
            Trip created!
          </h2>
          <p className="text-sm text-[#7A7A80]">
            Use the <strong className="text-[#B8B8BC]">Share</strong> button in the header to invite your travel crew with a 6-character code.
          </p>
        </div>
        <button
          onClick={onClose}
          data-testid="finish-button"
          className="w-full py-3 rounded-xl bg-[#F5F5F5] text-[#0E0E10] text-sm font-medium transition-all duration-200 hover:-translate-y-px"
        >
          Open trip →
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center text-center gap-5 py-2">
      <div className="text-4xl" style={{ filter: 'grayscale(0.2)' }}>✈</div>
      <div>
        <h2 className="font-['Fraunces'] text-2xl text-[#F5F5F5] mb-1">
          You're all <em>set!</em>
        </h2>
        <p className="text-sm text-[#7A7A80]">Your trip is ready. Start filling in the details.</p>
      </div>
      <button
        onClick={onClose}
        data-testid="finish-button"
        className="px-8 py-3 rounded-xl bg-[#F5F5F5] text-[#0E0E10] text-sm font-medium transition-all duration-200 hover:-translate-y-px"
      >
        Open my trip →
      </button>
    </div>
  )
}
