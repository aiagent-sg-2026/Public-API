import { asRecord, CardEmpty, CardHeading, Facts, finite, rows, text } from './cardPrimitives'

const bilingualText = (record: Record<string, unknown>, key: string, language: 'en' | 'fr') => {
  const translated = asRecord(record[`${key}_translated`])
  return text(translated[language]) ?? (language === 'en' ? text(record[key]) : undefined)
}
const dateOnly = (value: unknown) => text(value)?.slice(0, 10)
const stringList = (value: unknown) => Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0) : []
const uniqueText = (values: Array<string | undefined>) => [...new Set(values.filter((value): value is string => Boolean(value && value.trim())))]

export function CanadaOpenDataPreview({ data }: { data: unknown }) {
  const root = asRecord(data)
  const result = asRecord(root.result)
  const records = rows(result.results)
  if (!records.length) return <CardEmpty domain="open-data-catalog" title="No Canadian open-government records returned" detail="The Government of Canada CKAN search did not return catalogue records for this query." state="empty"/>

  const totalResults = finite(result.count)
  const visible = records.slice(0, 10)
  const first = visible[0]
  const firstId = text(first.id) ?? text(first.name)
  const firstType = text(first.type)
  const firstCollection = text(first.collection)
  return <div className="domain-card canada-open-data-preview" data-domain-card="open-data-catalog" data-result-state="ready" data-row-count={records.length} data-visible-count={visible.length} data-total-results={totalResults} data-primary-record-id={firstId} data-primary-record-type={firstType} data-primary-collection={firstCollection}>
    <CardHeading eyebrow="Government of Canada · Open Government CKAN" title={`${records.length} catalogue record${records.length === 1 ? '' : 's'} returned`} description="Search results can be datasets or publications. The card preserves the provider's record type, collection, publisher, licence, dates, restrictions, bilingual metadata, and resource formats without treating every result as a dataset."><span className="domain-state">{totalResults === undefined ? `${visible.length} shown` : `${totalResults.toLocaleString('en')} matches total`}</span></CardHeading>
    <div className="canada-catalog-context" aria-label="Canada open-data search result context">
      <span><strong>{records.length}</strong> returned in this response</span>
      <span><strong>{visible.length}</strong> shown semantically</span>
      <span><strong>{totalResults?.toLocaleString('en') ?? 'Not supplied'}</strong> provider matches</span>
    </div>
    <ol className="canada-catalog-list" aria-label="Government of Canada open-data catalogue records">
      {visible.map((record, index) => {
        const id = text(record.id) ?? text(record.name) ?? `record-${index + 1}`
        const titleEn = bilingualText(record, 'title', 'en') ?? `Catalogue record ${index + 1}`
        const titleFr = bilingualText(record, 'title', 'fr')
        const notesEn = bilingualText(record, 'notes', 'en')
        const notesFr = bilingualText(record, 'notes', 'fr')
        const organization = asRecord(record.organization)
        const publisher = text(organization.title) ?? bilingualText(record, 'org_title_at_publication', 'en') ?? 'Publisher not supplied'
        const type = text(record.type) ?? 'Not supplied'
        const collection = text(record.collection) ?? 'Not supplied'
        const license = text(record.license_title) ?? 'Not supplied'
        const restrictions = text(record.restrictions) ?? 'Not supplied'
        const resources = rows(record.resources)
        const formats = uniqueText(resources.map((resource) => text(resource.format))).slice(0, 8)
        const languages = uniqueText(resources.flatMap((resource) => stringList(resource.language))).slice(0, 8)
        const resourceTypes = uniqueText(resources.map((resource) => text(resource.resource_type))).slice(0, 8)
        const published = dateOnly(record.date_published)
        const portalReleased = dateOnly(record.portal_release_date)
        return <li key={id} data-record-index={index + 1} data-record-id={id} data-record-type={type} data-collection={collection} data-license={license} data-restrictions={restrictions} data-resource-count={resources.length}>
          <header><div><small>{type} · collection {collection} · record ID {id}</small><h4>{titleEn}</h4>{titleFr && titleFr !== titleEn && <p lang="fr">{titleFr}</p>}</div><span>{license}</span></header>
          <Facts items={[
            { label: 'Publisher', value: publisher },
            { label: 'Provider type', value: type },
            { label: 'Collection', value: collection },
            { label: 'Published', value: published ? <time dateTime={published}>{published}</time> : 'Not supplied' },
            { label: 'Portal released', value: portalReleased ? <time dateTime={portalReleased}>{portalReleased}</time> : 'Not supplied' },
            { label: 'Restrictions', value: restrictions },
            { label: 'Resources', value: resources.length.toLocaleString('en') },
            { label: 'Formats', value: formats.length ? formats.join(' · ') : 'Not supplied' },
            { label: 'Languages', value: languages.length ? languages.join(' · ') : 'Not supplied' },
            { label: 'Resource types', value: resourceTypes.length ? resourceTypes.join(' · ') : 'Not supplied' },
          ]}/>
          {notesEn && <p className="canada-record-description">{notesEn}</p>}
          {notesFr && notesFr !== notesEn && <p className="canada-record-description canada-record-description-fr" lang="fr">{notesFr}</p>}
        </li>
      })}
    </ol>
    <p className="domain-note">Licence and restriction values are provider catalogue metadata. Review the selected record and resource before reuse; this search response describes catalogue entries and does not itself validate the contents of each linked resource.</p>
  </div>
}
