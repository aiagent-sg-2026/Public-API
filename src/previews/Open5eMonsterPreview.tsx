import { asRecord, CardEmpty, CardHeading, finite, text } from './cardPrimitives'
import { SemanticCards } from './SemanticCards'

const display = (value: unknown) => text(value) ?? (finite(value) !== undefined ? String(finite(value)) : 'Not supplied')
const nestedName = (value: unknown) => text(asRecord(value).name) ?? 'Not supplied'

const speedSummary = (value: unknown) => {
  const speed = asRecord(value)
  const unit = text(speed.unit) ?? 'feet'
  const modes = ['walk', 'fly', 'burrow', 'climb', 'swim']
    .flatMap((mode) => finite(speed[mode]) === undefined ? [] : [`${mode} ${finite(speed[mode])} ${unit}`])
  return modes.length ? modes.join(' · ') : 'Not supplied'
}

export function Open5eMonsterPreview({ data }: { data: unknown }) {
  const root = asRecord(data)
  const results = Array.isArray(root.results) ? root.results.map(asRecord).filter((entry) => Object.keys(entry).length > 0) : []
  if (!results.length) return <CardEmpty domain="monster-statblock" title="No Open5e creatures returned" detail="The V2 creature search did not return any matching source records for this name." state="empty"/>

  const visible = results.slice(0, 8)
  const first = visible[0]
  const firstDocument = asRecord(first.document)
  const firstSystem = asRecord(firstDocument.gamesystem)
  const providerTotal = finite(root.count) ?? results.length
  const cards = visible.map((monster, index) => {
    const document = asRecord(monster.document)
    const gameSystem = asRecord(document.gamesystem)
    const name = text(monster.name) ?? `Creature ${index + 1}`
    const type = nestedName(monster.type)
    const size = nestedName(monster.size)
    return {
      title: name,
      eyebrow: `${size} ${type}`,
      badge: `CR ${display(monster.challenge_rating)}`,
      metrics: [
        { label: 'Armor class', value: display(monster.armor_class) },
        { label: 'Hit points', value: display(monster.hit_points) },
        { label: 'Hit dice', value: display(monster.hit_dice) },
        { label: 'Movement', value: speedSummary(monster.speed) },
        { label: 'Alignment', value: display(monster.alignment) },
        { label: 'Passive perception', value: display(monster.passive_perception) },
        { label: 'Source', value: display(document.name) },
        { label: 'Game system', value: display(gameSystem.name) },
      ],
      tags: [text(monster.key), text(document.key), text(gameSystem.key)].filter((value): value is string => Boolean(value)),
    }
  })

  return <div className="domain-card open5e-monster-preview" data-domain-card="monster-statblock" data-result-state="ready" data-api-version="v2" data-provider-total={providerTotal} data-visible-count={visible.length} data-primary-monster-key={text(first.key) ?? ''} data-primary-monster-name={text(first.name) ?? ''} data-primary-source={text(firstDocument.name) ?? ''} data-primary-game-system={text(firstSystem.name) ?? ''}>
    <CardHeading eyebrow="Open5e V2 · creatures" title={`${providerTotal.toLocaleString('en')} matching creature source record${providerTotal === 1 ? '' : 's'}`} description="Current V2 creature search with source-aware combat statistics. The card keeps different published versions distinct instead of collapsing familiar monster names across source documents or game systems."><span className="domain-state">{visible.length} shown</span></CardHeading>
    <SemanticCards cards={cards} emptyTitle="No creature records available"/>
    <p className="domain-note">Open5e V2 is the provider's current API. This demo searches creature names case-insensitively and projects only the fields used here; source/game-system labels explain why the same monster name can legitimately appear in multiple records.</p>
  </div>
}
