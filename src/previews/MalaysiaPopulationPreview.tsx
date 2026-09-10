import { Sparkline } from './ChartPrimitives'
import { CardEmpty, CardHeading, Facts, finite, numericText, rows, text } from './cardPrimitives'

export function MalaysiaPopulationPreview({ data }: { data: unknown }) {
  const records = rows(data)
    .filter((record) => record.sex === 'both' && record.age === 'overall' && record.ethnicity === 'overall' && text(record.date) && finite(record.population) !== undefined)
    .sort((a, b) => (text(b.date) ?? '').localeCompare(text(a.date) ?? ''))
  const latest = records[0]
  if (!latest) return <CardEmpty domain="population-total" title="Malaysia population total unavailable" detail="data.gov.my did not return an all-sex, all-age, all-ethnicity national population row." state="empty"/>

  const latestDate = text(latest.date)!
  const populationThousand = finite(latest.population)!
  const populationPeople = populationThousand * 1000
  const chronological = [...records].reverse()
  const series = chronological.map((record) => finite(record.population)! * 1000)

  return <div className="domain-card malaysia-population-preview" data-domain-card="population-total" data-result-state="ready" data-latest-date={latestDate} data-primary-population-thousand={populationThousand} data-primary-population-people={populationPeople} data-series-count={records.length} data-sex="both" data-age="overall" data-ethnicity="overall">
    <CardHeading eyebrow="Department of Statistics Malaysia · National population" title={`${numericText(populationPeople)} people`} description={`${latestDate.slice(0, 4)} estimate · both sexes · all ages · all ethnicities`}><span className="domain-state">Provider unit: '000 people</span></CardHeading>
    <Sparkline values={series} label="Malaysia total population trend"/>
    <Facts items={[
      { label: 'Latest population', value: numericText(populationPeople) },
      { label: "Provider raw ('000 people)", value: numericText(populationThousand) },
      { label: 'Reference year', value: <time dateTime={latestDate}>{latestDate.slice(0, 4)}</time> },
      { label: 'Sex dimension', value: 'Both sexes' },
      { label: 'Age dimension', value: 'All ages' },
      { label: 'Ethnicity dimension', value: 'All ethnicities' },
    ]}/>
    <ol className="population-observations" aria-label="Malaysia total population observations">{records.map((record) => { const raw = finite(record.population)!; return <li key={text(record.date)} data-observation-date={text(record.date)} data-population-thousand={raw}><time dateTime={text(record.date)}>{text(record.date)?.slice(0, 4)}</time><strong>{numericText(raw * 1000)}</strong></li> })}</ol>
    <p className="domain-note">The source dataset is multidimensional. This demo deliberately requests only <code>sex=both</code>, <code>age=overall</code>, and <code>ethnicity=overall</code>, so each row is one national total rather than an arbitrary demographic slice. DOSM publishes population in thousands of people.</p>
  </div>
}
