import { asRecord, CardEmpty, CardHeading, Facts, finite, rows, text } from './cardPrimitives'

const booleanish = (value: unknown): boolean | undefined => {
  if (typeof value === 'boolean') return value
  if (value === 1 || value === '1') return true
  if (value === 0 || value === '0') return false
  return undefined
}

const flagText = (value: boolean | undefined) => value === undefined ? 'Not supplied' : value ? 'Yes' : 'No'
const stringList = (value: unknown) => Array.isArray(value) ? value.map((item) => text(item)).filter((item): item is string => Boolean(item)) : []

export function ChemblMoleculePreview({ data }: { data: unknown }) {
  const root = asRecord(data)
  const chemblId = text(root.molecule_chembl_id)
  if (!chemblId) return <CardEmpty domain="molecule-profile" title="Molecule profile unavailable" detail="ChEMBL did not return a molecule identifier for this record." state="empty"/>

  const preferredName = text(root.pref_name) ?? chemblId
  const moleculeType = text(root.molecule_type)
  const maxPhase = finite(root.max_phase)
  const firstApproval = finite(root.first_approval)
  const therapeutic = booleanish(root.therapeutic_flag)
  const naturalProduct = booleanish(root.natural_product)
  const withdrawn = booleanish(root.withdrawn_flag)
  const oral = booleanish(root.oral)
  const parenteral = booleanish(root.parenteral)
  const topical = booleanish(root.topical)
  const properties = asRecord(root.molecule_properties)
  const structures = asRecord(root.molecule_structures)
  const formula = text(properties.full_molformula)
  const molecularWeight = text(properties.full_mwt)
  const alogp = text(properties.alogp)
  const polarSurfaceArea = text(properties.psa)
  const hba = finite(properties.hba)
  const hbd = finite(properties.hbd)
  const ro5Violations = finite(properties.num_ro5_violations)
  const qed = text(properties.qed_weighted)
  const canonicalSmiles = text(structures.canonical_smiles)
  const inchi = text(structures.standard_inchi)
  const inchiKey = text(structures.standard_inchi_key)
  const atcClassifications = stringList(root.atc_classifications)
  const crossReferences = rows(root.cross_references).map((reference) => ({
    source: text(reference.xref_src) ?? 'External source',
    id: text(reference.xref_id) ?? text(reference.xref_name) ?? 'Not supplied',
  }))

  return <div
    className="domain-card chembl-molecule-preview"
    data-domain-card="molecule-profile"
    data-result-state="ready"
    data-primary-chembl-id={chemblId}
    data-primary-name={preferredName}
    data-molecule-type={moleculeType}
    data-max-phase={maxPhase}
    data-first-approval={firstApproval}
    data-therapeutic-flag={therapeutic === undefined ? 'unknown' : String(therapeutic)}
    data-withdrawn-flag={withdrawn === undefined ? 'unknown' : String(withdrawn)}
    data-molecular-formula={formula}
    data-molecular-weight={molecularWeight}
    data-atc-classification-count={atcClassifications.length}
  >
    <CardHeading
      eyebrow="ChEMBL molecule record"
      title={preferredName}
      description={`${chemblId}${moleculeType ? ` · ${moleculeType}` : ''} · Provider-reported chemical and development metadata`}
    >
      {maxPhase !== undefined && <span className="domain-state">Max phase {maxPhase}</span>}
    </CardHeading>

    <Facts items={[
      { label: 'ChEMBL ID', value: <code>{chemblId}</code> },
      { label: 'Molecule type', value: moleculeType ?? 'Not supplied' },
      { label: 'Maximum phase', value: maxPhase ?? 'Not supplied' },
      { label: 'First approval year', value: firstApproval ?? 'Not supplied' },
      { label: 'Therapeutic flag', value: flagText(therapeutic) },
      { label: 'Withdrawn flag', value: flagText(withdrawn) },
      { label: 'Natural product flag', value: flagText(naturalProduct) },
      { label: 'Molecular formula', value: formula ? <code>{formula}</code> : 'Not supplied' },
      { label: 'Molecular weight', value: molecularWeight ?? 'Not supplied' },
      { label: 'ALogP', value: alogp ?? 'Not supplied' },
      { label: 'Polar surface area', value: polarSurfaceArea ?? 'Not supplied' },
      { label: 'H-bond acceptors / donors', value: hba === undefined && hbd === undefined ? 'Not supplied' : `${hba ?? '—'} / ${hbd ?? '—'}` },
      { label: 'Rule-of-five violations', value: ro5Violations ?? 'Not supplied' },
      { label: 'Weighted QED', value: qed ?? 'Not supplied' },
    ]}/>

    <section className="molecule-administration" aria-labelledby="chembl-administration-heading">
      <h4 id="chembl-administration-heading">Administration flags</h4>
      <dl>
        <div><dt>Oral</dt><dd>{flagText(oral)}</dd></div>
        <div><dt>Parenteral</dt><dd>{flagText(parenteral)}</dd></div>
        <div><dt>Topical</dt><dd>{flagText(topical)}</dd></div>
      </dl>
    </section>

    {(canonicalSmiles || inchiKey || inchi) && <section className="molecule-structure" aria-labelledby="chembl-structure-heading">
      <h4 id="chembl-structure-heading">Structure identifiers</h4>
      <dl>
        {canonicalSmiles && <div><dt>Canonical SMILES</dt><dd><code>{canonicalSmiles}</code></dd></div>}
        {inchiKey && <div><dt>Standard InChIKey</dt><dd><code>{inchiKey}</code></dd></div>}
        {inchi && <div><dt>Standard InChI</dt><dd><code>{inchi}</code></dd></div>}
      </dl>
    </section>}

    {atcClassifications.length > 0 && <section className="molecule-classifications" aria-labelledby="chembl-atc-heading">
      <header><div><span className="domain-eyebrow">Provider classifications</span><h4 id="chembl-atc-heading">ATC classifications</h4></div><span>{atcClassifications.length} returned codes</span></header>
      <ul>{atcClassifications.map((code) => <li key={code}><code>{code}</code></li>)}</ul>
    </section>}

    {crossReferences.length > 0 && <section className="molecule-cross-references" aria-labelledby="chembl-xref-heading">
      <h4 id="chembl-xref-heading">Cross references</h4>
      <ul>{crossReferences.slice(0, 8).map((reference, index) => <li key={`${reference.source}-${reference.id}-${index}`}><strong>{reference.source}</strong><code>{reference.id}</code></li>)}</ul>
      {crossReferences.length > 8 && <p className="domain-note">Showing 8 of {crossReferences.length} returned cross references. Raw JSON retains the complete list.</p>}
    </section>}

    <p className="domain-note">ChEMBL is a drug-discovery research database. The card preserves provider-reported molecule properties, development metadata, classifications, and flags; these values are not clinical guidance or regulatory status advice. Maximum phase is kept as the provider's numeric field rather than being converted into a clinical recommendation.</p>
  </div>
}
