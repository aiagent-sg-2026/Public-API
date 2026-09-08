import { asRecord, CardEmpty, CardHeading, Facts, finite, rows, text } from './cardPrimitives'

const exactText = (value: unknown): string | undefined => {
  if (typeof value === 'string' && value.trim()) return value
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return undefined
}

export function PubChemCompoundPreview({ data }: { data: unknown }) {
  const root = asRecord(data)
  const propertyTable = asRecord(root.PropertyTable)
  const property = rows(propertyTable.Properties)[0]

  if (!property) {
    return <CardEmpty
      domain="compound-properties"
      title="Compound properties unavailable"
      detail="PubChem did not return a compound property record for this lookup."
      state="empty"
    />
  }

  const cid = finite(property.CID)
  const iupacName = text(property.IUPACName)
  const molecularFormula = text(property.MolecularFormula)
  const molecularWeight = exactText(property.MolecularWeight)
  const title = iupacName ?? (cid !== undefined ? `PubChem CID ${cid}` : 'PubChem compound')

  return <div
    className="domain-card pubchem-compound-preview"
    data-domain-card="compound-properties"
    data-result-state="ready"
    data-primary-cid={cid}
    data-primary-iupac-name={iupacName}
    data-molecular-formula={molecularFormula}
    data-molecular-weight={molecularWeight}
  >
    <CardHeading
      eyebrow="PubChem compound property record"
      title={title}
      description={`${cid !== undefined ? `CID ${cid} · ` : ''}PUG REST compound property table`}
    >
      {cid !== undefined && <span className="domain-state">CID {cid}</span>}
    </CardHeading>

    <Facts items={[
      { label: 'PubChem CID', value: cid ?? 'Not supplied' },
      { label: 'Molecular formula', value: molecularFormula ? <code>{molecularFormula}</code> : 'Not supplied' },
      { label: 'Molecular weight', value: molecularWeight ? `${molecularWeight} g/mol` : 'Not supplied' },
      { label: 'IUPAC name', value: iupacName ?? 'Not supplied' },
    ]}/>

    <p className="domain-note">PubChem exposes these values through its compound property table. Molecular formula uses PubChem's standard formula field, and molecular weight is reported in g/mol. This is chemical reference data, not safety or clinical guidance.</p>
  </div>
}
