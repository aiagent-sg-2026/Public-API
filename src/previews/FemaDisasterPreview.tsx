import { asRecord, CardEmpty, CardHeading, Facts, rows, text } from './cardPrimitives'

const dateOnly = (value: unknown) => text(value)?.slice(0, 10) ?? 'Not supplied'
const declarationTypeLabel = (value: unknown) => {
  switch (text(value)) {
    case 'DR': return 'Major Disaster (DR)'
    case 'EM': return 'Emergency (EM)'
    case 'FM': return 'Fire Management Assistance (FM)'
    case 'FS': return 'Fire Suppression (FS)'
    default: return text(value) ?? 'Not supplied'
  }
}
const declaredPrograms = (record: Record<string, unknown>) => {
  const programs = [record.ihProgramDeclared === true ? 'IH' : undefined, record.iaProgramDeclared === true ? 'IA' : undefined, record.paProgramDeclared === true ? 'PA' : undefined, record.hmProgramDeclared === true ? 'HM' : undefined].filter(Boolean)
  return programs.length ? programs.join(', ') : 'None flagged in this record'
}

export function FemaDisasterPreview({ data }: { data: unknown }) {
  const root = asRecord(data)
  const records = rows(root.DisasterDeclarationsSummaries)
  if (!records.length) return <CardEmpty domain="disaster-declared-areas" title="No FEMA declared-area records returned" detail="OpenFEMA did not return any Disaster Declarations Summary rows for this request." state="empty"/>

  const declarationIds = [...new Set(records.map((record) => text(record.femaDeclarationString)).filter((value): value is string => Boolean(value)))]
  const first = records[0]
  return <div className="domain-card fema-disaster-preview" data-domain-card="disaster-declared-areas" data-result-state="ready" data-row-count={records.length} data-unique-declaration-count={declarationIds.length} data-primary-declaration-id={text(first.femaDeclarationString)}>
    <CardHeading eyebrow="FEMA OpenFEMA · Disaster Declarations Summaries" title={`${records.length} recent declared-area record${records.length === 1 ? '' : 's'}`} description={`${declarationIds.length} unique federal declaration${declarationIds.length === 1 ? '' : 's'} represented. OpenFEMA stores each designated geographic area as its own row, so repeated disaster IDs are expected.`}><span className="domain-state">Area-level records</span></CardHeading>
    <ol className="fema-declaration-list" aria-label="FEMA declared geographic areas">
      {records.map((record, index) => {
        const declarationId = text(record.femaDeclarationString) ?? `Disaster ${String(record.disasterNumber ?? '')}`.trim()
        const area = text(record.designatedArea) ?? 'Area not supplied'
        const state = text(record.state) ?? 'State not supplied'
        const incident = text(record.incidentType) ?? 'Incident type not supplied'
        const declarationDate = text(record.declarationDate)
        const incidentBegin = text(record.incidentBeginDate)
        const incidentEnd = text(record.incidentEndDate)
        const lastRefresh = text(record.lastRefresh)
        return <li key={text(record.id) ?? `${declarationId}-${area}-${index}`} data-declaration-index={index + 1} data-declaration-id={declarationId} data-disaster-number={record.disasterNumber} data-designated-area={area} data-state={state} data-declaration-type={text(record.declarationType)} data-incident-type={incident} data-declaration-date={declarationDate}>
          <header><div><small>{declarationId} · {incident}</small><h4>{area}</h4></div><span>{state}</span></header>
          <p className="fema-declaration-title">{text(record.declarationTitle) ?? 'Declaration title not supplied'}</p>
          <Facts items={[
            { label: 'Declaration type', value: declarationTypeLabel(record.declarationType) },
            { label: 'Declared', value: declarationDate ? <time dateTime={declarationDate}>{dateOnly(declarationDate)}</time> : 'Not supplied' },
            { label: 'Incident period', value: `${dateOnly(incidentBegin)} → ${dateOnly(incidentEnd)}` },
            { label: 'Declared programs', value: declaredPrograms(record) },
            { label: 'FEMA region', value: record.region === undefined || record.region === null ? 'Not supplied' : String(record.region) },
            { label: 'Provider refresh', value: lastRefresh ? <time dateTime={lastRefresh}>{dateOnly(lastRefresh)}</time> : 'Not supplied' },
          ]}/>
        </li>
      })}
    </ol>
    <p className="domain-note">This endpoint is area-level, not one-row-per-disaster. OpenFEMA describes the source as raw NEMIS data and notes that a small percentage of human error may be present.</p>
  </div>
}
