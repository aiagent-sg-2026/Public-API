import { asRecord, CardEmpty, CardHeading, Facts, finite, numericText, rows, text } from './cardPrimitives'
import { cleanText } from './previewData'

const safeHttpUrl = (value: unknown) => {
  const candidate = text(value)
  if (!candidate) return undefined
  try {
    const url = new URL(candidate)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : undefined
  } catch {
    return undefined
  }
}

const dateValue = (value: unknown) => {
  const candidate = text(value)
  return candidate && /^\d{4}-\d{2}-\d{2}/.test(candidate) ? candidate.slice(0, 10) : undefined
}

const usd = (value: unknown) => {
  const number = finite(value)
  return number === undefined ? 'Not supplied' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(number)
}

export function FederalAgencyOverviewPreview({ data }: { data: unknown }) {
  const agency = asRecord(data)
  const name = cleanText(agency.name)
  const code = text(agency.toptier_code)
  if (!name && !code) return <CardEmpty domain="federal-agency-overview" title="Agency overview unavailable" detail="USAspending returned no recognizable agency overview fields."/>

  const defCodes = rows(agency.def_codes)
  const website = safeHttpUrl(agency.website)
  const budgetJustification = safeHttpUrl(agency.congressional_justification_url)
  const fiscalYear = finite(agency.fiscal_year)
  const agencyId = finite(agency.agency_id)
  const subtierCount = finite(agency.subtier_agency_count)

  return <div
    className="domain-card federal-agency-preview"
    data-domain-card="federal-agency-overview"
    data-result-state="ready"
    data-fiscal-year={fiscalYear}
    data-toptier-code={code}
    data-agency-id={agencyId}
    data-subtier-count={subtierCount}
    data-def-code-count={defCodes.length}
  >
    <CardHeading
      eyebrow="USAspending · Agency overview"
      title={name ?? `Agency ${code}`}
      description="Agency identity and reference metadata from the USAspending Agency Details overview endpoint."
    ><span className="domain-state">Overview, not spending totals</span></CardHeading>

    <Facts items={[
      { label: 'Fiscal year context', value: fiscalYear === undefined ? 'Not supplied' : `FY ${numericText(fiscalYear)}` },
      { label: 'Top-tier agency code', value: code ?? 'Not supplied' },
      { label: 'USAspending agency ID', value: agencyId === undefined ? 'Not supplied' : numericText(agencyId) },
      { label: 'Abbreviation', value: text(agency.abbreviation) ?? 'Not supplied' },
      { label: 'Subtier agencies', value: subtierCount === undefined ? 'Not supplied' : numericText(subtierCount) },
    ]}/>

    {cleanText(agency.mission) && <section className="federal-agency-mission" aria-labelledby="federal-agency-mission-heading"><h4 id="federal-agency-mission-heading">Mission</h4><p>{cleanText(agency.mission)}</p></section>}

    {(website || budgetJustification) && <section className="federal-agency-links" aria-labelledby="federal-agency-links-heading"><h4 id="federal-agency-links-heading">Official references</h4><ul>
      {website && <li><a href={website} target="_blank" rel="noreferrer">Open agency website</a></li>}
      {budgetJustification && <li><a href={budgetJustification} target="_blank" rel="noreferrer">Open congressional budget justification</a></li>}
    </ul></section>}

    {defCodes.length > 0 && <section className="federal-def-codes" aria-labelledby="federal-def-codes-heading"><header><h4 id="federal-def-codes-heading">Disaster Emergency Fund Codes</h4><span>{defCodes.length} supplied</span></header><ol>
      {defCodes.slice(0, 10).map((entry, index) => <li key={text(entry.code) ?? index} data-def-code={text(entry.code)} data-disaster={text(entry.disaster)}><strong>{text(entry.code) ?? 'Code not supplied'}</strong><div><span>{cleanText(entry.title) ?? 'Title not supplied'}</span><small>{cleanText(entry.public_law) ?? 'Public-law designation not supplied'}{text(entry.disaster) ? ` · ${text(entry.disaster)}` : ''}</small></div></li>)}
    </ol>{defCodes.length > 10 && <p>Showing 10 of {defCodes.length}; complete provider data remains in Raw JSON.</p>}</section>}

    <p className="domain-note">This endpoint is the agency overview used by USAspending's Agency Details page. It does not itself return award obligations or budgetary-resource totals; those are separate agency endpoints.</p>
  </div>
}

export function FederalAwardsPreview({ data }: { data: unknown }) {
  const root = asRecord(data)
  const awards = rows(root.results)
  if (!awards.length) return <CardEmpty domain="federal-awards" title="No contract awards returned" detail="USAspending returned no prime contract awards for this request." state="empty"/>

  const page = asRecord(root.page_metadata)
  const messages = Array.isArray(root.messages) ? root.messages.map((value) => text(value)).filter((value): value is string => Boolean(value)) : []
  const first = awards[0]
  return <div
    className="domain-card federal-awards-preview"
    data-domain-card="federal-awards"
    data-result-state="ready"
    data-result-count={awards.length}
    data-provider-limit={finite(root.limit)}
    data-spending-level={text(root.spending_level)}
    data-page={finite(page.page)}
    data-has-next={typeof page.hasNext === 'boolean' ? String(page.hasNext) : undefined}
    data-primary-award-id={text(first['Award ID'])}
    data-primary-recipient={text(first['Recipient Name'])}
    data-primary-award-amount={finite(first['Award Amount'])}
    data-primary-award-amount-semantic="total_obligation"
    data-primary-obligation-date={dateValue(first['Base Obligation Date'])}
  >
    <CardHeading
      eyebrow="USAspending · New prime contract awards"
      title={`${awards.length} award${awards.length === 1 ? '' : 's'} on this page`}
      description="The request uses new_awards_only, so each result’s base transaction date falls inside the selected federal fiscal year. Award identity, total obligation, agencies, contract type, and pagination context remain explicit."
    ><span className="domain-state">Base transaction date in selected FY</span></CardHeading>

    <ol className="federal-award-list" aria-label="USAspending prime contract awards">
      {awards.map((award, index) => {
        const awardId = text(award['Award ID'])
        const recipient = cleanText(award['Recipient Name']) ?? 'Recipient not supplied'
        const amount = finite(award['Award Amount'])
        const obligationDate = dateValue(award['Base Obligation Date'])
        const contractType = text(award['Contract Award Type'])
        const description = cleanText(award.Description)
        return <li
          key={`${awardId ?? 'award'}-${index}`}
          data-award-index={index + 1}
          data-award-id={awardId}
          data-recipient={recipient}
          data-award-amount={amount}
          data-award-amount-semantic="total_obligation"
          data-base-obligation-date={obligationDate}
          data-contract-award-type={contractType}
          data-awarding-agency={text(award['Awarding Agency'])}
          data-funding-agency={text(award['Funding Agency'])}
        >
          <header><div><small>{awardId ? `Award ${awardId}` : `Award ${index + 1}`}</small><h4>{recipient}</h4></div>{contractType && <span>{contractType}</span>}</header>
          <div className="federal-award-amount"><span>Award Amount · total obligation</span><strong>{usd(amount)}</strong><small>USD · award-level total_obligation</small></div>
          <Facts items={[
            { label: 'Base obligation date', value: obligationDate ? <time dateTime={obligationDate}>{obligationDate}</time> : 'Not supplied' },
            { label: 'Awarding agency', value: text(award['Awarding Agency']) ?? 'Not supplied' },
            { label: 'Awarding sub-agency', value: text(award['Awarding Sub Agency']) ?? 'Not supplied' },
            { label: 'Funding agency', value: text(award['Funding Agency']) ?? 'Not supplied' },
            { label: 'Funding sub-agency', value: text(award['Funding Sub Agency']) ?? 'Not supplied' },
          ]}/>
          {description && <p className="federal-award-description">{description}</p>}
        </li>
      })}
    </ol>

    <Facts items={[
      { label: 'Spending level', value: text(root.spending_level) ?? 'Not supplied' },
      { label: 'Provider result limit', value: finite(root.limit) === undefined ? 'Not supplied' : numericText(finite(root.limit)!) },
      { label: 'Page', value: finite(page.page) === undefined ? 'Not supplied' : numericText(finite(page.page)!) },
      { label: 'More results', value: typeof page.hasNext === 'boolean' ? (page.hasNext ? 'Yes' : 'No') : 'Not supplied' },
    ]}/>

    {messages.length > 0 && <section className="federal-award-messages" aria-labelledby="federal-award-messages-heading"><h4 id="federal-award-messages-heading">Provider messages</h4><ul>{messages.map((message, index) => <li key={index}>{message}</li>)}</ul></section>}
    <p className="domain-note">For contract awards, USAspending maps <strong>Award Amount</strong> to <code>total_obligation</code>. It is an award-level total obligation, not a single transaction amount or a potential award ceiling. The request uses <code>new_awards_only</code> and is limited to prime contract award types A-D.</p>
  </div>
}
