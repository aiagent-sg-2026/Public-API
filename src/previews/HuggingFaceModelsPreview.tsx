import { CardEmpty, CardHeading, finite, rows, text } from './cardPrimitives'
import { SemanticCards } from './SemanticCards'

const exactCount = (value: unknown) => finite(value)?.toLocaleString('en') ?? 'Not supplied'
const dateOnly = (value: unknown) => text(value)?.slice(0, 10) ?? 'Not supplied'
const modelTags = (value: unknown) => Array.isArray(value) ? value.filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0) : []
const modelLicense = (model: Record<string, unknown>) => modelTags(model.tags).find((tag) => tag.startsWith('license:'))?.slice('license:'.length) || 'Not declared'
const accessLabel = (model: Record<string, unknown>) => {
  if (model.private === true) return 'Private'
  if (model.gated === true) return 'Gated'
  if (typeof model.gated === 'string' && model.gated.trim()) return `Gated · ${model.gated}`
  return 'Public'
}

export function HuggingFaceModelsPreview({ data }: { data: unknown }) {
  const models = rows(data)
  if (!models.length) return <CardEmpty domain="ai-model-catalog" title="No Hugging Face models returned" detail="The Hub model-search response did not include any model records for this query." state="empty"/>

  const visible = models.slice(0, 8)
  const first = visible[0]
  const firstId = text(first.id) ?? text(first.modelId) ?? 'Model 1'
  const firstLicense = modelLicense(first)
  const firstAccess = accessLabel(first)
  const cards = visible.map((model, index) => {
    const id = text(model.id) ?? text(model.modelId) ?? `Model ${index + 1}`
    const author = text(model.author) ?? id.split('/')[0] ?? 'Hugging Face'
    const tags = modelTags(model.tags)
    const license = modelLicense(model)
    const access = accessLabel(model)
    const task = text(model.pipeline_tag) ?? 'Not declared'
    const library = text(model.library_name) ?? 'Not declared'
    return {
      title: id,
      eyebrow: author,
      badge: access,
      metrics: [
        { label: 'Task', value: task },
        { label: 'Library', value: library },
        { label: 'Access', value: access },
        { label: 'License tag', value: license },
        { label: 'Downloads', value: exactCount(model.downloads) },
        { label: 'Likes', value: exactCount(model.likes) },
        { label: 'Last modified', value: dateOnly(model.lastModified) },
      ],
      tags: tags.filter((tag) => tag !== task && tag !== library && !tag.startsWith('license:')).slice(0, 5),
    }
  })

  return <div className="domain-card huggingface-models-preview" data-domain-card="ai-model-catalog" data-result-state="ready" data-row-count={models.length} data-visible-count={visible.length} data-primary-model-id={firstId} data-primary-access={firstAccess} data-primary-license={firstLicense}>
    <CardHeading eyebrow="Hugging Face · Hub model search" title={`${models.length} model${models.length === 1 ? '' : 's'} returned`} description="Model identity, task/library metadata, access state, provider license tag, popularity, and update time from the live Hub search response."><span className="domain-state">{visible.length} shown</span></CardHeading>
    <SemanticCards cards={cards} emptyTitle="No model records available"/>
    <p className="domain-note">Access and licence values are provider metadata. A public search result is not a statement that every model is ungated, unrestricted, or suitable for a particular use; review the model repository and its licence before reuse.</p>
  </div>
}
