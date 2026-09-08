type UnknownRecord = Record<string, unknown>

const isRecord = (value: unknown): value is UnknownRecord => Boolean(value) && typeof value === 'object' && !Array.isArray(value)
const text = (value: unknown) => typeof value === 'string' && value.trim() ? value.trim() : ''

const termLabels: Record<string, string> = {
  SCD: 'Clinical Drug',
  SBD: 'Branded Drug',
  GPCK: 'Clinical Pack',
  BPCK: 'Branded Pack',
}

type RxConcept = {
  rxcui: string
  name: string
  synonym: string
  tty: string
}

type RxGroup = {
  tty: string
  label: string
  concepts: RxConcept[]
}

const requestedName = (requestUrl?: string) => {
  if (!requestUrl) return ''
  try { return new URL(requestUrl).searchParams.get('name')?.trim() ?? '' } catch { return '' }
}

export function RxNormDrugPreview({ data, requestUrl }: { data: unknown; requestUrl?: string }) {
  const root = isRecord(data) ? data : {}
  const drugGroup = isRecord(root.drugGroup) ? root.drugGroup : {}
  const rawGroups = Array.isArray(drugGroup.conceptGroup) ? drugGroup.conceptGroup.filter(isRecord) : []
  const groups: RxGroup[] = rawGroups.map((group) => {
    const tty = text(group.tty)
    const concepts = Array.isArray(group.conceptProperties)
      ? group.conceptProperties.filter(isRecord).map((concept) => ({
          rxcui: text(concept.rxcui),
          name: text(concept.name),
          synonym: text(concept.synonym),
          tty: text(concept.tty) || tty,
        })).filter((concept) => concept.rxcui || concept.name)
      : []
    return { tty, label: termLabels[tty] ?? (tty || 'RxNorm concept group'), concepts }
  }).filter((group) => group.concepts.length > 0)

  const allConcepts = groups.flatMap((group) => group.concepts)
  const primary = groups.find((group) => group.tty === 'SCD')?.concepts[0] ?? allConcepts[0]
  const query = requestedName(requestUrl) || text(drugGroup.name) || 'Drug name lookup'

  if (!primary) return <div className="domain-empty"><strong>RxNorm concepts unavailable</strong><p>The response did not include associated drug concepts.</p></div>

  return <div
    className="rxnorm-preview domain-card"
    data-query-name={query}
    data-result-count={allConcepts.length}
    data-term-types={groups.map((group) => group.tty).join(',')}
    data-primary-rxcui={primary.rxcui}
    data-primary-concept-name={primary.name}
    data-primary-term-type={primary.tty}
  >
    <header className="domain-heading">
      <div>
        <small className="domain-eyebrow">RxNorm terminology lookup</small>
        <h3>{query}</h3>
        <p>Standardized clinical and branded drug concepts associated with the requested name.</p>
      </div>
      <span className="domain-state">{allConcepts.length} concepts</span>
    </header>

    <dl className="domain-facts">
      <div><dt>Requested name</dt><dd>{query}</dd></div>
      <div><dt>Returned concepts</dt><dd>{allConcepts.length}</dd></div>
      <div><dt>Term families</dt><dd>{groups.map((group) => group.tty).join(', ')}</dd></div>
      <div><dt>Primary RxCUI</dt><dd>{primary.rxcui || '—'}</dd></div>
    </dl>

    <div className="rxnorm-groups">
      {groups.map((group) => <section key={group.tty} aria-labelledby={`rxnorm-${group.tty.toLowerCase()}`}>
        <header>
          <div><small className="domain-eyebrow">{group.tty}</small><h4 id={`rxnorm-${group.tty.toLowerCase()}`}>{group.label}</h4></div>
          <span>{group.concepts.length} returned</span>
        </header>
        <ol>
          {group.concepts.slice(0, 6).map((concept) => <li key={`${group.tty}-${concept.rxcui}`} data-rxcui={concept.rxcui} data-term-type={concept.tty}>
            <strong>{concept.name || 'Unnamed RxNorm concept'}</strong>
            <code>RxCUI {concept.rxcui || '—'}</code>
            {concept.synonym && concept.synonym !== concept.name && <span>{concept.synonym}</span>}
          </li>)}
        </ol>
        {group.concepts.length > 6 && <p className="domain-note">Showing 6 of {group.concepts.length} returned {group.tty} concepts. Raw JSON retains the complete response.</p>}
      </section>)}
    </div>

    <p className="domain-note">RxNorm is terminology data from the U.S. National Library of Medicine. Use it for drug-name normalization and identifier lookup, not as prescribing or medical advice. Raw JSON retains every returned concept.</p>
  </div>
}
