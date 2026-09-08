export type SemanticCard = {
  title: string
  eyebrow: string
  description?: string
  badge?: string
  metrics: Array<{ label: string; value: string }>
  tags?: string[]
}

export function SemanticCards({ cards, emptyTitle }: { cards: SemanticCard[]; emptyTitle: string }) {
  if (!cards.length) return <div className="weather-empty"><strong>{emptyTitle}</strong><span>The response did not include records for this demo layout.</span></div>
  const visibleCards = cards.slice(0, 8)
  return <div className={`semantic-card-grid ${visibleCards.length === 1 ? 'single' : ''}`} aria-label="Semantic response records" data-record-count={visibleCards.length}>{visibleCards.map((card, index) => <article data-record-index={index + 1} key={`${card.title}-${index}`}><header><span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><div><small>{card.eyebrow}</small><h3>{card.title}</h3></div>{card.badge && <em>{card.badge}</em>}</header>{card.description && <p>{card.description}</p>}<dl>{card.metrics.map((metric) => <div key={metric.label}><dt>{metric.label}</dt><dd>{metric.value}</dd></div>)}</dl>{card.tags?.length ? <footer aria-label="Record tags">{card.tags.slice(0, 5).map((tag) => <span key={tag}>{tag}</span>)}</footer> : null}</article>)}</div>
}
