import { useState, useEffect } from 'react'
import ProgressDots from './ProgressDots'
import StepName from './StepName'
import StepType from './StepType'
import StepDestinations from './StepDestinations'
import StepAccommodation from './StepAccommodation'
import StepActivities from './StepActivities'
import StepFinish from './StepFinish'

const TOTAL_STEPS = 6

const emptyDest     = () => ({ city: '', country: '', countryCode: '', arrival: '', departure: '' })
const emptyHotel    = () => ({ name: '', checkIn: '', checkOut: '', address: '' })
const emptyActivity = () => ({ name: '', type: 'attraction', date: '' })

const isDestValid = (d) => d.city && d.arrival && d.departure && d.departure >= d.arrival

export default function QuickStartModal({ onComplete, onClose, dark = false }) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    name:             '',
    type:             null,
    destinations:     [emptyDest()],
    hasAccommodation: null,
    accommodations:   [emptyHotel()],
    hasActivities:    null,
    activities:       [emptyActivity()],
  })

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  useEffect(() => {
    const handler = (e) => {
      if (e.key !== 'Escape') return
      const hasData = form.name || form.type
      if (!hasData || window.confirm('Discard this trip setup?')) onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [form.name, form.type, onClose])

  const stepValid = [
    form.name.trim() !== '',
    form.type !== null,
    form.destinations.length > 0 && form.destinations.every(isDestValid),
    form.hasAccommodation !== null &&
      (!form.hasAccommodation || form.accommodations.every((h) => h.name && h.checkIn && h.checkOut)),
    form.hasActivities !== null &&
      (!form.hasActivities || form.activities.every((a) => a.name && a.date)),
    true,
  ]

  const handleNext = () => {
    if (step === 4) {
      onComplete({
        name:         form.name,
        destinations: form.destinations,
        hotels:       form.hasAccommodation ? form.accommodations : [],
        activities:   form.hasActivities    ? form.activities     : [],
      })
    }
    setStep((s) => s + 1)
  }

  const isFinish   = step === TOTAL_STEPS - 1
  const isTypeStep = step === 1

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      data-testid="quickstart-modal"
    >
      <div className={`qs-modal rounded-2xl w-full max-w-xl flex flex-col gap-7 p-10 ${dark ? 'bg-[#1C1C20]' : 'bg-[#2A2A30]'}`}>

        <div key={step} className="qs-step">
          {step === 0 && <StepName value={form.name} onChange={(v) => update('name', v)} />}
          {step === 1 && (
            <StepType
              value={form.type}
              onSelect={(type) => { update('type', type); setTimeout(() => setStep(2), 280) }}
            />
          )}
          {step === 2 && (
            <StepDestinations destinations={form.destinations} onChange={(v) => update('destinations', v)} />
          )}
          {step === 3 && (
            <StepAccommodation
              hasAccommodation={form.hasAccommodation}
              accommodations={form.accommodations}
              onHasAccommodationChange={(v) => update('hasAccommodation', v)}
              onAccommodationsChange={(v) => update('accommodations', v)}
            />
          )}
          {step === 4 && (
            <StepActivities
              hasActivities={form.hasActivities}
              activities={form.activities}
              onHasActivitiesChange={(v) => update('hasActivities', v)}
              onActivitiesChange={(v) => update('activities', v)}
            />
          )}
          {step === 5 && <StepFinish tripType={form.type} onClose={onClose} />}
        </div>

        {!isFinish && (
          <div className="flex items-center justify-between">
            <button
              onClick={step === 0 ? onClose : () => setStep((s) => s - 1)}
              data-testid="back-button"
              className="text-sm text-[#7A7A80] hover:text-[#B8B8BC] transition-colors w-16 text-left"
            >
              {step === 0 ? 'Cancel' : '← Back'}
            </button>

            <ProgressDots total={TOTAL_STEPS} current={step} />

            {isTypeStep ? (
              <div className="w-16" />
            ) : (
              <button
                onClick={handleNext}
                disabled={!stepValid[step]}
                data-testid="next-button"
                className="text-sm font-medium px-5 py-2 rounded-xl bg-[#F5F5F5] text-[#0E0E10] disabled:opacity-25 transition-all duration-200 hover:-translate-y-px disabled:hover:translate-y-0 w-16 text-center"
              >
                {step === 4 ? 'Finish' : 'Next'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
