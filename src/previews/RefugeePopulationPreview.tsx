import { asRecord, CardEmpty, CardHeading, Facts, finite, numericText, rows, text } from './cardPrimitives'

const count = (value: unknown) => finite(value)
const countLabel = (value: number | undefined) => value === undefined ? 'Not supplied' : numericText(value)

export function RefugeePopulationPreview({ data }: { data: unknown }) {
  const root = asRecord(data)
  const item = rows(root.items)[0]

  if (!item) {
    return <CardEmpty
      domain="refugee-population"
      title="Displacement statistics unavailable"
      detail="UNHCR returned no end-of-year population row for the selected origin and year."
      state="empty"
    />
  }

  const year = count(item.year)
  const originName = text(item.coo_name)
  const originIso = text(item.coo_iso)
  const originUnhcr = text(item.coo)
  const refugees = count(item.refugees)
  const asylumSeekers = count(item.asylum_seekers)
  const idps = count(item.idps)
  const stateless = count(item.stateless)
  const returnedRefugees = count(item.returned_refugees)
  const returnedIdps = count(item.returned_idps)

  return <div
    className="domain-card refugee-population-preview"
    data-domain-card="refugee-population"
    data-result-state="ready"
    data-primary-origin-iso={originIso}
    data-origin-unhcr-code={originUnhcr}
    data-reporting-year={year}
    data-refugees={refugees}
    data-asylum-seekers={asylumSeekers}
    data-idps={idps}
    data-stateless={stateless}
    data-returned-refugees={returnedRefugees}
    data-returned-idps={returnedIdps}
  >
    <CardHeading
      eyebrow="UNHCR · Refugee Data Finder"
      title={`${originName ?? originIso ?? originUnhcr ?? 'Origin country'}${year === undefined ? '' : ` · ${year}`}`}
      description="End-of-year displacement population figures aggregated across countries of asylum for the selected country of origin."
    >
      <span className="domain-state">Year-end snapshot</span>
    </CardHeading>

    <Facts items={[
      { label: 'Refugees', value: countLabel(refugees) },
      { label: 'Asylum-seekers', value: countLabel(asylumSeekers) },
      { label: 'Internally displaced people', value: countLabel(idps) },
      { label: 'Stateless people', value: countLabel(stateless) },
      { label: 'Returned refugees', value: countLabel(returnedRefugees) },
      { label: 'Returned IDPs', value: countLabel(returnedIdps) },
      { label: 'ISO3 origin', value: originIso ?? 'Not supplied' },
      { label: 'UNHCR origin code', value: originUnhcr ?? 'Not supplied' },
    ]}/>

    <p className="domain-note">UNHCR documents <code>/population/</code> as end-of-year displacement data. This request sets <code>cf_type=ISO</code>, so the origin field is interpreted as ISO3. Because country of asylum is omitted, that dimension is aggregated into one row rather than returned as a list of asylum-country records.</p>
  </div>
}
