import { CardEmpty, CardHeading, Facts, finite, numericText, rows } from './cardPrimitives'

const doiFromRequestUrl = (requestUrl?: string) => {
  if (!requestUrl) return undefined
  try {
    const pathname = new URL(requestUrl).pathname
    const encoded = pathname.match(/\/citation-count\/doi:(.+)$/)?.[1]
    return encoded ? decodeURIComponent(encoded) : undefined
  } catch {
    return undefined
  }
}

export function OpenCitationsPreview({ data, requestUrl }: { data: unknown; requestUrl?: string }) {
  const records = rows(data)
  const count = finite(records[0]?.count)
  const doi = doiFromRequestUrl(requestUrl)

  if (count === undefined) {
    return <CardEmpty domain="citation-count" title="Citation count unavailable" detail="OpenCitations returned no usable incoming-citation count for this request." state={records.length ? 'invalid' : 'empty'}/>
  }

  return <div
    className="domain-card opencitations-preview"
    data-domain-card="citation-count"
    data-result-state="ready"
    data-primary-doi={doi}
    data-incoming-citation-count={count}
    data-citation-direction="incoming"
    data-citation-index="OpenCitations Index v2"
  >
    <CardHeading
      eyebrow="OpenCitations Index v2 · Citation count"
      title={`${numericText(count)} incoming citation${count === 1 ? '' : 's'}`}
      description={doi ? `Incoming citations recorded in OpenCitations Index for DOI ${doi}.` : 'Incoming citations recorded in OpenCitations Index for the requested bibliographic entity.'}
    ><span className="domain-state">Index-scoped count</span></CardHeading>
    <Facts items={[
      { label: 'DOI', value: doi ? <code>{doi}</code> : 'Not supplied' },
      { label: 'Incoming citations', value: numericText(count) },
      { label: 'Citation direction', value: 'Incoming / cited by other works' },
      { label: 'Index', value: 'OpenCitations Index v2' },
    ]}/>
    <p className="domain-note">This number is scoped to citations indexed by OpenCitations. It should not be interpreted as a universal citation total across all bibliographic databases.</p>
  </div>
}
