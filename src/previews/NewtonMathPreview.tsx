import { asRecord, CardEmpty, CardHeading, Facts, text } from './cardPrimitives'

const operationLabels: Record<string, string> = {
  simplify: 'Simplify',
  factor: 'Factor',
  derive: 'Differentiate',
  zeroes: 'Find zeroes',
}

const resultText = (value: unknown) => {
  if (Array.isArray(value)) return value.map((item) => typeof item === 'string' || typeof item === 'number' ? String(item) : JSON.stringify(item)).join(', ')
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return text(value)
}

export function NewtonMathPreview({ data }: { data: unknown }) {
  const root = asRecord(data)
  const operation = text(root.operation)
  const expression = text(root.expression)
  const result = resultText(root.result)
  if (!operation || !expression || !result) {
    return <CardEmpty domain="symbolic-math" title="Math result unavailable" detail="Newton did not return the expected operation, expression, and result fields for this request." state="invalid"/>
  }

  const operationLabel = operationLabels[operation] ?? operation
  const zeroCount = operation === 'zeroes' && Array.isArray(root.result) ? root.result.length : undefined

  return <div className="domain-card newton-math-preview" data-domain-card="symbolic-math" data-result-state="ready" data-operation={operation} data-expression={expression} data-result={result}>
    <CardHeading eyebrow="Newton API · symbolic arithmetic" title={`${operationLabel} result`} description="The provider-returned expression and symbolic result are kept explicit so humans and browser agents can distinguish the requested operation from its output."><span className="domain-state">V2 result</span></CardHeading>
    <Facts items={[
      { label: 'Operation', value: operationLabel },
      { label: 'Input expression', value: <code>{expression}</code> },
      { label: 'Result', value: <code>{result}</code> },
      ...(zeroCount === undefined ? [] : [{ label: 'Zeroes returned', value: String(zeroCount) }]),
    ]}/>
    <p className="domain-note">Newton is a community-maintained symbolic math service. Public-API calls the current Vercel deployment directly and keeps this demo marked Review rather than treating it as a guaranteed-uptime dependency.</p>
  </div>
}
