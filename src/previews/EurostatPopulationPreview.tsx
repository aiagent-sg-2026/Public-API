import { asRecord, CardEmpty, CardHeading, Facts, finite, numericText, text } from './cardPrimitives'

const dimensionValue = (root: Record<string, unknown>, key: string) => {
  const dimension = asRecord(asRecord(root.dimension)[key])
  const category = asRecord(dimension.category)
  const index = asRecord(category.index)
  const labels = asRecord(category.label)
  const code = Object.keys(index)[0]
  return {
    code,
    label: code ? text(labels[code]) ?? code : undefined,
  }
}

const firstCell = (value: unknown) => {
  const record = asRecord(value)
  const entry = Object.values(record)[0]
  return finite(entry)
}

const firstStatus = (value: unknown) => {
  const record = asRecord(value)
  const entry = Object.values(record)[0]
  return text(entry)
}

export function EurostatPopulationPreview({ data }: { data: unknown }) {
  const root = asRecord(data)
  const population = firstCell(root.value)
  const geo = dimensionValue(root, 'geo')
  const year = dimensionValue(root, 'time')
  const unit = dimensionValue(root, 'unit')
  const sex = dimensionValue(root, 'sex')
  const age = dimensionValue(root, 'age')
  const frequency = dimensionValue(root, 'freq')
  const updated = text(root.updated)
  const status = firstStatus(root.status)

  if (population === undefined || !geo.code || !year.code) {
    return <CardEmpty
      domain="population-statistic"
      title="Population statistic unavailable"
      detail="Eurostat did not return a numeric population cell with geography and reference-year dimensions for this request."
      state="empty"
    />
  }

  return <div
    className="domain-card eurostat-population-preview"
    data-domain-card="population-statistic"
    data-result-state="ready"
    data-primary-population={population}
    data-geo-code={geo.code}
    data-reference-year={year.code}
    data-unit-code={unit.code}
    data-age-code={age.code}
    data-sex-code={sex.code}
    data-frequency-code={frequency.code}
    data-dataset="demo_pjan"
    data-dataset-updated={updated}
    data-provider-status={status}
  >
    <CardHeading
      eyebrow="Eurostat · demo_pjan"
      title={`${numericText(population)} people`}
      description={`${geo.label ?? geo.code} · Population on 1 January ${year.label ?? year.code}`}
    >
      <span className="domain-state">{unit.label ?? unit.code ?? 'Population'}</span>
    </CardHeading>

    <Facts items={[
      { label: 'Geography', value: `${geo.label ?? geo.code} (${geo.code})` },
      { label: 'Reference date', value: `1 January ${year.label ?? year.code}` },
      { label: 'Unit', value: unit.code ? `${unit.label ?? unit.code} (${unit.code})` : 'Not supplied' },
      { label: 'Age class', value: age.label ?? age.code ?? 'Not supplied' },
      { label: 'Sex', value: sex.label ?? sex.code ?? 'Not supplied' },
      { label: 'Frequency', value: frequency.label ?? frequency.code ?? 'Not supplied' },
      { label: 'Dataset updated', value: updated ? <time dateTime={updated}>{updated}</time> : 'Not supplied' },
      { label: 'Provider status flag', value: status ?? 'None supplied' },
    ]}/>

    <p className="domain-note">Eurostat dataset <code>demo_pjan</code> is “Population on 1 January by age and sex”. This demo requests total age, total sex, annual frequency, and unit “Number”, so the visible population is a single explicitly filtered statistical cell rather than an arbitrary first record.</p>
  </div>
}
