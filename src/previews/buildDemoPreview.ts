import { findPreviewRecords, previewLabel, previewTitleKeys, previewValue } from './previewData'

export type DemoPreviewItem = {
  title: string
  fields: Array<{ label: string; value: string }>
}

export const buildDemoPreview = (data: unknown): DemoPreviewItem[] => {
  const records = findPreviewRecords(data)
  if (!records.length) {
    if (Array.isArray(data)) return data.slice(0, 6).map((value, index) => ({ title: `Result ${index + 1}`, fields: [{ label: 'Value', value: previewValue(value) }] }))
    return [{ title: 'Response value', fields: [{ label: 'Value', value: previewValue(data) }] }]
  }
  return records.slice(0, 6).map((record, index) => {
    const entries = Object.entries(record)
    let titleEntry: [string, unknown] | undefined
    for (const preferredKey of previewTitleKeys) {
      titleEntry = entries.find(([key, value]) => key.toLowerCase() === preferredKey && ['string', 'number'].includes(typeof value))
      if (titleEntry) break
    }
    const fields = entries
      .filter(([key, value]) => key !== titleEntry?.[0] && value !== undefined)
      .slice(0, 6)
      .map(([key, value]) => ({ label: previewLabel(key), value: previewValue(value) }))
    return { title: titleEntry ? previewValue(titleEntry[1]) : `Result ${index + 1}`, fields: fields.length ? fields : [{ label: 'Value', value: previewValue(record) }] }
  })
}
