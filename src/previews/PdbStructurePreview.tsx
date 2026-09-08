import { asRecord, CardEmpty, CardHeading, DateValue, Facts, finite, rows, text } from './cardPrimitives'

const dateOnly = (value: unknown) => {
  const candidate = text(value)
  return candidate && /^\d{4}-\d{2}-\d{2}/.test(candidate) ? candidate.slice(0, 10) : undefined
}

const primaryCitation = (value: unknown) => {
  const citations = rows(value)
  return citations.find((citation) => text(citation.rcsb_is_primary) === 'Y') ?? citations[0] ?? {}
}

export function PdbStructurePreview({ data }: { data: unknown }) {
  const root = asRecord(data)
  const entry = asRecord(root.entry)
  const entryId = text(entry.id)
  if (!entryId) return <CardEmpty domain="molecular-structure" title="Structure record unavailable" detail="RCSB PDB did not return an entry identifier for this record." state="empty"/>

  const structure = asRecord(root.struct)
  const title = text(structure.title) ?? `PDB ${entryId}`
  const experimentalMethods = rows(root.exptl).map((record) => text(record.method)).filter((value): value is string => Boolean(value))
  const entryInfo = asRecord(root.rcsb_entry_info)
  const resolution = rows(root.refine).map((record) => finite(record.ls_d_res_high)).find((value) => value !== undefined)
    ?? (Array.isArray(entryInfo.resolution_combined) ? entryInfo.resolution_combined.map(finite).find((value) => value !== undefined) : undefined)
  const polymerComposition = text(entryInfo.polymer_composition)
  const polymerEntityCount = finite(entryInfo.polymer_entity_count)
  const entityCount = finite(entryInfo.entity_count)
  const atomCount = finite(entryInfo.deposited_atom_count)
  const assemblyCount = finite(entryInfo.assembly_count)
  const boundComponents = Array.isArray(entryInfo.nonpolymer_bound_components)
    ? entryInfo.nonpolymer_bound_components.map(text).filter((value): value is string => Boolean(value))
    : []

  const accession = asRecord(root.rcsb_accession_info)
  const deposited = dateOnly(accession.deposit_date)
  const released = dateOnly(accession.initial_release_date)
  const revised = dateOnly(accession.revision_date)
  const statusCode = text(accession.status_code)

  const citation = primaryCitation(root.citation)
  const citationTitle = text(citation.title)
  const journal = text(citation.rcsb_journal_abbrev) ?? text(citation.journal_abbrev)
  const citationYear = finite(citation.year)
  const doi = text(citation.pdbx_database_id_DOI)
  const pubmedId = finite(citation.pdbx_database_id_PubMed)
  const authors = Array.isArray(citation.rcsb_authors)
    ? citation.rcsb_authors.map(text).filter((value): value is string => Boolean(value))
    : []

  return <div
    className="domain-card pdb-structure-preview"
    data-domain-card="molecular-structure"
    data-result-state="ready"
    data-entry-id={entryId}
    data-experimental-method={experimentalMethods.join(', ')}
    data-resolution-angstroms={resolution}
    data-polymer-composition={polymerComposition}
    data-polymer-entity-count={polymerEntityCount}
    data-entity-count={entityCount}
    data-deposited-atom-count={atomCount}
    data-primary-citation-doi={doi}
    data-initial-release-date={released}
    data-revision-date={revised}
  >
    <CardHeading
      eyebrow="RCSB PDB structure record"
      title={title}
      description={`PDB ${entryId} · Experimental structure metadata and primary publication`}
    >
      {experimentalMethods.length > 0 && <span className="domain-state">{experimentalMethods.join(' + ')}</span>}
    </CardHeading>

    <Facts items={[
      { label: 'PDB entry', value: <code>{entryId}</code> },
      { label: 'Experimental method', value: experimentalMethods.join(', ') || 'Not supplied' },
      { label: 'Resolution', value: resolution === undefined ? 'Not supplied' : `${resolution.toLocaleString('en', { maximumFractionDigits: 3 })} Å` },
      { label: 'Polymer composition', value: polymerComposition ?? 'Not supplied' },
      { label: 'Polymer entities', value: polymerEntityCount ?? 'Not supplied' },
      { label: 'All entities', value: entityCount ?? 'Not supplied' },
      { label: 'Deposited atoms', value: atomCount === undefined ? 'Not supplied' : atomCount.toLocaleString('en') },
      { label: 'Biological assemblies', value: assemblyCount ?? 'Not supplied' },
      { label: 'Bound components', value: boundComponents.length ? boundComponents.join(', ') : 'None reported' },
      { label: 'Archive status', value: statusCode ?? 'Not supplied' },
      { label: 'Deposited', value: <DateValue value={deposited}/> },
      { label: 'Initial release', value: <DateValue value={released}/> },
      { label: 'Latest revision', value: <DateValue value={revised}/> },
    ]}/>

    {citationTitle && <section className="structure-citation" aria-labelledby="pdb-primary-citation-heading">
      <header>
        <span className="domain-eyebrow">Primary publication</span>
        <h4 id="pdb-primary-citation-heading">{citationTitle}</h4>
      </header>
      <p>{[journal, citationYear].filter(Boolean).join(' · ') || 'Publication details not supplied'}</p>
      {authors.length > 0 && <p><strong>Authors:</strong> {authors.join(', ')}</p>}
      <dl>
        {doi && <div><dt>DOI</dt><dd><code>{doi}</code></dd></div>}
        {pubmedId !== undefined && <div><dt>PubMed ID</dt><dd><code>{pubmedId}</code></dd></div>}
      </dl>
    </section>}

    <p className="domain-note">RCSB PDB Data API core-entry records can contain structure-level experimental, archive, entity, and citation metadata. This card preserves returned provider facts as text for human and browser-agent use; Raw JSON remains available for the complete entry.</p>
  </div>
}
