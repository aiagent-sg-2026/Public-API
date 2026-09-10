import { asRecord, CardEmpty, CardHeading, finite, text } from './cardPrimitives'
import { SemanticCards } from './SemanticCards'

const partOfSpeechLabels: Record<string, string> = {
  n: 'Noun',
  v: 'Verb',
  adj: 'Adjective',
  adv: 'Adverb',
  u: 'Unclassified',
}

const stringTags = (value: unknown) => Array.isArray(value)
  ? value.filter((tag): tag is string => typeof tag === 'string' && Boolean(tag.trim()))
  : []

const pronunciation = (tags: string[]) => {
  const ipa = tags.find((tag) => tag.startsWith('ipa_pron:'))?.slice('ipa_pron:'.length).trim()
  if (ipa) return ipa
  return tags.find((tag) => tag.startsWith('pron:'))?.slice('pron:'.length).trim()
}

const partsOfSpeech = (tags: string[]) => tags
  .map((tag) => partOfSpeechLabels[tag])
  .filter((label): label is string => Boolean(label))
  .filter((label, index, all) => all.indexOf(label) === index)

const queryFromUrl = (requestUrl?: string) => {
  if (!requestUrl) return undefined
  try { return text(new URL(requestUrl).searchParams.get('sl')) } catch { return undefined }
}

export function DatamuseWordPreview({ data, requestUrl }: { data: unknown; requestUrl?: string }) {
  if (!Array.isArray(data)) return <CardEmpty domain="lexical-matches" title="Datamuse response is invalid" detail="The provider response was not the documented JSON list of word objects." state="invalid"/>
  if (!data.length) return <CardEmpty domain="lexical-matches" title="No pronunciation matches returned" detail="Datamuse returned an empty list, meaning no words or phrases matched this sounds-like query." state="empty"/>

  const matches = data.map(asRecord).filter((match) => Boolean(text(match.word)))
  const invalidRecordCount = data.length - matches.length
  if (!matches.length) return <CardEmpty domain="lexical-matches" title="Datamuse response is invalid" detail="The provider returned records, but none included the required word identity documented for /words results." state="invalid"/>

  const visible = matches.slice(0, 8)
  const query = queryFromUrl(requestUrl) ?? 'the supplied term'
  const firstTags = stringTags(visible[0].tags)
  const firstIpa = pronunciation(firstTags) ?? ''
  const cards = visible.map((match, index) => {
    const tags = stringTags(match.tags)
    const ipa = pronunciation(tags)
    const pos = partsOfSpeech(tags)
    const score = finite(match.score)
    const syllables = finite(match.numSyllables)
    return {
      title: text(match.word)!,
      eyebrow: `Sounds-like match · rank ${index + 1}`,
      badge: syllables === undefined ? undefined : `${syllables} syllable${syllables === 1 ? '' : 's'}`,
      metrics: [
        { label: 'Rank', value: `#${index + 1}` },
        { label: 'Pronunciation (IPA)', value: ipa ?? 'Not supplied' },
        { label: 'Part of speech', value: pos.join(', ') || 'Not supplied' },
        { label: 'Provider score', value: score === undefined ? 'Not supplied' : `${score} · ordering only` },
      ],
    }
  })

  return <div className="domain-card datamuse-word-preview" data-domain-card="lexical-matches" data-result-state={invalidRecordCount ? 'partial' : 'ready'} data-query-constraint="sl" data-query-term={query} data-provider-record-count={data.length} data-valid-record-count={matches.length} data-invalid-record-count={invalidRecordCount} data-visible-count={visible.length} data-primary-word={text(visible[0].word) ?? ''} data-primary-ipa={firstIpa}>
    <CardHeading eyebrow="Datamuse · /words" title={`Sounds-like matches for “${query}”`} description="Matches use Datamuse's documented pronunciation-similarity constraint. Result order is meaningful; the numeric provider score has no interpretable magnitude beyond ranking."><span className="domain-state">{visible.length} returned</span></CardHeading>
    <SemanticCards cards={cards} emptyTitle="No lexical matches available"/>
    {invalidRecordCount > 0 && <p className="domain-note" role="status">{invalidRecordCount} provider record{invalidRecordCount === 1 ? '' : 's'} omitted because the required <code>word</code> identity was missing.</p>}
    <p className="domain-note">Datamuse attribution: lexical results are provided by the Datamuse API. Current keyless access ends after 2026-12-31; Datamuse says every request will require an API key starting 2027-01-01, so this browser-native demo must be re-evaluated before that date.</p>
  </div>
}
