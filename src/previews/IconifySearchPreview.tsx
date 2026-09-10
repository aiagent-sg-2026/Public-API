import { asRecord, CardEmpty, CardHeading, Facts, finite, text } from './cardPrimitives'

const stringArray = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : []
const stringValue = (value: unknown) => text(value) ?? 'Not supplied'

export function IconifySearchPreview({ data }: { data: unknown }) {
  const root = asRecord(data)
  const icons = stringArray(root.icons)
  if (!icons.length) return <CardEmpty domain="icon-catalog" title="No Iconify icons returned" detail="The search response did not include icon identifiers for this query." state="empty"/>

  const collections = asRecord(root.collections)
  const request = asRecord(root.request)
  const visible = icons.slice(0, 12)
  const providerLimit = finite(root.limit)
  const start = finite(root.start) ?? 0
  const prefixes = [...new Set(icons.map((icon) => icon.split(':', 1)[0]).filter(Boolean))]
  const limitReached = providerLimit !== undefined && icons.length >= providerLimit
  const firstId = icons[0]

  return <div
    className="domain-card iconify-search-preview"
    data-domain-card="icon-catalog"
    data-result-state="ready"
    data-row-count={icons.length}
    data-visible-count={visible.length}
    data-primary-icon-id={firstId}
    data-query={text(request.query) ?? ''}
    data-provider-limit={providerLimit ?? ''}
    data-start-index={start}
    data-limit-reached={String(limitReached)}
  >
    <CardHeading
      eyebrow="Iconify · search catalogue"
      title={`${icons.length} icon identifier${icons.length === 1 ? '' : 's'} returned`}
      description="Icon IDs are paired with their icon-set author and licence metadata from the same search response."
    ><span className="domain-state">{visible.length} shown</span></CardHeading>
    <Facts items={[
      { label: 'Query', value: stringValue(request.query) },
      { label: 'Returned icons', value: icons.length.toLocaleString('en') },
      { label: 'Provider limit', value: providerLimit?.toLocaleString('en') ?? 'Not supplied' },
      { label: 'Start index', value: start.toLocaleString('en') },
      { label: 'Icon sets represented', value: prefixes.length.toLocaleString('en') },
      { label: 'Pagination signal', value: limitReached ? 'Limit reached · more matches may exist' : 'Returned below limit' },
    ]}/>
    <div className={`semantic-card-grid ${visible.length === 1 ? 'single' : ''}`} aria-label="Iconify search results" data-record-count={visible.length}>
      {visible.map((iconId, index) => {
        const separator = iconId.indexOf(':')
        const prefix = separator >= 0 ? iconId.slice(0, separator) : ''
        const iconName = separator >= 0 ? iconId.slice(separator + 1) : iconId
        const collection = asRecord(collections[prefix])
        const author = asRecord(collection.author)
        const license = asRecord(collection.license)
        const licenseSpdx = text(license.spdx)
        const licenseTitle = text(license.title)
        const licenseLabel = licenseSpdx ?? licenseTitle ?? 'Not supplied'
        return <article
          key={iconId}
          data-record-index={index + 1}
          data-icon-id={iconId}
          data-icon-prefix={prefix}
          data-icon-name={iconName}
          data-collection-name={text(collection.name) ?? ''}
          data-author={text(author.name) ?? ''}
          data-license-spdx={licenseSpdx ?? ''}
          data-license-title={licenseTitle ?? ''}
        >
          <header><span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><div><small>{(text(collection.name) ?? prefix) || 'Icon set'}</small><h3>{iconId}</h3></div><em>{licenseLabel}</em></header>
          <dl>
            <div><dt>Icon name</dt><dd>{iconName}</dd></div>
            <div><dt>Set prefix</dt><dd>{prefix || 'Not supplied'}</dd></div>
            <div><dt>Set author</dt><dd>{stringValue(author.name)}</dd></div>
            <div><dt>Licence</dt><dd>{licenseTitle && licenseSpdx && licenseTitle !== licenseSpdx ? `${licenseTitle} · ${licenseSpdx}` : licenseLabel}</dd></div>
            <div><dt>Icons in set</dt><dd>{finite(collection.total)?.toLocaleString('en') ?? 'Not supplied'}</dd></div>
            <div><dt>Set version</dt><dd>{stringValue(collection.version)}</dd></div>
          </dl>
        </article>
      })}
    </div>
    {icons.length > visible.length && <p className="domain-note">Showing {visible.length} of {icons.length} identifiers returned by the provider. Raw JSON retains the complete search response.</p>}
    <p className="domain-note">Iconify search returns icon identifiers plus collection metadata; it does not return the SVG/icon body itself. Licence and attribution requirements belong to each icon set, so preserve the returned set metadata when selecting an icon.</p>
  </div>
}
