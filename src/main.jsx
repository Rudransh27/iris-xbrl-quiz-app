import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Order matters: Bootstrap first so our token-driven styles override it.
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/tokens.css'
import './index.css'
import './styles/base.css'
import './styles/ui.css'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx';
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
