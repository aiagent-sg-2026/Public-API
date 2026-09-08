import { asRecord, CardEmpty, CardHeading, Facts, finite, text } from './cardPrimitives'

type PrayerKey = 'Fajr' | 'Sunrise' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha'

const primarySchedule: Array<{ key: PrayerKey; label: string; kind: string }> = [
  { key: 'Fajr', label: 'Fajr', kind: 'Prayer' },
  { key: 'Sunrise', label: 'Sunrise', kind: 'Solar marker' },
  { key: 'Dhuhr', label: 'Dhuhr', kind: 'Prayer' },
  { key: 'Asr', label: 'Asr', kind: 'Prayer' },
  { key: 'Maghrib', label: 'Maghrib', kind: 'Prayer' },
  { key: 'Isha', label: 'Isha', kind: 'Prayer' },
]

const timeValue = (timings: Record<string, unknown>, key: string) => text(timings[key])

export function PrayerTimesPreview({ data }: { data: unknown }) {
  const root = asRecord(data)
  const payload = Object.keys(asRecord(root.data)).length ? asRecord(root.data) : root
  const timings = asRecord(payload.timings)
  const date = asRecord(payload.date)
  const gregorian = asRecord(date.gregorian)
  const hijri = asRecord(date.hijri)
  const meta = asRecord(payload.meta)
  const method = asRecord(meta.method)
  const methodId = finite(method.id)
  const methodName = text(method.name)
  const timezone = text(meta.timezone)
  const gregorianDate = text(gregorian.date)
  const hijriDate = text(hijri.date)
  const readableDate = text(date.readable) ?? gregorianDate
  const hijriMonth = text(asRecord(hijri.month).en)
  const hijriYear = text(hijri.year)
  const hijriDesignation = text(asRecord(hijri.designation).abbreviated)
  const latitude = finite(meta.latitude)
  const longitude = finite(meta.longitude)
  const primaryTimes = Object.fromEntries(primarySchedule.map(({ key }) => [key, timeValue(timings, key)])) as Record<PrayerKey, string | undefined>
  const availablePrimary = primarySchedule.filter(({ key }) => primaryTimes[key])

  if (!availablePrimary.length) {
    return <CardEmpty domain="prayer-schedule" title="Prayer times unavailable" detail="The response did not include the daily prayer timing fields expected from this endpoint."/>
  }

  const additional = [
    { label: 'Imsak', value: timeValue(timings, 'Imsak') },
    { label: 'Sunset', value: timeValue(timings, 'Sunset') },
    { label: 'Midnight', value: timeValue(timings, 'Midnight') },
    { label: 'First third', value: timeValue(timings, 'Firstthird') },
    { label: 'Last third', value: timeValue(timings, 'Lastthird') },
  ].filter((item): item is { label: string; value: string } => Boolean(item.value))

  const dateDescription = [
    hijriDate ? `${hijriDate}${hijriDesignation ? ` ${hijriDesignation}` : ''}` : undefined,
    hijriMonth && hijriYear ? `${hijriMonth} ${hijriYear}` : undefined,
  ].filter(Boolean).join(' · ')

  return <div
    className="domain-card prayer-times-preview"
    data-domain-card="prayer-schedule"
    data-result-state="ready"
    data-primary-fajr-time={primaryTimes.Fajr}
    data-primary-dhuhr-time={primaryTimes.Dhuhr}
    data-primary-asr-time={primaryTimes.Asr}
    data-primary-maghrib-time={primaryTimes.Maghrib}
    data-primary-isha-time={primaryTimes.Isha}
    data-gregorian-date={gregorianDate}
    data-hijri-date={hijriDate}
    data-timezone={timezone}
    data-calculation-method-id={methodId}
  >
    <CardHeading
      eyebrow="Daily prayer schedule"
      title={readableDate ?? 'Prayer times'}
      description={dateDescription || 'Prayer timings returned for the selected coordinates.'}
    >
      {methodId !== undefined && <span className="domain-state">Method {methodId}</span>}
    </CardHeading>

    <ol className="prayer-time-list" aria-label="Daily prayer schedule">
      {availablePrimary.map(({ key, label, kind }, index) => <li key={key} data-prayer={key.toLowerCase()} data-time={primaryTimes[key]}>
        <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
        <div><strong>{label}</strong><small>{kind}</small></div>
        <time dateTime={primaryTimes[key]}>{primaryTimes[key]}</time>
      </li>)}
    </ol>

    <Facts items={[
      { label: 'Gregorian date', value: gregorianDate ?? 'Not supplied' },
      { label: 'Hijri date', value: hijriDate ? `${hijriDate}${hijriDesignation ? ` ${hijriDesignation}` : ''}` : 'Not supplied' },
      { label: 'Timezone', value: timezone ?? 'Not supplied' },
      { label: 'Calculation method', value: methodName ?? (methodId === undefined ? 'Not supplied' : `Method ${methodId}`) },
      { label: 'Coordinates', value: latitude !== undefined && longitude !== undefined ? `${latitude}, ${longitude}` : 'Not supplied' },
      { label: 'Asr school', value: text(meta.school) ?? 'Not supplied' },
    ]}/>

    {additional.length > 0 && <section className="prayer-extra" aria-labelledby="prayer-extra-heading">
      <h4 id="prayer-extra-heading">Additional timing markers</h4>
      <dl>{additional.map(({ label, value }) => <div key={label}><dt>{label}</dt><dd><time dateTime={value}>{value}</time></dd></div>)}</dl>
    </section>}

    <p className="domain-note">Prayer times are provider-calculated for the selected coordinates and calculation method. AlAdhan documents its Hijri dates as mathematically calculated and notes they can differ from locally adopted dates. Raw JSON retains the complete response, including method parameters and calendar metadata.</p>
  </div>
}
