import { asRecord, CardEmpty, CardHeading, Facts, finite, numericText, rows, text } from './cardPrimitives'

const dateOnly = (value: unknown) => text(value)?.slice(0, 10) ?? 'Not supplied'
const publicRating = (scheme: string | undefined, value: unknown) => {
  const raw = text(value) ?? 'Not supplied'
  if (scheme !== 'FHRS' || !/^[0-5]$/.test(raw)) return raw
  const labels: Record<string, string> = { '5': 'Very good', '4': 'Good', '3': 'Generally satisfactory', '2': 'Improvement necessary', '1': 'Major improvement necessary', '0': 'Urgent improvement necessary' }
  return `${raw}/5 · ${labels[raw]}`
}
const interventionScore = (kind: 'Hygiene' | 'Structural' | 'ConfidenceInManagement', value: unknown) => {
  const score = finite(value)
  if (score === undefined) return undefined
  const common: Record<number, string> = { 0: 'Very good', 5: 'Good', 10: 'Generally satisfactory', 20: 'Major improvement necessary' }
  const labels = kind === 'ConfidenceInManagement'
    ? ({ ...common, 30: 'Urgent improvement necessary' } as Record<number, string>)
    : ({ ...common, 15: 'Improvement necessary', 25: 'Urgent improvement necessary' } as Record<number, string>)
  return `${numericText(score)} · ${labels[score] ?? 'Provider intervention score'}`
}
const address = (record: Record<string, unknown>) => [record.AddressLine1, record.AddressLine2, record.AddressLine3, record.AddressLine4, record.PostCode].map(text).filter(Boolean).join(', ')

export function FoodHygienePreview({ data }: { data: unknown }) {
  const root = asRecord(data)
  const records = rows(root.establishments)
  const meta = asRecord(root.meta)
  if (!records.length) return <CardEmpty domain="food-hygiene-ratings" title="No food establishments returned" detail="The Food Standards Agency returned no establishment records for this request." state="empty"/>

  const first = records[0]
  const providerTotal = finite(meta.totalCount) ?? records.length
  return <div className="domain-card food-hygiene-preview" data-domain-card="food-hygiene-ratings" data-result-state="ready" data-result-count={records.length} data-provider-total-count={providerTotal} data-primary-fhrs-id={finite(first.FHRSID)} data-score-direction="lower-intervention-score-is-better">
    <CardHeading eyebrow="Food Standards Agency · FHRS/FHIS" title={`${records.length} establishment${records.length === 1 ? '' : 's'} in this response`} description={`${numericText(providerTotal)} provider match${providerTotal === 1 ? '' : 'es'}. Overall public ratings and underlying intervention scores use different directions.`}><span className="domain-state">Rating higher is better</span></CardHeading>
    <ol className="food-hygiene-list" aria-label="Food Standards Agency establishment ratings">
      {records.map((record, index) => {
        const scheme = text(record.SchemeType)
        const rating = text(record.RatingValue)
        const ratingDate = text(record.RatingDate)
        const authority = text(record.LocalAuthorityName)
        const scores = asRecord(record.scores)
        const geocode = asRecord(record.geocode)
        const latitude = finite(geocode.latitude)
        const longitude = finite(geocode.longitude)
        const hygiene = interventionScore('Hygiene', scores.Hygiene)
        const structural = interventionScore('Structural', scores.Structural)
        const management = interventionScore('ConfidenceInManagement', scores.ConfidenceInManagement)
        const hasComponents = scheme === 'FHRS' && Boolean(hygiene || structural || management)
        return <li key={finite(record.FHRSID) ?? `${text(record.BusinessName) ?? 'establishment'}-${index}`} data-establishment-index={index + 1} data-fhrs-id={finite(record.FHRSID)} data-business-name={text(record.BusinessName)} data-scheme-type={scheme} data-rating-value={rating} data-rating-date={ratingDate} data-local-authority={authority} data-latitude={latitude} data-longitude={longitude}>
          <header><div><small>{scheme ?? 'Scheme not supplied'} · {text(record.BusinessType) ?? 'Business type not supplied'}</small><h4>{text(record.BusinessName) ?? 'Food establishment'}</h4></div><span>{publicRating(scheme, rating)}</span></header>
          <p>{address(record) || 'Address not supplied'}</p>
          <Facts items={[
            { label: 'Inspection/rating date', value: dateOnly(ratingDate) },
            { label: 'Local authority', value: authority ?? 'Not supplied' },
            { label: 'FHRS ID', value: finite(record.FHRSID) === undefined ? 'Not supplied' : numericText(finite(record.FHRSID)!) },
            { label: 'New rating pending', value: record.NewRatingPending === true ? 'Yes' : record.NewRatingPending === false ? 'No' : 'Not supplied' },
            { label: 'Coordinates', value: latitude === undefined || longitude === undefined ? 'Not supplied' : `${numericText(latitude)}, ${numericText(longitude)}` },
          ]}/>
          <section className="food-hygiene-scores" aria-label={`${text(record.BusinessName) ?? 'Establishment'} component intervention scores`}><h4>Component intervention scores</h4>{hasComponents ? <dl className="domain-facts"><div><dt>Hygiene</dt><dd>{hygiene ?? 'Not supplied'}</dd></div><div><dt>Structural</dt><dd>{structural ?? 'Not supplied'}</dd></div><div><dt>Confidence in management</dt><dd>{management ?? 'Not supplied'}</dd></div></dl> : <p>Component scores are not supplied for this record or scheme.</p>}</section>
        </li>
      })}
    </ol>
    <p className="domain-note">For FHRS, the overall public rating runs from 0 to 5 with <strong>higher better</strong>. The component intervention scores run in the opposite direction: <strong>lower is better</strong>. Component scores apply to FHRS, not FHIS, and may be absent after a rescore.</p>
  </div>
}
