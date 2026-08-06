import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { FileText, Mic, ClipboardList } from 'lucide-react';

const Menu = () => {
  const navigate = useNavigate();

  return (
    <>
      <Header />
      <main className="page-wrapper">
        <div className="container" style={{ maxWidth: '900px', paddingTop: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>¿Qué querés hacer hoy?</h1>
          <p className="text-secondary mb-6">Elegí una opción para empezar.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
            <button
              className="card"
              onClick={() => navigate('/informes')}
              style={{ padding: '2rem', textAlign: 'left', cursor: 'pointer', border: 'none', borderTop: '4px solid var(--primary)' }}
            >
              <FileText size={32} className="text-primary mb-3" />
              <h2 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>Ver informes</h2>
              <p className="text-secondary" style={{ fontSize: '0.9rem' }}>Consultá tus informes ya realizados, filtrados por paciente o estudio.</p>
            </button>

            <button
              className="card"
              onClick={() => navigate('/new-report')}
              style={{ padding: '2rem', textAlign: 'left', cursor: 'pointer', border: 'none', borderTop: '4px solid var(--accent)' }}
            >
              <Mic size={32} className="text-primary mb-3" />
              <h2 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>Transcribir libremente</h2>
              <p className="text-secondary" style={{ fontSize: '0.9rem' }}>Dictá el informe completo sin plantilla.</p>
            </button>

            <button
              className="card"
              onClick={() => navigate('/new-report-plantilla')}
              style={{ padding: '2rem', textAlign: 'left', cursor: 'pointer', border: 'none', borderTop: '4px solid var(--success)' }}
            >
              <ClipboardList size={32} className="text-primary mb-3" />
              <h2 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>Transcribir desde plantilla</h2>
              <p className="text-secondary" style={{ fontSize: '0.9rem' }}>Elegí el estudio y completá con frases rápidas + dictado.</p>
            </button>
          </div>
        </div>
      </main>
    </>
  );
};

export default Menu;