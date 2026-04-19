export default function ProgressDots({ total, current }) {
  return (
    <div className="flex items-center justify-center gap-2" data-testid="progress-dots">
      {Array.from({ length: total }, (_, i) => {
        if (i === current) {
          return (
            <div
              key={i}
              className="h-2 rounded-full bg-[#F5F5F5] transition-all duration-300 ease-out"
              style={{ width: 28 }}
            />
          )
        }
        return (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-all duration-300 ease-out ${
              i < current ? 'bg-[#7A7A80]' : 'bg-[#3A3A40]'
            }`}
          />
        )
      })}
    </div>
  )
}
