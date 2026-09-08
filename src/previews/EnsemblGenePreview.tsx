import { asRecord, CardEmpty, CardHeading, Facts, finite, text } from './cardPrimitives'

const humanizeSpecies = (value: string | undefined) => value ? value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) : undefined
const strandLabel = (value: number | undefined) => value === 1 ? '+1 (forward)' : value === -1 ? '-1 (reverse)' : value === undefined ? 'Not supplied' : String(value)
const coordinate = (value: number | undefined) => value === undefined ? 'Not supplied' : value.toLocaleString('en-US')

export function EnsemblGenePreview({ data }: { data: unknown }) {
  const root = asRecord(data)
  const geneId = text(root.id)
  if (!geneId) return <CardEmpty domain="gene-locus" title="Gene record unavailable" detail="Ensembl did not return a stable identifier for this lookup." state="empty"/>

  const symbol = text(root.display_name)
  const description = text(root.description)
  const biotype = text(root.biotype)
  const species = text(root.species)
  const assembly = text(root.assembly_name)
  const seqRegion = text(root.seq_region_name)
  const start = finite(root.start)
  const end = finite(root.end)
  const strand = finite(root.strand)
  const objectType = text(root.object_type)
  const version = finite(root.version)
  const canonicalTranscript = text(root.canonical_transcript)
  const source = text(root.source)
  const databaseType = text(root.db_type)
  const versionedId = version === undefined ? geneId : `${geneId}.${version}`
  const location = seqRegion && start !== undefined && end !== undefined
    ? `${assembly ? `${assembly} · ` : ''}${seqRegion}:${coordinate(start)}–${coordinate(end)}`
    : 'Not supplied'

  return <div
    className="domain-card ensembl-gene-preview"
    data-domain-card="gene-locus"
    data-result-state="ready"
    data-primary-gene-id={geneId}
    data-gene-version={version}
    data-gene-symbol={symbol}
    data-biotype={biotype}
    data-species={species}
    data-assembly={assembly}
    data-seq-region={seqRegion}
    data-start={start}
    data-end={end}
    data-strand={strand}
    data-canonical-transcript={canonicalTranscript}
  >
    <CardHeading
      eyebrow="Ensembl gene record"
      title={symbol ?? geneId}
      description={`${versionedId}${biotype ? ` · ${biotype}` : ''}${species ? ` · ${humanizeSpecies(species)}` : ''}`}
    >
      {objectType && <span className="domain-state">{objectType}</span>}
    </CardHeading>

    <Facts items={[
      { label: 'Stable gene ID', value: <code>{versionedId}</code> },
      { label: 'Gene symbol', value: symbol ?? 'Not supplied' },
      { label: 'Biotype', value: biotype ?? 'Not supplied' },
      { label: 'Species', value: humanizeSpecies(species) ?? 'Not supplied' },
      { label: 'Genome assembly', value: assembly ?? 'Not supplied' },
      { label: 'Genomic region', value: location },
      { label: 'Strand', value: strandLabel(strand) },
      { label: 'Canonical transcript', value: canonicalTranscript ? <code>{canonicalTranscript}</code> : 'Not supplied' },
      { label: 'Annotation source', value: source ?? 'Not supplied' },
      { label: 'Database', value: databaseType ?? 'Not supplied' },
    ]}/>

    {description && <section className="gene-description" aria-labelledby="ensembl-gene-description-heading">
      <h4 id="ensembl-gene-description-heading">Gene description</h4>
      <p>{description}</p>
    </section>}

    <p className="domain-note">This card presents the fields returned by Ensembl's stable-ID lookup endpoint. Coordinates are tied to the provider-reported genome assembly, and the canonical transcript is shown only when Ensembl supplies it. Raw JSON retains the complete lookup response.</p>
  </div>
}
