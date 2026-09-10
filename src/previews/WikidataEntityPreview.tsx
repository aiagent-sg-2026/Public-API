import { asRecord, CardEmpty, CardHeading, Facts, rows, text } from './cardPrimitives'

const entityId = (uri?: string) => uri?.match(/\/entity\/(Q\d+)$/i)?.[1]?.toUpperCase()

export function WikidataEntityPreview({ data }: { data: unknown }) {
  const root = asRecord(data)
  const result = asRecord(root.results)
  const head = asRecord(root.head)
  const entities = rows(result.bindings).map((binding) => {
    const item = asRecord(binding.item)
    const itemLabel = asRecord(binding.itemLabel)
    const uri = text(item.value)
    return {
      uri,
      qid: entityId(uri),
      label: text(itemLabel.value),
      labelLanguage: text(itemLabel['xml:lang']),
      itemType: text(item.type),
      labelType: text(itemLabel.type),
    }
  }).filter((entity) => entity.uri || entity.label)

  if (!entities.length) {
    return <CardEmpty domain="knowledge-entities" title="No Wikidata city bindings returned" detail="The SPARQL result contained no usable item bindings." state="empty"/>
  }

  const variables = Array.isArray(head.vars) ? head.vars.filter((value): value is string => typeof value === 'string') : []
  const first = entities[0]
  return <div
    className="domain-card wikidata-entity-preview"
    data-domain-card="knowledge-entities"
    data-result-state="ready"
    data-result-count={entities.length}
    data-primary-qid={first.qid}
    data-primary-label={first.label}
    data-sparql-variables={variables.join(',')}
  >
    <CardHeading
      eyebrow="Wikidata Query Service · SPARQL bindings"
      title={`${entities.length} city entit${entities.length === 1 ? 'y' : 'ies'}`}
      description="Each row preserves the Wikidata entity URI, stable QID, and returned English label from the same SPARQL binding."
    ><span className="domain-state">Bounded query result</span></CardHeading>
    <Facts items={[
      { label: 'Returned bindings', value: String(entities.length) },
      { label: 'SPARQL variables', value: variables.length ? variables.join(', ') : 'Not supplied' },
      { label: 'Entity class', value: 'city (wd:Q515)' },
    ]}/>
    <ol className="wikidata-entity-list" aria-label="Wikidata city entity bindings">
      {entities.map((entity, index) => <li
        key={`${entity.uri ?? 'binding'}-${index}`}
        data-binding-index={index + 1}
        data-qid={entity.qid}
        data-entity-uri={entity.uri}
        data-label={entity.label}
        data-label-language={entity.labelLanguage}
      >
        <header><div><small>Binding {index + 1}</small><h4>{entity.label ?? entity.qid ?? 'Unlabelled Wikidata entity'}</h4></div>{entity.qid && <code>{entity.qid}</code>}</header>
        <Facts items={[
          { label: 'Entity URI', value: entity.uri ? <code>{entity.uri}</code> : 'Not supplied' },
          { label: 'Label language', value: entity.labelLanguage ?? 'Not supplied' },
          { label: 'Binding types', value: [entity.itemType, entity.labelType].filter(Boolean).join(' / ') || 'Not supplied' },
        ]}/>
      </li>)}
    </ol>
    <p className="domain-note">This is a bounded SPARQL result, not a complete or ranked list of all cities in Wikidata. Wikidata Query Service data can lag behind Wikidata edits.</p>
  </div>
}
