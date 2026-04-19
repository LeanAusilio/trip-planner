import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, fontFamily: 'system-ui, sans-serif', color: '#111' }}>
          <h2 style={{ marginBottom: 8 }}>Something went wrong</h2>
          <pre style={{ background: '#f3f4f6', padding: 16, borderRadius: 8, fontSize: 13, overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {this.state.error.toString()}
            {'\n'}
            {this.state.error.stack}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
