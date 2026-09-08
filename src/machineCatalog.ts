import { getAgentExecutionPolicy, getAutomatedVerificationPolicy, type ApiDemo, type ApiField } from './apiCatalog'

export const MACHINE_CATALOG_SCHEMA_VERSION = 1 as const

export type MachineCatalogParameter = Pick<ApiField, 'id' | 'label' | 'type' | 'defaultValue' | 'help'> & {
  min?: number
  max?: number
  minLength?: number
  maxLength?: number
  options?: Array<{ label: string; value: string }>
}

export type MachineCatalogApi = {
  id: string
  name: string
  provider: string
  category: string
  description: string
  documentationUrl: string
  method: 'GET' | 'POST'
  keyRequired: false
  requestLabUrl: string
  agentExecution: ReturnType<typeof getAgentExecutionPolicy>
  automatedVerification?: Extract<ReturnType<typeof getAutomatedVerificationPolicy>, { mode: 'cadence-limited' }>
  usageNote?: string
  parameters: MachineCatalogParameter[]
}

export type MachineCatalog = {
  schemaVersion: typeof MACHINE_CATALOG_SCHEMA_VERSION
  catalogCount: number
  catalogPath: string
  requestLabPattern: string
  health: 'not-included'
  automatedVerificationDefault: { mode: 'enabled' }
  apis: MachineCatalogApi[]
}

const normalizeBase = (base: string): string => {
  const withLeadingSlash = base.startsWith('/') ? base : `/${base}`
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`
}

const exportParameter = ({ id, label, type, defaultValue, help, min, max, minLength, maxLength, options }: ApiField): MachineCatalogParameter => ({
  id,
  label,
  type,
  defaultValue,
  help,
  ...(min === undefined ? {} : { min }),
  ...(max === undefined ? {} : { max }),
  ...(minLength === undefined ? {} : { minLength }),
  ...(maxLength === undefined ? {} : { maxLength }),
  ...(options?.length ? { options: options.map(({ label: optionLabel, value }) => ({ label: optionLabel, value })) } : {}),
})

export const buildMachineCatalog = (apis: ApiDemo[], base = '/'): MachineCatalog => {
  const catalogPath = normalizeBase(base)
  return {
    schemaVersion: MACHINE_CATALOG_SCHEMA_VERSION,
    catalogCount: apis.length,
    catalogPath,
    requestLabPattern: `${catalogPath}#/request-lab?api={api-id}`,
    health: 'not-included',
    automatedVerificationDefault: { mode: 'enabled' },
    apis: apis.map((api) => ({
      id: api.id,
      name: api.name,
      provider: api.provider,
      category: api.category,
      description: api.description,
      documentationUrl: api.documentationUrl,
      method: api.method ?? 'GET',
      keyRequired: false,
      requestLabUrl: `${catalogPath}#/request-lab?api=${encodeURIComponent(api.id)}`,
      agentExecution: getAgentExecutionPolicy(api),
      ...(api.automatedVerification ? { automatedVerification: getAutomatedVerificationPolicy(api) as Extract<ReturnType<typeof getAutomatedVerificationPolicy>, { mode: 'cadence-limited' }> } : {}),
      ...(api.usageNote ? { usageNote: api.usageNote } : {}),
      parameters: api.fields.map(exportParameter),
    })),
  }
}
