import './drugLabel.css'

type UnknownRecord = Record<string, unknown>

const isRecord = (value: unknown): value is UnknownRecord => Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const cleanText = (value: unknown) => {
  if (typeof value !== 'string') return undefined
  const text = value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  return text || undefined
}

const textArray = (value: unknown) => Array.isArray(value)
  ? value.map(cleanText).filter((item): item is string => Boolean(item))
  : []

const firstText = (value: unknown) => textArray(value)[0]

const clip = (value: string | undefined, limit = 620) => {
  if (!value) return 'Not returned in this label record.'
  return value.length <= limit ? value : `${value.slice(0, limit - 1).trimEnd()}…`
}

const joinText = (value: unknown) => textArray(value).join(', ') || '—'

export function DrugLabelPreview({ data }: { data: unknown }) {
  const root = isRecord(data) ? data : {}
  const results = Array.isArray(root.results) ? root.results.filter(isRecord) : []
  const primary = results[0]
  if (!primary) {
    return <div className="weather-empty"><strong>Drug label unavailable</strong><span>The response did not include a label record.</span></div>
  }

  const openfda = isRecord(primary.openfda) ? primary.openfda : {}
  const meta = isRecord(root.meta) ? root.meta : {}
  const metaResults = isRecord(meta.results) ? meta.results : {}
  const brand = firstText(openfda.brand_name) ?? firstText(primary.spl_product_data_elements) ?? 'Drug label'
  const genericName = firstText(openfda.generic_name) ?? '—'
  const manufacturer = firstText(openfda.manufacturer_name) ?? '—'
  const productType = firstText(openfda.product_type) ?? '—'
  const route = joinText(openfda.route)
  const substances = joinText(openfda.substance_name)
  const activeIngredients = firstText(primary.active_ingredient)
  const indications = firstText(primary.indications_and_usage) ?? firstText(primary.purpose)
  const warnings = firstText(primary.boxed_warning) ?? firstText(primary.warnings)
  const directions = firstText(primary.dosage_and_administration)
  const total = typeof metaResults.total === 'number' ? metaResults.total : results.length
  const updated = cleanText(meta.last_updated) ?? '—'

  return <div
    className="drug-label-preview"
    data-primary-brand-name={brand}
    data-primary-generic-name={genericName === '—' ? '' : genericName}
    data-primary-manufacturer={manufacturer === '—' ? '' : manufacturer}
    data-primary-substances={substances === '—' ? '' : substances}
    data-provider-match-count={total}
    data-provider-last-updated={updated === '—' ? '' : updated}
  >
    <header className="drug-label-heading">
      <div>
        <small>openFDA product labeling</small>
        <h3>{brand}</h3>
        <p>{genericName}</p>
      </div>
      <span>{results.length} returned · {total} matches</span>
    </header>

    <dl className="drug-label-facts">
      <div><dt>Manufacturer / labeler</dt><dd>{manufacturer}</dd></div>
      <div><dt>Product type</dt><dd>{productType}</dd></div>
      <div><dt>Route</dt><dd>{route}</dd></div>
      <div><dt>Active substances</dt><dd>{substances}</dd></div>
      <div><dt>Dataset updated</dt><dd>{updated}</dd></div>
    </dl>

    <section className="drug-label-sections" aria-label="Primary drug label sections">
      <article>
        <small>Label section</small>
        <h4>Active ingredients</h4>
        <p>{clip(activeIngredients, 420)}</p>
      </article>
      <article>
        <small>Label section</small>
        <h4>Indications and uses</h4>
        <p>{clip(indications)}</p>
      </article>
      <article>
        <small>Label section</small>
        <h4>Warnings</h4>
        <p>{clip(warnings, 760)}</p>
      </article>
      <article>
        <small>Label section</small>
        <h4>Directions</h4>
        <p>{clip(directions)}</p>
      </article>
    </section>

    <p className="drug-label-note">Informational public label data only. Text shown here is a bounded semantic preview; Raw JSON retains the complete provider response. Do not use openFDA results for medical decisions.</p>
  </div>
}
