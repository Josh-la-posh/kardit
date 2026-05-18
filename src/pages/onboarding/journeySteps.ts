export interface JourneyStep {
  id:
    | 'start'
    | 'org'
    | 'docs'
    | 'banks'
    | 'review'
    | 'errors'
    | 'submitted'
    | 'status'
    | 'respond'
  title: string
  sub: string
  cta: string
  expect: string[]
  status?: 'review' | 'clarification'
}

export const JOURNEY_STEPS: JourneyStep[] = [
  {
    id: 'start',
    title: 'Welcome to Kardit',
    sub: 'Begin your affiliate application - click "Start Onboarding" inside the panel below.',
    cta: 'Start Onboarding',
    expect: ['org'],
  },
  {
    id: 'org',
    title: 'Organization & Contact',
    sub: 'Step 1 of 4 in the application - confirm the pre-filled details, then continue.',
    cta: 'Next: Documents',
    expect: ['docs'],
  },
  {
    id: 'docs',
    title: 'KYB / KYC Documents',
    sub: 'Upload (or simulate) the documents required for compliance review.',
    cta: 'Next: Banks',
    expect: ['banks'],
  },
  {
    id: 'banks',
    title: 'Issuing Banks',
    sub: 'Pick the banks Kardit will route through. Three are pre-selected - add more or continue.',
    cta: 'Review & Submit',
    expect: ['review'],
  },
  {
    id: 'review',
    title: 'Review & Submit',
    sub: 'Tick the consent box and submit. The flow will catch the missing utility bill and route you to validation.',
    cta: 'Submit application',
    expect: ['errors', 'submitted'],
    status: 'review',
  },
  {
    id: 'errors',
    title: 'Validation Errors',
    sub: 'A real flow surfaces issues before submission. Click any "Fix Now" button to advance the journey.',
    cta: 'Fix any issue',
    expect: ['org', 'docs', 'banks'],
  },
  {
    id: 'submitted',
    title: 'Application Submitted',
    sub: 'Your case is in the queue. Click "View Status" to track it.',
    cta: 'View Status',
    expect: ['status'],
  },
  {
    id: 'status',
    title: 'Status - Awaiting Response',
    sub: 'Compliance has flagged the proof-of-address upload. Open the clarification message.',
    cta: 'Respond to Clarification',
    expect: ['respond'],
    status: 'clarification',
  },
  {
    id: 'respond',
    title: 'Respond to Clarification',
    sub: 'Type a short message or attach a re-uploaded file, then submit your response.',
    cta: 'Submit response',
    expect: ['status'],
    status: 'clarification',
  },
]

