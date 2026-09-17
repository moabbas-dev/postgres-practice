import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-dvh w-full flex-col items-center justify-center gap-3 bg-canvas px-6 text-center text-text-primary">
          <h1 className="text-lg font-semibold text-danger">Something went wrong</h1>
          <pre className="max-w-2xl overflow-auto whitespace-pre-wrap text-left text-xs text-text-secondary">
            {this.state.error.message}
            {'\n\n'}
            {this.state.error.stack}
          </pre>
          <button onClick={() => window.location.reload()} className="mt-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-canvas">
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
