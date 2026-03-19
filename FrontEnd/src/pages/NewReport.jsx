import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  User, 
  FileText, 
  Mic, 
  StopCircle, 
  UploadCloud, 
  Wand2, 
  Save, 
  Download, 
  MessageSquare, 
  RefreshCw,
  Trash2,
  CheckCircle2
} from 'lucide-react';
import Header from '../components/Header';
import html2pdf from 'html2pdf.js';
import api from '../utils/api';

// Mantenemos el MOCK por si se cae el backend
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
  const [pacientes, setPacientes] = useState([]); // ¡Nuevo estado para pacientes reales!
  const [pacienteId, setPacienteId] = useState('');
  const [tipoEstudio, setTipoEstudio] = useState('');

  // Step 2: Audio Input
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);

  // Step 3: Review & Feedback
  const [generatedReport, setGeneratedReport] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [isRewriting, setIsRewriting] = useState(false);

  // Step 4: Final Actions
  const [isSaving, setIsSaving] = useState(false);
  
  const reportRef = useRef(null);

  // --- ¡NUEVO: Traer pacientes reales de tu MongoDB! ---
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
      toast.success('Grabación finalizada');
    }
  };

  // --- Drag & Drop Handlers ---
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragActive(true);
  };
  
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragActive(false);
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('audio/')) {
        setAudioFile(file);
        toast.success(`Archivo ${file.name} cargado correctamente`);
      } else {
        toast.error('Por favor, sube un archivo de audio válido (.wav, .mp3)');
      }
    }
  };

  const removeAudioFile = () => {
    setAudioFile(null);
  };

  // --- API Handlers ---
  const handleGenerateReport = async () => {
    if (!pacienteId) return toast.error('Selecciona un paciente');
    if (!tipoEstudio) return toast.error('Selecciona el tipo de estudio');
    if (!audioFile) return toast.error('Graba o sube un archivo de audio');

    setIsGenerating(true);
    
    const formData = new FormData();
    // ARREGLO 1: Quitamos el guion bajo para que coincida con tu Spring Boot
    formData.append('idpaciente', pacienteId); 
    formData.append('tipoEstudio', tipoEstudio);
    formData.append('audio', audioFile); // ARREGLO EXxtra: El controlador espera 'audio', no 'archivo'

    try {
      const response = await api.post('/api/informe/subir-audio', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // Importante: Asegurate de que el backend devuelva el JSON del informe acá, 
      // si devuelve un simple String, el PDF se va a ver raro.
      setGeneratedReport(response.data);
      toast.success('Borrador generado con éxito');
    } catch {
      console.warn('Backend no disponible, usando MOCK_DATA');
      setTimeout(() => {
        setGeneratedReport({
          id: 'INF-999',
          motivoConsulta: 'Dolor abdominal agudo en fosa ilíaca derecha.',
          sintomas: 'Náuseas, vómitos, fiebre leve de 37.8°C.',
          hallazgos: 'Abdomen doloroso a la palpación profunda, signo de McBurney positivo.',
          diagnostico: 'Apendicitis aguda a confirmar.',
          plan: 'Laboratorio urgente, ecografía abdominal, derivación a cirugía general.',
          fecha: new Date().toISOString()
        });
        toast.success('Borrador generado con éxito (Mock)');
        setIsGenerating(false);
      }, 2000);
      return;
    }
    setIsGenerating(false);
  };

  const handleRewrite = async () => {
    if (!feedbackText.trim()) return toast.error('Ingresa algún feedback para la IA');
    setIsRewriting(true);

    try {
      // ARREGLO 2: Usamos PUT y pasamos el ID por la URL
      const id = generatedReport.id || 'INF-999';
      const response = await api.put(`/api/informe/reescribir/${id}`, {
        feedback: feedbackText
      });
      
      // Actualizamos el reporte con la respuesta
      setGeneratedReport(response.data);
      setFeedbackText('');
      toast.success('Informe actualizado con tus indicaciones');
    } catch {
       console.warn('Backend no disponible, simulando reescritura');
       setTimeout(() => {
          setGeneratedReport(prev => ({
            ...prev,
            plan: prev.plan + `\nNota agregada: ${feedbackText}`
          }));
          setFeedbackText('');
          toast.success('Informe actualizado (Mock)');
          setIsRewriting(false);
       }, 1500);
       return;
    }
    setIsRewriting(false);
  };

  const handleSaveAndApprove = async () => {
    setIsSaving(true);
    try {
      // ARREGLO 3: Envolvemos el reporte en "textoFinal" para que coincida con tu DTO
      const id = generatedReport.id || 'INF-999';
      await api.put(`/api/informe/finalizar/${id}`, {
        textoFinal: JSON.stringify(generatedReport)
      });
      
      toast.success('Informe guardado y aprobado exitosamente');
      navigate('/');
    } catch {
      console.warn('Backend no disponible, simulando guardado');
      setTimeout(() => {
        toast.success('Informe guardado y aprobado exitosamente (Mock)');
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
              Nuevo Informe Médico
            </h1>
            <p className="text-secondary mt-2">Completa los pasos para generar un informe estructurado con IA.</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* TARJETA 1: CONFIGURACIÓN */}
          <div className="card" style={{ padding: '2rem', borderTop: '4px solid var(--primary)' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '0.9rem' }}>1</span>
              Configurar Contexto Médico
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
                  {/* AQUÍ MAPEAMOS LOS PACIENTES REALES */}
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

          {/* TARJETA 2: INGRESO DE AUDIO */}
          <div className={`card ${!pacienteId || !tipoEstudio ? 'opacity-50' : ''}`} style={{ padding: '2rem', transition: 'opacity 0.3s' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '0.9rem' }}>2</span>
              Grabar o Subir Dictado
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  padding: '2rem',
                  backgroundColor: isRecording ? '#fff1f2' : '#f8fafc',
                  border: `2px solid ${isRecording ? 'var(--danger)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-lg)',
                  transition: 'all 0.3s'
                }}
              >
                {!isRecording ? (
                  <button 
                    onClick={startRecording}
                    disabled={!pacienteId || !tipoEstudio}
                    className="btn btn-outline"
                    style={{ 
                      borderRadius: '50px', 
                      padding: '1rem 2rem', 
                      borderColor: 'var(--danger)', 
                      color: 'var(--danger)',
                      fontSize: '1rem'
                    }}
                  >
                    <Mic size={24} />
                    Grabar Audio Directamente
                  </button>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <div className="spinner" style={{ borderColor: 'rgba(239,68,68,0.2)', borderTopColor: 'var(--danger)', width: '3rem', height: '3rem', borderWidth: '4px' }}></div>
                    <span style={{ color: 'var(--danger)', fontWeight: '600', animation: 'pulse 1.5s infinite' }}>Grabando audio...</span>
                    <button 
                      onClick={stopRecording}
                      className="btn"
                      style={{ 
                        backgroundColor: 'var(--danger)', 
                        color: 'white', 
                        borderRadius: '50px', 
                        padding: '0.75rem 1.5rem'
                      }}
                    >
                      <StopCircle size={20} />
                      Detener Grabación
                    </button>
                  </div>
                )}
              </div>

              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontWeight: '500', position: 'relative' }}>
                 <div style={{ position: 'absolute', top: '50%', left: '0', right: '0', borderTop: '1px solid var(--border)', zIndex: 0 }}></div>
                 <span style={{ backgroundColor: 'var(--bg-card)', padding: '0 1rem', position: 'relative', zIndex: 1 }}>Ó</span>
              </div>

              <div 
                className={`dropzone ${isDragActive ? 'active' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{ position: 'relative', overflow: 'hidden' }}
              >
                {audioFile ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ backgroundColor: 'var(--success)', color: 'white', padding: '1rem', borderRadius: '50%' }}>
                      <CheckCircle2 size={32} />
                    </div>
                    <div>
                      <h4 style={{ color: 'var(--success)' }}>Audio Cargado</h4>
                      <p className="text-secondary mt-2">{audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)</p>
                    </div>
                    <button onClick={removeAudioFile} className="btn btn-outline mt-2" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                      <Trash2 size={16} /> Quitar Archivo
                    </button>
                  </div>
                ) : (
                  <>
                    <UploadCloud size={48} className="text-secondary mx-auto mb-4" />
                    <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Arrastra un archivo de audio aquí</h3>
                    <p className="text-secondary mb-4">Solo formatos .wav o .mp3 son compatibles</p>
                    <label className="btn btn-outline" style={{ cursor: 'pointer' }}>
                      <UploadCloud size={18} />
                      Explorar Archivos
                      <input 
                        type="file" 
                        accept="audio/wav, audio/mp3" 
                        style={{ display: 'none' }} 
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            setAudioFile(e.target.files[0]);
                          }
                        }}
                      />
                    </label>
                  </>
                )}
              </div>
              
              <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                <button 
                  onClick={handleGenerateReport}
                  disabled={!audioFile || isGenerating || !pacienteId || !tipoEstudio}
                  className="btn"
                  style={{ 
                    backgroundColor: 'var(--accent)', 
                    color: 'white', 
                    padding: '1rem 2rem',
                    fontSize: '1.1rem',
                    width: '100%',
                    justifyContent: 'center',
                    boxShadow: 'var(--shadow-md)'
                  }}
                >
                  {isGenerating ? (
                    <>
                      <div className="spinner"></div>
                      Procesando con IA...
                    </>
                  ) : (
                    <>
                      <Wand2 size={20} />
                      Generar Borrador con IA
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* TARJETA 3: REVISIÓN Y FEEDBACK */}
          {generatedReport && (
            <div className="card" style={{ padding: '0', overflow: 'hidden', borderTop: '4px solid var(--success)' }}>
              <div style={{ padding: '2rem 2rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
                 <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)' }}>
                  <span style={{ backgroundColor: '#d1fae5', color: 'var(--success)', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '0.9rem' }}>3</span>
                  Revisión del Informe Estructurado
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
                      <h1 style={{ fontSize: '1.5rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>Transcriptor Médico IA</h1>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        <p><strong>Paciente ID:</strong> {pacienteId}</p>
                        <p><strong>Estudio:</strong> {tipoEstudio}</p>
                        <p><strong>Fecha:</strong> {new Date().toLocaleDateString('es-ES')}</p>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {Object.entries(generatedReport)
                      .filter(([k]) => k !== 'id' && k !== 'fecha')
                      .map(([key, value]) => (
                        <div key={key}>
                          <h3 style={{ fontSize: '1.1rem', color: '#111827', textTransform: 'capitalize', marginBottom: '0.25rem' }}>
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </h3>
                          <p style={{ color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{value}</p>
                        </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ padding: '2rem', backgroundColor: 'var(--bg-card)' }}>
                 <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MessageSquare size={18} className="text-secondary" />
                    ¿No te convence? Pedile cambios a la IA
                 </h3>
                 <textarea 
                    className="form-control"
                    placeholder="Ej: Hacelo más resumido, agregá que se le recetó Ibuprofeno 600mg o corregí la edad..."
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
                       <><div className="spinner" style={{ width: '1rem', height: '1rem', borderWidth: '2px' }}></div> Procesando...</>
                     ) : (
                       <><RefreshCw size={18} /> ✨ Reescribir con Feedback</>
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
                 <Download size={20} />
                 Descargar PDF
               </button>
               <button 
                 onClick={handleSaveAndApprove}
                 disabled={isSaving}
                 className="btn"
                 style={{ backgroundColor: 'var(--success)', color: 'white', padding: '0.75rem 2rem' }}
               >
                 {isSaving ? (
                   <><div className="spinner"></div> Guardando...</>
                 ) : (
                   <><Save size={20} /> Guardar y Aprobar</>
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