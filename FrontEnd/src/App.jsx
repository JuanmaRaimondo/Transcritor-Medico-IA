import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Menu from './pages/Menu';
import Dashboard from './pages/Dashboard';
import ReviewReport from './pages/ReviewReport';
import NewReport from './pages/NewReport';
import PlantillaReport from './pages/PlantillaReport';
import FAQ from './pages/FAQ';

function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            padding: '16px',
            color: 'var(--text-primary)',
            background: 'var(--bg-card)',
            boxShadow: 'var(--shadow-lg)',
            borderRadius: 'var(--radius-md)'
          },
          success: { iconTheme: { primary: 'var(--success)', secondary: 'white' } },
          error: { iconTheme: { primary: 'var(--danger)', secondary: 'white' } },
        }}
      />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Menu /></ProtectedRoute>} />
          <Route path="/informes" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/review/:id" element={<ProtectedRoute><ReviewReport /></ProtectedRoute>} />
          <Route path="/new-report" element={<ProtectedRoute><NewReport /></ProtectedRoute>} />
          <Route path="/new-report-plantilla" element={<ProtectedRoute><PlantillaReport /></ProtectedRoute>} />
          <Route path="/faq" element={<ProtectedRoute><FAQ /></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;