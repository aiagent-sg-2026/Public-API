import { CardEmpty, CardHeading, Facts, finite, numericText, rows, text } from './cardPrimitives'
import { Sparkline } from './ChartPrimitives'

export function MalaysiaCoreCpiPreview({ data }: { data: unknown }) {
  const records = rows(data)
    .filter((record) => text(record.division) === 'overall' && finite(record.index) !== undefined && text(record.date))
    .sort((a, b) => (text(b.date) ?? '').localeCompare(text(a.date) ?? ''))
  const latest = records[0]
  const latestIndex = latest ? finite(latest.index) : undefined
  const latestDate = latest ? text(latest.date) : undefined
  if (!latest || latestIndex === undefined || !latestDate) return <CardEmpty domain="core-cpi-index" title="Core CPI index unavailable" detail="data.gov.my did not return a numeric overall core CPI index series for this request." state="empty"/>

  const chronological = [...records].reverse()
  const values = chronological.map((record) => finite(record.index)!).filter(Number.isFinite)
  const oldest = records.at(-1)
  return <div className="domain-card malaysia-core-cpi-preview" data-domain-card="core-cpi-index" data-result-state="ready" data-primary-index={latestIndex} data-latest-date={latestDate} data-series-count={records.length} data-division="overall" data-index-base="2010=100">
    <CardHeading eyebrow="Department of Statistics Malaysia · data.gov.my" title={`Core CPI index ${numericText(latestIndex)}`} description={`${latestDate} · Overall monthly index · base 2010 = 100`}><span className="domain-state">Index, not inflation %</span></CardHeading>
    <Sparkline values={values} label="Malaysia overall core CPI index trend"/>
    <Facts items={[
      { label: 'Latest month', value: latestDate },
      { label: 'Latest index', value: numericText(latestIndex) },
      { label: 'Index base', value: '2010 = 100' },
      { label: 'Division', value: 'Overall' },
      { label: 'Observations', value: numericText(records.length) },
      { label: 'Oldest month in response', value: text(oldest?.date) ?? 'Not supplied' },
    ]}/>
    <section className="cpi-trend" aria-label="Recent Malaysia overall core CPI index values"><h4>Recent monthly index values</h4><ol>{records.slice(0, 12).map((record) => <li key={text(record.date)}><span>{text(record.date)}</span><strong>{numericText(finite(record.index)!)}</strong></li>)}</ol></section>
    <p className="domain-note"><strong>Index, not inflation %.</strong> DOSM defines this monthly Core CPI series with base <strong>2010 = 100</strong>. The provider request filters <code>division=overall</code>, so each returned row is one national monthly overall-index observation instead of an arbitrary mixture of division rows.</p>
  </div>
}
