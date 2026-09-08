import { asRecord, CardEmpty, CardHeading, Facts, finite, rows, text } from './cardPrimitives'

type FunctionAnnotation = {
  molecule?: string
  text: string
}

const nestedText = (value: unknown, ...path: string[]) => {
  let current: unknown = value
  for (const key of path) current = asRecord(current)[key]
  return text(current)
}

const providerFunctions = (comments: unknown): FunctionAnnotation[] => rows(comments)
  .filter((comment) => text(comment.commentType) === 'FUNCTION')
  .flatMap((comment) => {
    const molecule = text(comment.molecule)
    return rows(comment.texts)
      .map((entry) => text(entry.value))
      .filter((value): value is string => Boolean(value))
      .map((value) => ({ molecule, text: value }))
  })

export function ProteinAnnotationPreview({ data }: { data: unknown }) {
  const root = asRecord(data)
  const accession = text(root.primaryAccession)
  if (!accession) return <CardEmpty domain="protein-annotation" title="Protein annotation unavailable" detail="UniProt did not return a primary accession for this entry." state="empty"/>

  const entryName = text(root.uniProtkbId)
  const entryType = text(root.entryType)
  const annotationScore = finite(root.annotationScore)
  const organism = asRecord(root.organism)
  const organismName = text(organism.scientificName)
  const organismCommonName = text(organism.commonName)
  const taxonId = finite(organism.taxonId)
  const sequence = asRecord(root.sequence)
  const sequenceLength = finite(sequence.length)
  const molecularWeight = finite(sequence.molWeight)
  const proteinName = nestedText(root.proteinDescription, 'recommendedName', 'fullName', 'value')
    ?? nestedText(rows(asRecord(root.proteinDescription).submissionNames)[0], 'fullName', 'value')
    ?? entryName
    ?? accession
  const geneRecords = rows(root.genes)
  const primaryGene = geneRecords.map((gene) => nestedText(gene, 'geneName', 'value')).find(Boolean)
  const geneSynonyms = geneRecords.flatMap((gene) => rows(gene.synonyms).map((synonym) => text(synonym.value)).filter((value): value is string => Boolean(value)))
  const functions = providerFunctions(root.comments)
  const visibleFunctions = functions.slice(0, 3)
  const reviewed = entryType?.toLowerCase().startsWith('uniprotkb reviewed') ?? false

  return <div
    className="domain-card protein-annotation-preview"
    data-domain-card="protein-annotation"
    data-result-state="ready"
    data-primary-accession={accession}
    data-primary-entry-name={entryName}
    data-primary-protein-name={proteinName}
    data-primary-gene={primaryGene}
    data-organism-name={organismName}
    data-organism-taxon-id={taxonId}
    data-entry-type={entryType}
    data-annotation-score={annotationScore}
    data-sequence-length={sequenceLength}
    data-molecular-weight-daltons={molecularWeight}
    data-function-comment-count={functions.length}
  >
    <CardHeading
      eyebrow="UniProtKB protein annotation"
      title={proteinName}
      description={entryName ? `${entryName} · Stable protein identity and provider annotation` : 'Stable protein identity and provider annotation'}
    >
      {entryType && <span className={`domain-state${reviewed ? '' : ' warning'}`}>{entryType}</span>}
    </CardHeading>

    <Facts items={[
      { label: 'Primary accession', value: <code>{accession}</code> },
      { label: 'Entry name', value: entryName ?? 'Not supplied' },
      { label: 'Primary gene', value: primaryGene ?? 'Not supplied' },
      { label: 'Organism', value: organismName ? `${organismName}${organismCommonName ? ` (${organismCommonName})` : ''}` : 'Not supplied' },
      { label: 'Taxonomy ID', value: taxonId ?? 'Not supplied' },
      { label: 'Sequence length', value: sequenceLength === undefined ? 'Not supplied' : `${sequenceLength.toLocaleString('en')} residues` },
      { label: 'Molecular mass', value: molecularWeight === undefined ? 'Not supplied' : `${molecularWeight.toLocaleString('en')} Da` },
      { label: 'Annotation score', value: annotationScore === undefined ? 'Not supplied' : `${annotationScore}/5` },
    ]}/>

    {geneSynonyms.length > 0 && <section className="protein-identifiers" aria-labelledby="protein-gene-synonyms-heading">
      <h4 id="protein-gene-synonyms-heading">Gene synonyms</h4>
      <ul>{geneSynonyms.slice(0, 8).map((synonym) => <li key={synonym}><code>{synonym}</code></li>)}</ul>
    </section>}

    {visibleFunctions.length > 0 && <section className="protein-functions" aria-labelledby="protein-functions-heading">
      <header><div><span className="domain-eyebrow">General annotation</span><h4 id="protein-functions-heading">Function</h4></div><span>{functions.length} returned comments</span></header>
      <ol>
        {visibleFunctions.map((annotation, index) => <li key={`${annotation.molecule ?? 'protein'}-${index}`} data-function-index={index + 1}>
          {annotation.molecule && <strong>{annotation.molecule}</strong>}
          <p>{annotation.text}</p>
        </li>)}
      </ol>
      {functions.length > visibleFunctions.length && <p className="domain-note">Showing {visibleFunctions.length} of {functions.length} returned function comments. Raw JSON retains the complete annotation.</p>}
    </section>}

    <p className="domain-note">UniProtKB reports whether an entry is reviewed (Swiss-Prot) or unreviewed (TrEMBL). Primary accessions are the stable citable identifiers; this card preserves the provider-reported entry type, sequence facts, and function annotations without treating annotation as clinical guidance.</p>
  </div>
}
