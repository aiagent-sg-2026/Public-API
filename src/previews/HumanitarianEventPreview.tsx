import { asRecord, CardEmpty, CardHeading, Facts, finite, numericText, rows, text } from './cardPrimitives'
import { cleanText } from './previewData'

const dateOnly = (value: unknown) => text(value)?.slice(0, 10) ?? 'Not supplied'
const impact = (record: Record<string, unknown>, prefix: '' | 'gov_' | 'other_') => ({
  affected: finite(record[`${prefix}num_affected`]),
  dead: finite(record[`${prefix}num_dead`]),
  displaced: finite(record[`${prefix}num_displaced`]),
})
const impactValue = (value: number | undefined) => value === undefined ? 'Not supplied' : numericText(value)

export function HumanitarianEventPreview({ data }: { data: unknown }) {
  const root = asRecord(data)
  const events = rows(root.results)
  if (!events.length) return <CardEmpty domain="humanitarian-events" title="No IFRC emergency events returned" detail="IFRC GO returned no public event records for this request." state="empty"/>

  const first = events[0]
  return <div className="domain-card humanitarian-events-preview" data-domain-card="humanitarian-events" data-result-state="ready" data-event-count={events.length} data-primary-event-id={finite(first.id)} data-primary-start-date={text(first.disaster_start_date)}>
    <CardHeading eyebrow="IFRC GO · Emergency events" title={`${events.length} recent emergency event${events.length === 1 ? '' : 's'}`} description="Ordered by disaster start date. Impact figures remain separated by reporting source instead of being merged into one unsupported total."><span className="domain-state">Source-aware impacts</span></CardHeading>
    <ol className="humanitarian-event-list" aria-label="IFRC GO emergency events">
      {events.map((event, index) => {
        const dtype = asRecord(event.dtype)
        const countries = rows(event.countries)
        const reports = rows(event.field_reports).sort((a, b) => (text(b.report_date) ?? text(b.updated_at) ?? '').localeCompare(text(a.report_date) ?? text(a.updated_at) ?? ''))
        const latestReport = reports[0]
        const ifrc = latestReport ? impact(latestReport, '') : undefined
        const government = latestReport ? impact(latestReport, 'gov_') : undefined
        const other = latestReport ? impact(latestReport, 'other_') : undefined
        const eventId = finite(event.id)
        const startDate = text(event.disaster_start_date)
        const reportDate = text(latestReport?.report_date)
        const countryNames = countries.map((country) => text(country.name)).filter((value): value is string => Boolean(value))
        const countryIso3 = countries.map((country) => text(country.iso3)).filter((value): value is string => Boolean(value))
        const severity = text(event.ifrc_severity_level_display)
        const summary = cleanText(event.summary)
        const summaryTruncated = Boolean(summary && summary.length > 700)
        const visibleSummary = summaryTruncated ? `${summary!.slice(0, 697)}…` : summary
        return <li key={eventId ?? index} data-event-index={index + 1} data-event-id={eventId} data-disaster-type={text(dtype.name)} data-start-date={startDate} data-country-iso3={countryIso3.join(',')} data-severity={severity} data-latest-report-date={reportDate} data-ifrc-affected={ifrc?.affected} data-government-affected={government?.affected} data-other-affected={other?.affected} data-summary-truncated={summaryTruncated ? 'true' : 'false'}>
          <header><div><small>{text(dtype.name) ?? 'Disaster type not supplied'} · {countryNames.join(', ') || 'Country not supplied'}</small><h4>{cleanText(event.name) ?? `IFRC event ${eventId ?? index + 1}`}</h4></div><span>{severity ?? 'Severity not supplied'}</span></header>
          <Facts items={[
            { label: 'Disaster start', value: startDate ? <time dateTime={startDate}>{dateOnly(startDate)}</time> : 'Not supplied' },
            { label: 'GLIDE', value: text(event.glide) ?? 'Not supplied' },
            { label: 'Countries', value: countryNames.join(', ') || 'Not supplied' },
            { label: 'Event-level affected figure', value: impactValue(finite(event.num_affected)) },
            { label: 'Active deployments', value: finite(event.active_deployments) === undefined ? 'Not supplied' : numericText(finite(event.active_deployments)!) },
            { label: 'Latest public field report', value: reportDate ? <time dateTime={reportDate}>{dateOnly(reportDate)}</time> : 'No field report supplied' },
          ]}/>
          {visibleSummary && <p className="humanitarian-summary">{visibleSummary}{summaryTruncated && <small> Summary excerpt; full provider narrative remains in Raw JSON.</small>}</p>}
          {latestReport && <section className="humanitarian-impact" aria-label={`${cleanText(event.name) ?? 'Event'} latest field report impact figures`}><h4>Latest field report · source-specific impact figures</h4><div className="humanitarian-impact-grid">
            {[['IFRC', ifrc], ['Government', government], ['Other source', other]].map(([label, metrics]) => { const values = metrics as ReturnType<typeof impact>; return <article key={String(label)}><strong>{String(label)}</strong><dl><div><dt>Affected</dt><dd>{impactValue(values.affected)}</dd></div><div><dt>Dead</dt><dd>{impactValue(values.dead)}</dd></div><div><dt>Displaced</dt><dd>{impactValue(values.displaced)}</dd></div></dl></article> })}
          </div></section>}
        </li>
      })}
    </ol>
    <p className="domain-note">IFRC GO exposes event-level figures and field-report figures from different reporting sources. This card keeps IFRC, government, and other-source values separate; a zero or missing value from one source is not treated as the event-wide humanitarian total.</p>
  </div>
}
