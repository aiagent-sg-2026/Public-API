import { Sparkline } from './ChartPrimitives'
import { CardEmpty, CardHeading, Facts, finite, rows, text } from './cardPrimitives'

const rm = (value: number) => `RM ${new Intl.NumberFormat('en-MY', { maximumFractionDigits: 0 }).format(value)}`

export function MalaysiaHouseholdIncomePreview({ data }: { data: unknown }) {
  const records = rows(data)
    .filter((record) => text(record.date) && finite(record.income_mean) !== undefined && finite(record.income_median) !== undefined)
    .sort((a, b) => (text(b.date) ?? '').localeCompare(text(a.date) ?? ''))
  const latest = records[0]
  if (!latest) return <CardEmpty domain="household-income" title="Household income unavailable" detail="data.gov.my did not return a valid household-income observation." state="empty"/>

  const latestDate = text(latest.date)!
  const mean = finite(latest.income_mean)!
  const median = finite(latest.income_median)!
  const chronological = [...records].reverse()
  const meanSeries = chronological.map((record) => finite(record.income_mean)!)
  const medianSeries = chronological.map((record) => finite(record.income_median)!)

  return <div className="domain-card household-income-preview" data-domain-card="household-income" data-result-state="ready" data-latest-date={latestDate} data-latest-mean-rm={mean} data-latest-median-rm={median} data-observation-count={records.length} data-price-basis="nominal">
    <CardHeading eyebrow="Department of Statistics Malaysia · HIES" title={`${rm(median)} median monthly household income`} description={`${latestDate.slice(0, 4)} survey observation · nominal gross household income`}><span className="domain-state">Nominal RM</span></CardHeading>
    <Facts items={[
      { label: 'Latest median', value: rm(median) },
      { label: 'Latest mean', value: rm(mean) },
      { label: 'Mean − median gap', value: rm(mean - median) },
      { label: 'Latest survey year', value: <time dateTime={latestDate}>{latestDate.slice(0, 4)}</time> },
      { label: 'Survey observations shown', value: String(records.length) },
      { label: 'Oldest observation shown', value: text(records.at(-1)?.date)?.slice(0, 4) ?? 'Not supplied' },
    ]}/>
    <section className="income-trends" aria-label="Malaysia household income survey trends">
      <article><h4>Median monthly income</h4><Sparkline values={medianSeries} label="Malaysia median monthly household income trend"/></article>
      <article><h4>Mean monthly income</h4><Sparkline values={meanSeries} label="Malaysia mean monthly household income trend"/></article>
    </section>
    <ol className="income-observations" aria-label="Household income survey observations">{records.map((record) => <li key={text(record.date)} data-observation-date={text(record.date)} data-mean-rm={finite(record.income_mean)} data-median-rm={finite(record.income_median)}><time dateTime={text(record.date)}>{text(record.date)?.slice(0, 4)}</time><span>Median <strong>{rm(finite(record.income_median)!)}</strong></span><span>Mean <strong>{rm(finite(record.income_mean)!)}</strong></span></li>)}</ol>
    <p className="domain-note">DOSM reports these as <strong>nominal</strong> mean and median gross monthly household incomes, so the values are not inflation-adjusted. HIES observations occur in survey years and should not be read as a complete consecutive annual series.</p>
  </div>
}
