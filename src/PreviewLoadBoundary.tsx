import { Component, type ErrorInfo, type ReactNode } from 'react'

type PreviewLoadBoundaryProps = {
  children: ReactNode
  resetKey: string
}

type PreviewLoadBoundaryState = { failed: boolean }

export class PreviewLoadBoundary extends Component<PreviewLoadBoundaryProps, PreviewLoadBoundaryState> {
  state: PreviewLoadBoundaryState = { failed: false }

  static getDerivedStateFromError(): PreviewLoadBoundaryState {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Semantic preview failed to render or load.', error, info)
  }

  componentDidUpdate(previousProps: PreviewLoadBoundaryProps) {
    if (this.state.failed && previousProps.resetKey !== this.props.resetKey) {
      this.setState({ failed: false })
    }
  }

  render() {
    if (!this.state.failed) return this.props.children

    return <div
      className="response-preview-load-error"
      role="alert"
      aria-label="Semantic preview failed to load"
      data-preview-load-state="error"
    >
      <b>Semantic preview unavailable</b>
      <p>The API response is still available in Raw JSON below. Reload the application to fetch the current preview code.</p>
      <button type="button" onClick={() => window.location.reload()}>Reload application</button>
    </div>
  }
}
