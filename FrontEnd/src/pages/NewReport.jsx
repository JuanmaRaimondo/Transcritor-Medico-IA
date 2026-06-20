import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  User, 
  FileText, 
  Mic, 
  StopCircle, 
  Wand2, 
  Save, 
  Download, 
  MessageSquare, 
  RefreshCw,
  PlayCircle,
  Trash2
} from 'lucide-react';
import Header from '../components/Header';
import html2pdf from 'html2pdf.js';
import api from '../utils/api';

const MOCK_PATIENTS = [
  { id: 'PAC-101', nombre: 'Laura', apellido: 'Gómez' },
  { id: 'PAC-102', nombre: 'Carlos', apellido: 'Rodríguez' }
];

const STUDY_TYPES = [
  'Consulta General',
  'Ecografía Abdominal',
  'Resonancia Magnética',
  'Evolución de Guardia'
];

function NewReport() {
  const navigate = useNavigate();

  // Step 1: Contexto
  const [pacientes, setPacientes] = useState([]);
  const [pacienteId, setPacienteId] = useState('');
  const [tipoEstudio, setTipoEstudio] = useState('');

  // Step 2: Audio Input (Solo Grabación)
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Step 3: Review & Feedback
  const [generatedReport, setGeneratedReport] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [isRewriting, setIsRewriting] = useState(false);

  // Step 4: Final Actions
  const [isSaving, setIsSaving] = useState(false);
  
  const reportRef = useRef(null);

  useEffect(() => {
    const fetchPacientes = async () => {
      try {
        const response = await api.get('/api/paciente/listapacientes');
        setPacientes(response.data);
      } catch (error) {
        console.warn('No se pudieron cargar los pacientes reales, usando datos de prueba', error);
        setPacientes(MOCK_PATIENTS);
      }
    };
    fetchPacientes();
  }, []);

  // --- Audio Recording Handlers ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const file = new File([blob], 'dictado_medico.webm', { type: 'audio/webm' });
        setAudioFile(file);
        stream.getTracks().forEach(track => track.stop());
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setAudioFile(null); 
      setGeneratedReport(null); // Limpiamos si había un reporte viejo
      toast.success('Grabación iniciada');
    } catch (err) {
      console.error(err);
      toast.error('Error al acceder al micrófono. Verifica los permisos.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
      toast.success('Audio grabado correctamente. Listo para procesar.');
    }
  };

  const discardAudio = () => {
    setAudioFile(null);
    setGeneratedReport(null);
  };

  // --- API Handlers ---
  const handleGenerateReport = async () => {
    if (!pacienteId) return toast.error('Selecciona un paciente');
    if (!tipoEstudio) return toast.error('Selecciona el tipo de estudio');
    if (!audioFile) return toast.error('Por favor, grabá el diagnóstico primero');

    setIsGenerating(true);
    
    const formData = new FormData();
    formData.append('idpaciente', pacienteId); 
    formData.append('tipoEstudio', tipoEstudio);
    formData.append('audio', audioFile); 

    try {
      const response = await api.post('/api/informe/subir-audio', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // Guardamos el objeto exacto que devuelve Spring Boot
      setGeneratedReport(response.data);
      toast.success('IA: Transcripción y análisis completados');
    } catch {
      console.warn('Backend no disponible, usando MOCK_DATA');
      setTimeout(() => {
        setGeneratedReport({
          id: 'INF-999',
          textoCrudo: 'el paciente presenta dolor abdominal agudo en fosa iliaca derecha con nauseas y fiebre de 37.8 solicito laboratorio urgente y ecografia abdominal derivar a cirugia',
          textoCorregido: 'MOTIVO DE CONSULTA:\nDolor abdominal agudo.\n\nSÍNTOMAS:\n- Náuseas.\n- Fiebre (37.8°C).\n\nHALLAZGOS:\n- Dolor en fosa ilíaca derecha.\n\nPLAN / TRATAMIENTO:\n- Laboratorio urgente.\n- Ecografía abdominal.\n- Derivación a Cirugía General.',
        });
        toast.success('Borrador generado (Modo Prueba)');
        setIsGenerating(false);
      }, 2500);
      return;
    }
    setIsGenerating(false);
  };

  const handleRewrite = async () => {
    if (!feedbackText.trim()) return toast.error('Ingresa algún feedback para la IA');
    setIsRewriting(true);

    try {
      const id = generatedReport.id || 'INF-999';
      const response = await api.put(`/api/informe/reescribir/${id}`, {
        feedback: feedbackText
      });
      
      setGeneratedReport(response.data);
      setFeedbackText('');
      toast.success('Informe actualizado con tus indicaciones');
    } catch {
       console.warn('Backend no disponible, simulando reescritura');
       setTimeout(() => {
          setGeneratedReport(prev => ({
            ...prev,
            textoCorregido: prev.textoCorregido + `\n\nAGREGADO POR EL MÉDICO: ${feedbackText}`
          }));
          setFeedbackText('');
          toast.success('Informe actualizado (Modo Prueba)');
          setIsRewriting(false);
       }, 1500);
       return;
    }
    setIsRewriting(false);
  };

  const handleSaveAndApprove = async () => {
    setIsSaving(true);
    try {
      const id = generatedReport.id || 'INF-999';
      await api.put(`/api/informe/finalizar/${id}`, {
        textoFinal: generatedReport.textoCorregido // Mandamos solo el texto limpio final
      });
      
      toast.success('Informe guardado y aprobado exitosamente');
      navigate('/');
    } catch {
      setTimeout(() => {
        toast.success('Informe guardado y aprobado exitosamente (Modo Prueba)');
        navigate('/');
      }, 1000);
    }
  };

  const downloadPDF = () => {
    if (!reportRef.current) return;
    const element = reportRef.current;
    const opt = {
      margin: 0.5,
      filename: `informe-${pacienteId || 'medico'}-${new Date().getTime()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    toast.loading('Generando PDF...', { id: 'pdf-toast' });
    html2pdf().set(opt).from(element).save().then(() => {
      toast.success('PDF descargado', { id: 'pdf-toast' });
    }).catch(err => {
      console.error(err);
      toast.error('Error al generar el PDF', { id: 'pdf-toast' });
    });
  };

  return (
    <>
      <Header />
      <div className="page-wrapper" style={{ backgroundColor: '#f9f9fa' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ color: '#111827', fontSize: '1.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <FileText color="var(--primary)" size={28} />
              Nuevo Dictado Médico
            </h1>
            <p className="text-secondary mt-2">Grabá tu diagnóstico y la IA estructurará el informe automáticamente.</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* TARJETA 1: CONFIGURACIÓN */}
          <div className="card" style={{ padding: '2rem', borderTop: '4px solid var(--primary)' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '0.9rem' }}>1</span>
              Contexto del Paciente
            </h2>
            
            <div className="split-screen" style={{ gap: '1.5rem' }}>
              <div className="form-group mb-0">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <User size={16} className="text-secondary" /> Paciente
                </label>
                <select 
                  className="form-control" 
                  value={pacienteId} 
                  onChange={(e) => setPacienteId(e.target.value)}
                  style={{ backgroundColor: '#fcfcfc' }}
                >
                  <option value="">Seleccionar Paciente...</option>
                  {pacientes.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} {p.apellido}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group mb-0">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <FileText size={16} className="text-secondary" /> Tipo de Estudio
                </label>
                <select 
                  className="form-control" 
                  value={tipoEstudio} 
                  onChange={(e) => setTipoEstudio(e.target.value)}
                  style={{ backgroundColor: '#fcfcfc' }}
                >
                  <option value="">Seleccionar Estudio...</option>
                  {STUDY_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* TARJETA 2: MICRÓFONO */}
          <div className={`card ${!pacienteId || !tipoEstudio ? 'opacity-50' : ''}`} style={{ padding: '2rem', transition: 'opacity 0.3s' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '0.9rem' }}>2</span>
              Dictado por Voz
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  padding: '2rem',
                  backgroundColor: isRecording ? '#fff1f2' : (audioFile ? '#f0fdf4' : '#f8fafc'),
                  border: `2px solid ${isRecording ? 'var(--danger)' : (audioFile ? 'var(--success)' : 'var(--border)')}`,
                  borderRadius: 'var(--radius-lg)',
                  transition: 'all 0.3s'
                }}
              >
                {!isRecording && !audioFile && (
                  <>
                    <button 
                      onClick={startRecording}
                      disabled={!pacienteId || !tipoEstudio}
                      className="btn btn-outline"
                      style={{ 
                        borderRadius: '50px', 
                        padding: '1.25rem 2.5rem', 
                        borderColor: 'var(--danger)', 
                        color: 'var(--danger)',
                        fontSize: '1.1rem',
                        fontWeight: 'bold'
                      }}
                    >
                      <Mic size={28} style={{ marginRight: '8px' }} />
                      Comenzar a Dictar
                    </button>
                    <p className="text-secondary mt-3" style={{ fontSize: '0.9rem' }}>Asegúrate de hablar claro y cerca del micrófono.</p>
                  </>
                )}

                {isRecording && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <div className="spinner" style={{ borderColor: 'rgba(239,68,68,0.2)', borderTopColor: 'var(--danger)', width: '4rem', height: '4rem', borderWidth: '4px' }}></div>
                    <span style={{ color: 'var(--danger)', fontWeight: 'bold', fontSize: '1.2rem', animation: 'pulse 1.5s infinite' }}>Escuchando...</span>
                    <button 
                      onClick={stopRecording}
                      className="btn"
                      style={{ 
                        backgroundColor: 'var(--danger)', 
                        color: 'white', 
                        borderRadius: '50px', 
                        padding: '1rem 2rem',
                        marginTop: '1rem',
                        fontSize: '1rem'
                      }}
                    >
                      <StopCircle size={24} style={{ marginRight: '8px' }} />
                      Finalizar Dictado
                    </button>
                  </div>
                )}

                {!isRecording && audioFile && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textAlign: 'center' }}>
                    <PlayCircle size={48} style={{ color: 'var(--success)' }} />
                    <div>
                      <h4 style={{ color: 'var(--success)', fontSize: '1.2rem', fontWeight: 'bold' }}>¡Audio capturado con éxito!</h4>
                      <p className="text-secondary mt-1">Listo para ser procesado por la Inteligencia Artificial.</p>
                    </div>
                    <button onClick={discardAudio} className="btn btn-outline mt-2" style={{ color: 'var(--danger)', borderColor: 'var(--danger)', borderRadius: '50px' }}>
                      <Trash2 size={18} style={{ marginRight: '6px' }} /> Descartar y volver a grabar
                    </button>
                  </div>
                )}
              </div>
              
              {audioFile && (
                <div style={{ marginTop: '0.5rem', textAlign: 'center' }}>
                  <button 
                    onClick={handleGenerateReport}
                    disabled={isGenerating}
                    className="btn"
                    style={{ 
                      backgroundColor: 'var(--accent)', 
                      color: 'white', 
                      padding: '1rem 2rem',
                      fontSize: '1.1rem',
                      width: '100%',
                      justifyContent: 'center',
                      boxShadow: 'var(--shadow-md)',
                      borderRadius: 'var(--radius-md)'
                    }}
                  >
                    {isGenerating ? (
                      <>
                        <div className="spinner" style={{ width: '1.2rem', height: '1.2rem' }}></div>
                        Transcribiendo y Estructurando...
                      </>
                    ) : (
                      <>
                        <Wand2 size={24} style={{ marginRight: '8px' }} />
                        Procesar Dictado con IA
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* TARJETA 3: REVISIÓN Y FEEDBACK */}
          {generatedReport && (
            <div className="card" style={{ padding: '0', overflow: 'hidden', borderTop: '4px solid var(--success)', animation: 'fadeIn 0.5s ease-out' }}>
              <div style={{ padding: '2rem 2rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
                 <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)' }}>
                  <span style={{ backgroundColor: '#d1fae5', color: 'var(--success)', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '0.9rem' }}>3</span>
                  Resultado del Dictado
                </h2>
              </div>
              
              <div style={{ padding: '2rem', backgroundColor: '#f8fafc' }}>
                <div 
                  ref={reportRef} 
                  style={{ 
                    backgroundColor: 'white', 
                    padding: '2.5rem', 
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-sm)',
                    minHeight: '400px',
                    fontFamily: 'Inter, sans-serif'
                  }}
                >
                  <div style={{ borderBottom: '2px solid var(--border)', paddingBottom: '1.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <h1 style={{ fontSize: '1.5rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>Informe Médico Estructurado</h1>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        <p><strong>Paciente ID:</strong> {pacienteId}</p>
                        <p><strong>Estudio:</strong> {tipoEstudio}</p>
                        <p><strong>Fecha:</strong> {new Date().toLocaleDateString('es-ES')}</p>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    
                    {/* TEXTO CRUDO (Lo que escuchó la IA) */}
                    <div style={{ backgroundColor: '#f3f4f6', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid #9ca3af' }}>
                      <h3 style={{ fontSize: '1rem', color: '#4b5563', textTransform: 'uppercase', marginBottom: '0.75rem', fontWeight: 'bold' }}>
                        Transcripción Original (Texto Crudo)
                      </h3>
                      <p style={{ color: '#374151', fontStyle: 'italic', lineHeight: '1.6' }}>
                        "{generatedReport.textoCrudo || 'No se detectó texto en el dictado.'}"
                      </p>
                    </div>

                    {/* TEXTO CORREGIDO (Estructura IA) */}
                    <div>
                      <h3 style={{ fontSize: '1.1rem', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '1rem', fontWeight: 'bold', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                        Diagnóstico Estructurado
                      </h3>
                      <p style={{ color: '#111827', whiteSpace: 'pre-wrap', lineHeight: '1.8', fontSize: '1.05rem' }}>
                        {generatedReport.textoCorregido || 'La IA no pudo estructurar el texto.'}
                      </p>
                    </div>

                  </div>
                </div>
              </div>

              <div style={{ padding: '2rem', backgroundColor: 'var(--bg-card)' }}>
                 <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MessageSquare size={18} className="text-secondary" />
                    ¿Necesitás ajustar algo del diagnóstico?
                 </h3>
                 <textarea 
                    className="form-control"
                    placeholder="Ej: Aclará que la fiebre empezó hace 48hs, o agregá Paracetamol al tratamiento..."
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    style={{ minHeight: '80px', marginBottom: '1rem', backgroundColor: '#f9fafb' }}
                 ></textarea>
                 
                 <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                   <button 
                     onClick={handleRewrite}
                     disabled={isRewriting || !feedbackText.trim()}
                     className="btn btn-outline"
                     style={{ color: 'var(--primary)', borderColor: 'var(--primary)', backgroundColor: 'var(--primary-light)' }}
                   >
                     {isRewriting ? (
                       <><div className="spinner" style={{ width: '1rem', height: '1rem', borderWidth: '2px' }}></div> Actualizando...</>
                     ) : (
                       <><RefreshCw size={18} /> ✨ Aplicar corrección con IA</>
                     )}
                   </button>
                 </div>
              </div>
            </div>
          )}

          {/* TARJETA 4: ACCIONES FINALES */}
          {generatedReport && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', marginBottom: '4rem' }}>
               <button 
                 onClick={downloadPDF}
                 className="btn btn-outline"
                 style={{ padding: '0.75rem 1.5rem', backgroundColor: 'white' }}
               >
                 <Download size={20} style={{ marginRight: '6px' }} />
                 Descargar PDF
               </button>
               <button 
                 onClick={handleSaveAndApprove}
                 disabled={isSaving}
                 className="btn"
                 style={{ backgroundColor: 'var(--success)', color: 'white', padding: '0.75rem 2rem' }}
               >
                 {isSaving ? (
                   <><div className="spinner" style={{ marginRight: '6px' }}></div> Guardando...</>
                 ) : (
                   <><Save size={20} style={{ marginRight: '6px' }} /> Finalizar y Guardar</>
                 )}
               </button>
            </div>
          )}

        </div>
      </div>
    </div>
    </>
  );
}

export default NewReport;