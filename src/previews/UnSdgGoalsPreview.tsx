import { asRecord, CardEmpty, CardHeading, rows, text } from './cardPrimitives'
import { cleanText } from './previewData'

type GoalModel = { code: string; title: string; description?: string; uri?: string }

const goalModel = (value: unknown): GoalModel | undefined => {
  const goal = asRecord(value)
  const code = text(goal.code)
  const title = cleanText(goal.title)
  if (!code || !title) return undefined
  return { code, title, description: cleanText(goal.description), uri: text(goal.uri) }
}

export function UnSdgGoalsPreview({ data }: { data: unknown }) {
  const goals = rows(data).map(goalModel).filter((goal): goal is GoalModel => Boolean(goal))
  if (!goals.length) return <CardEmpty domain="sdg-goals" title="No SDG goals returned" detail="The UN Statistics Division response did not contain usable goal code and title records." state="empty"/>

  const codes = goals.map((goal) => goal.code)
  const completeOfficialSet = goals.length === 17 && codes.every((code, index) => code === String(index + 1))
  return <div className="domain-card sdg-goals-preview" data-domain-card="sdg-goals" data-result-state="ready" data-goal-count={goals.length} data-goal-codes={codes.join(',')} data-complete-official-set={completeOfficialSet ? 'true' : 'false'}>
    <CardHeading eyebrow="United Nations Statistics Division · SDG API" title={`${goals.length} Sustainable Development Goal${goals.length === 1 ? '' : 's'}`} description="Official goal records from the latest SDG API release. Goal descriptions remain readable in the page DOM instead of being reduced to generic rows."><span className="domain-state">Goal catalogue</span></CardHeading>
    <ol className="sdg-goal-list" aria-label="United Nations Sustainable Development Goals">
      {goals.map((goal) => <li key={goal.code} data-goal-code={goal.code} data-goal-uri={goal.uri}>
        <span className="sdg-goal-number" aria-label={`Goal ${goal.code}`}>{goal.code}</span>
        <div><small>Goal {goal.code}</small><h4>{goal.title}</h4>{goal.description && <p>{goal.description}</p>}{goal.uri && <code aria-label={`Goal ${goal.code} API path`}>{goal.uri}</code>}</div>
      </li>)}
    </ol>
    <p className="domain-note">This endpoint lists goals. Targets, indicators, series and observations are separate SDG API resources and are not implied by this card.</p>
  </div>
}
