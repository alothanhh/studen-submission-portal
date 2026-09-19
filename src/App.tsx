import { Route, Routes } from 'react-router-dom'
import SubmitPage from './pages/SubmitPage'
import LoginPage from './pages/LoginPage'
import PortalPage from './pages/PortalPage'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<SubmitPage />} />
      <Route path="/portal/login" element={<LoginPage />} />
      <Route
        path="/portal"
        element={
          <ProtectedRoute>
            <PortalPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
