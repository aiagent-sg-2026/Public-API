import './foodRecall.css'

type UnknownRecord = Record<string, unknown>

const isRecord = (value: unknown): value is UnknownRecord => Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const cleanText = (value: unknown) => typeof value === 'string' && value.trim() ? value.trim() : undefined

const fdaDate = (value: unknown) => {
  const text = cleanText(value)
  if (!text) return '—'
  if (/^\d{8}$/.test(text)) return `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}`
  return text
}

const recallLocation = (record: UnknownRecord) => {
  const cityState = [cleanText(record.city), cleanText(record.state)].filter(Boolean).join(', ')
  return [cityState, cleanText(record.country)].filter(Boolean).join(' · ') || '—'
}

const field = (value: unknown) => cleanText(value) ?? '—'

export function FoodRecallPreview({ data }: { data: unknown }) {
  const root = isRecord(data) ? data : {}
  const results = Array.isArray(root.results) ? root.results.filter(isRecord) : []
  const primary = results[0]
  if (!primary) return <div className="weather-empty"><strong>Food recall records unavailable</strong><span>The response did not include FDA enforcement records.</span></div>

  const meta = isRecord(root.meta) ? root.meta : {}
  const metaResults = isRecord(meta.results) ? meta.results : {}
  const total = typeof metaResults.total === 'number' ? metaResults.total : results.length
  const updated = cleanText(meta.last_updated) ?? '—'
  const recallNumber = field(primary.recall_number)
  const product = field(primary.product_description)
  const classification = field(primary.classification)
  const status = field(primary.status)
  const firm = field(primary.recalling_firm)
  const initiationDate = fdaDate(primary.recall_initiation_date)
  const reportDate = fdaDate(primary.report_date)

  return <div
    className="food-recall-preview domain-card"
    data-primary-recall-number={recallNumber === '—' ? '' : recallNumber}
    data-primary-classification={classification === '—' ? '' : classification}
    data-primary-status={status === '—' ? '' : status}
    data-primary-recalling-firm={firm === '—' ? '' : firm}
    data-primary-recall-initiation-date={initiationDate === '—' ? '' : initiationDate}
    data-provider-match-count={total}
    data-provider-last-updated={updated === '—' ? '' : updated}
  >
    <header className="domain-heading food-recall-heading">
      <div>
        <small className="domain-eyebrow">FDA food enforcement report</small>
        <h3>{recallNumber === '—' ? 'Food recall enforcement record' : `Recall ${recallNumber}`}</h3>
        <p>{product}</p>
      </div>
      <span className={`domain-state ${classification === 'Class I' ? 'warning' : ''}`}>{classification}</span>
    </header>

    <dl className="domain-facts">
      <div><dt>Recalling firm</dt><dd>{firm}</dd></div>
      <div><dt>Status</dt><dd>{status}</dd></div>
      <div><dt>Recall initiated</dt><dd>{initiationDate}</dd></div>
      <div><dt>Enforcement report</dt><dd>{reportDate}</dd></div>
      <div><dt>Location</dt><dd>{recallLocation(primary)}</dd></div>
      <div><dt>Initiation</dt><dd>{field(primary.voluntary_mandated)}</dd></div>
      <div><dt>Quantity</dt><dd>{field(primary.product_quantity)}</dd></div>
      <div><dt>Distribution</dt><dd>{field(primary.distribution_pattern)}</dd></div>
    </dl>

    <section className="food-recall-narratives" aria-label="Primary recall details">
      <article>
        <small>Product</small>
        <h4>Recalled product</h4>
        <p>{product}</p>
      </article>
      <article>
        <small>Reason</small>
        <h4>Reason for recall</h4>
        <p>{field(primary.reason_for_recall)}</p>
      </article>
      <article>
        <small>Identification</small>
        <h4>Code / lot information</h4>
        <p>{field(primary.code_info)}</p>
      </article>
    </section>

    {results.length > 1 && <section className="food-recall-related" aria-labelledby="food-recall-related-heading">
      <header>
        <div><small className="domain-eyebrow">Returned matches</small><h4 id="food-recall-related-heading">Other recall records</h4></div>
        <span>{results.length - 1} more shown · {total} provider matches</span>
      </header>
      <ol>{results.slice(1).map((record, index) => <li key={`${field(record.recall_number)}-${index}`}>
        <div>
          <strong>{field(record.recall_number)}</strong>
          <span>{field(record.classification)} · {field(record.status)}</span>
        </div>
        <p>{field(record.product_description)}</p>
        <small>{field(record.recalling_firm)}</small>
      </li>)}</ol>
    </section>}

    <p className="domain-note">Dataset updated {updated}. This is public FDA enforcement-report data and may be revised by the provider. Raw JSON retains the complete returned records.</p>
  </div>
}
