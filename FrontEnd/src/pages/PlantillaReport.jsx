import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { User, FileText, ClipboardList, Mic, StopCircle, ArrowUp, ArrowDown, X, Check } from 'lucide-react';
import Header from '../components/Header';
import api from '../utils/api';

function PlantillaReport() {
  const navigate = useNavigate();

  const [plantillas, setPlantillas] = useState([]);
  const [nombrePaciente, setNombrePaciente] = useState('');
  const [apellidoPaciente, setApellidoPaciente] = useState('');
  const [tipoEstudio, setTipoEstudio] = useState('');
  const [plantilla, setPlantilla] = useState(null);
  const [valores, setValores] = useState({});

  const [items, setItems] = useState([]); // frases/fragmentos que arman la interpretación, en orden

  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [borrador, setBorrador] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchPlantillas = async () => {
      try {
        const response = await api.get('/api/plantilla/listar');
        setPlantillas(response.data || []);
      } catch (error) {
        console.error(error);
        toast.error('No se pudieron cargar las plantillas');
      }
    };
    fetchPlantillas();
  }, []);

  const seleccionarTipoEstudio = (tipo) => {
    setTipoEstudio(tipo);
    const encontrada = plantillas.find(p => p.tipoEstudio === tipo) || null;
    setPlantilla(encontrada);
    setValores({});
    setItems([]);
  };

  // Detecta qué placeholders {{XXX}} tiene el procedimiento de la plantilla actual
  const placeholdersDetectados = plantilla
    ? [...new Set([...plantilla.procedimiento.matchAll(/{{(.*?)}}/g)].map(m => m[1]))]
    : [];

  const opcionesParaPlaceholder = (nombre) => {
    if (nombre === 'LATERALIDAD') return plantilla.opcionesLateralidad || [];
    return plantilla.opcionesCorte || []; // CORTE1 y CORTE2 comparten la misma lista
  };

  const faltanValores = placeholdersDetectados.some(ph => !valores[ph]);

  const procedimientoResuelto = () => {
    if (!plantilla) return '';
    let texto = plantilla.procedimiento;
    placeholdersDetectados.forEach(ph => {
      texto = texto.replaceAll(`{{${ph}}}`, valores[ph] || `{{${ph}}}`);
    });
    return texto;
  };

  // --- Interpretación: chips ---
  const agregarFrase = (frase) => {
    setItems(prev => [...prev, frase]);
  };

  const quitarItem = (index) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const moverItem = (index, direccion) => {
    setItems(prev => {
      const nuevo = [...prev];
      const destino = index + direccion;
      if (destino < 0 || destino >= nuevo.length) return nuevo;
      [nuevo[index], nuevo[destino]] = [nuevo[destino], nuevo[index]];
      return nuevo;
    });
  };

  // --- Mini-dictado para agregar algo puntual ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const file = new File([blob], 'fragmento.webm', { type: 'audio/webm' });

        setIsTranscribing(true);
        const formData = new FormData();
        formData.append('audio', file);
        try {
          const response = await api.post('/api/informe/transcribir-fragmento', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          setBorrador(response.data.texto || '');
        } catch (error) {
          console.error(error);
          toast.error('Error al transcribir el fragmento');
        } finally {
          setIsTranscribing(false);
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error(err);
      toast.error('Error al acceder al micrófono. Verificá los permisos.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const confirmarBorrador = () => {
    if (!borrador.trim()) return;
    agregarFrase(borrador.trim());
    setBorrador('');
  };

  // --- Envío final ---
  const handleSubmit = async () => {
    if (!nombrePaciente.trim() || !apellidoPaciente.trim()) return toast.error('Ingresá nombre y apellido del paciente');
    if (!tipoEstudio) return toast.error('Seleccioná el tipo de estudio');
    if (faltanValores) return toast.error('Completá todos los datos del procedimiento');
    if (items.length === 0) return toast.error('Agregá al menos un hallazgo a la interpretación');

    setIsSubmitting(true);
    try {
      const response = await api.post('/api/informe/crear-desde-plantilla', {
        nombrePaciente,
        apellidoPaciente,
        tipoEstudio,
        valoresPlaceholders: valores,
        interpretacion: items.join(' ')
      });
      toast.success('Informe creado');
      navigate(`/review/${response.data.id}`);
    } catch (error) {
      console.error(error);
      toast.error('Error al crear el informe');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <div className="page-wrapper" style={{ backgroundColor: '#f9f9fa' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ color: '#111827', fontSize: '1.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <ClipboardList color="var(--primary)" size={28} />
              Transcribir desde Plantilla
            </h1>
            <p className="text-secondary mt-2">Elegí el estudio, completá los datos del procedimiento y armá la interpretación con frases rápidas o dictado.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* TARJETA 1: CONTEXTO */}
            <div className="card" style={{ padding: '2rem', borderTop: '4px solid var(--primary)' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '0.9rem' }}>1</span>
                Contexto del Paciente
              </h2>

              <div className="split-screen" style={{ gap: '1.5rem' }}>
                <div className="form-group mb-0">
                  <label className="form-label"><User size={16} className="text-secondary" /> Nombre del paciente</label>
                  <input type="text" className="form-control" value={nombrePaciente} onChange={(e) => setNombrePaciente(e.target.value)} />
                </div>
                <div className="form-group mb-0">
                  <label className="form-label"><User size={16} className="text-secondary" /> Apellido del paciente</label>
                  <input type="text" className="form-control" value={apellidoPaciente} onChange={(e) => setApellidoPaciente(e.target.value)} />
                </div>
              </div>

              <div className="form-group mb-0 mt-4">
                <label className="form-label"><FileText size={16} className="text-secondary" /> Tipo de Estudio</label>
                <select className="form-control" value={tipoEstudio} onChange={(e) => seleccionarTipoEstudio(e.target.value)}>
                  <option value="">Seleccionar Estudio...</option>
                  {plantillas.map(p => (
                    <option key={p.tipoEstudio} value={p.tipoEstudio}>{p.tipoEstudio}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* TARJETA 2: PROCEDIMIENTO */}
            {plantilla && (
              <div className="card" style={{ padding: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '0.9rem' }}>2</span>
                  Procedimiento
                </h2>

                {placeholdersDetectados.length > 0 ? (
                  <div className="split-screen" style={{ gap: '1.5rem', marginBottom: '1.5rem' }}>
                    {placeholdersDetectados.map(ph => (
                      <div className="form-group mb-0" key={ph}>
                        <label className="form-label">
                          {ph === 'LATERALIDAD' ? 'Lateralidad' : ph === 'CORTE1' ? 'Espesor de corte (mín.)' : 'Espesor de corte (máx.)'}
                        </label>
                        <select
                          className="form-control"
                          value={valores[ph] || ''}
                          onChange={(e) => setValores(prev => ({ ...prev, [ph]: e.target.value }))}
                        >
                          <option value="">Elegir...</option>
                          {opcionesParaPlaceholder(ph).map(op => (
                            <option key={op} value={op}>{op}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                ) : null}

                <div style={{ backgroundColor: '#f8fafc', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1.25rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  {procedimientoResuelto()}
                </div>
              </div>
            )}

            {/* TARJETA 3: INTERPRETACIÓN */}
            {plantilla && (
              <div className={`card ${faltanValores ? 'opacity-50' : ''}`} style={{ padding: '2rem', transition: 'opacity 0.3s' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '0.9rem' }}>3</span>
                  Interpretación
                </h2>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '1.5rem' }}>
                  {plantilla.bancoDeFrases.map((frase, i) => (
                    <button
                      key={i}
                      className="btn btn-outline"
                      style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem', borderRadius: '8px', textAlign: 'left' }}
                      onClick={() => agregarFrase(frase)}
                      disabled={faltanValores}
                    >
                      {frase.length > 60 ? frase.slice(0, 60) + '…' : frase}
                    </button>
                  ))}
                </div>

                {/* Lista reordenable de la interpretación armada */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1.5rem' }}>
                  {items.length === 0 && (
                    <p className="text-secondary" style={{ fontStyle: 'italic', fontSize: '0.9rem' }}>
                      Todavía no agregaste ningún hallazgo. Tocá una frase de arriba o dictá uno propio abajo.
                    </p>
                  )}
                  {items.map((item, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.6rem 0.8rem' }}>
                      <span style={{ flex: 1, fontSize: '0.95rem' }}>{item}</span>
                      <button className="btn btn-outline" style={{ padding: '0.3rem' }} onClick={() => moverItem(index, -1)} disabled={index === 0} title="Subir">
                        <ArrowUp size={14} />
                      </button>
                      <button className="btn btn-outline" style={{ padding: '0.3rem' }} onClick={() => moverItem(index, 1)} disabled={index === items.length - 1} title="Bajar">
                        <ArrowDown size={14} />
                      </button>
                      <button className="btn btn-outline" style={{ padding: '0.3rem', color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => quitarItem(index)} title="Quitar">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Mini-dictado para agregar algo puntual */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                  <label className="form-label">Agregar un hallazgo propio (por dictado o texto)</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <button
                      className="btn btn-outline"
                      style={{ borderRadius: '50%', width: '42px', height: '42px', padding: 0, flexShrink: 0, color: isRecording ? 'var(--danger)' : 'var(--primary)', borderColor: isRecording ? 'var(--danger)' : 'var(--primary)' }}
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={faltanValores || isTranscribing}
                      title={isRecording ? 'Detener' : 'Dictar'}
                    >
                      {isRecording ? <StopCircle size={20} /> : <Mic size={20} />}
                    </button>
                    <input
                      type="text"
                      className="form-control"
                      placeholder={isTranscribing ? 'Transcribiendo...' : 'Escribí o dictá un hallazgo...'}
                      value={borrador}
                      onChange={(e) => setBorrador(e.target.value)}
                      disabled={isTranscribing}
                    />
                    <button
                      className="btn btn-primary"
                      style={{ flexShrink: 0 }}
                      onClick={confirmarBorrador}
                      disabled={!borrador.trim() || isTranscribing}
                    >
                      <Check size={18} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* CONFIRMAR */}
            {plantilla && (
              <div style={{ textAlign: 'right' }}>
                <button
                  className="btn btn-primary"
                  style={{ padding: '0.85rem 2rem', fontSize: '1.05rem' }}
                  onClick={handleSubmit}
                  disabled={isSubmitting || faltanValores || items.length === 0}
                >
                  {isSubmitting ? <div className="spinner"></div> : 'Crear informe'}
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}

export default PlantillaReport;