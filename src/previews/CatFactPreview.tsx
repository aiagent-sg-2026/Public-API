import { asRecord, CardEmpty, CardHeading, Facts, finite, text } from './cardPrimitives'

export function CatFactPreview({ data }: { data: unknown }) {
  const root = asRecord(data)
  const fact = text(root.fact)
  const reportedLength = finite(root.length)
  if (!fact) return <CardEmpty domain="cat-fact" title="Cat fact unavailable" detail="Cat Facts API did not return the expected fact text for this request." state="invalid"/>

  return <div className="domain-card cat-fact-preview" data-domain-card="cat-fact" data-result-state="ready" data-fact-length={reportedLength ?? undefined}>
    <CardHeading eyebrow="Cat Facts API · random fact" title="Random cat fact" description="One provider-returned fact is presented as readable content rather than a generic property dump."><span className="domain-state">Live fact</span></CardHeading>
    <blockquote className="domain-quote"><p>{fact}</p></blockquote>
    <Facts items={[
      { label: 'Provider-reported length', value: reportedLength === undefined ? 'Not supplied' : `${reportedLength} characters` },
      { label: 'Endpoint behavior', value: 'Random fact per request' },
    ]}/>
    <p className="domain-note">This is lightweight community trivia returned by catfact.ninja. Treat the fact as informational content, not an authoritative veterinary or scientific source.</p>
  </div>
}
