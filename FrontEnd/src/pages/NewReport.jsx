import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { User, FileText, Mic, StopCircle, Wand2, PlayCircle, Trash2 } from 'lucide-react';
import Header from '../components/Header';
import api from '../utils/api';

function NewReport() {
  const navigate = useNavigate();

  const [nombrePaciente, setNombrePaciente] = useState('');
  const [apellidoPaciente, setApellidoPaciente] = useState('');
  const [tipoEstudio, setTipoEstudio] = useState('');
  const [tiposEstudio, setTiposEstudio] = useState([]);

  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const fetchTiposEstudio = async () => {
      try {
        const response = await api.get('/api/tipo-estudio/listar');
        setTiposEstudio(response.data || []);
      } catch (error) {
        console.error(error);
        toast.error('No se pudo cargar la lista de tipos de estudio');
      }
    };
    fetchTiposEstudio();
  }, []);

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
      toast.success('Audio grabado correctamente. Listo para procesar.');
    }
  };

  const discardAudio = () => {
    setAudioFile(null);
  };

  const handleGenerateReport = async () => {
    if (!nombrePaciente.trim() || !apellidoPaciente.trim()) return toast.error('Ingresá nombre y apellido del paciente');
    if (!tipoEstudio) return toast.error('Seleccioná el tipo de estudio');
    if (!audioFile) return toast.error('Por favor, grabá el diagnóstico primero');

    setIsGenerating(true);

    const formData = new FormData();
    formData.append('nombrePaciente', nombrePaciente);
    formData.append('apellidoPaciente', apellidoPaciente);
    formData.append('tipoEstudio', tipoEstudio);
    formData.append('audio', audioFile);

    try {
      const response = await api.post('/api/informe/subir-audio', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Transcripción completada');
      navigate(`/review/${response.data.id}`);
    } catch (error) {
      console.error(error);
      const msg = error.response?.data || 'Error al procesar el audio';
      toast.error(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Header />
      <div className="page-wrapper" style={{ backgroundColor: '#f9f9fa' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ color: '#111827', fontSize: '1.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <FileText color="var(--primary)" size={28} />
              Nuevo Dictado Médico
            </h1>
            <p className="text-secondary mt-2">Grabá tu diagnóstico y la IA estructurará el informe automáticamente.</p>
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
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <User size={16} className="text-secondary" /> Nombre del paciente
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej. Marcos"
                    value={nombrePaciente}
                    onChange={(e) => setNombrePaciente(e.target.value)}
                    style={{ backgroundColor: '#fcfcfc' }}
                  />
                </div>

                <div className="form-group mb-0">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <User size={16} className="text-secondary" /> Apellido del paciente
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej. Bulacio"
                    value={apellidoPaciente}
                    onChange={(e) => setApellidoPaciente(e.target.value)}
                    style={{ backgroundColor: '#fcfcfc' }}
                  />
                </div>
              </div>

              <div className="form-group mb-0 mt-4">
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
                  {tiposEstudio.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* TARJETA 2: MICRÓFONO */}
            <div className={`card ${!nombrePaciente || !apellidoPaciente || !tipoEstudio ? 'opacity-50' : ''}`} style={{ padding: '2rem', transition: 'opacity 0.3s' }}>
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
                        disabled={!nombrePaciente || !apellidoPaciente || !tipoEstudio}
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
                      <p className="text-secondary mt-3" style={{ fontSize: '0.9rem' }}>Asegurate de hablar claro y cerca del micrófono.</p>
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
                        <p className="text-secondary mt-1">Escuchalo para confirmar, o procesalo con IA.</p>
                      </div>

                      <audio
                        src={URL.createObjectURL(audioFile)}
                        controls
                        style={{ marginTop: '0.5rem', width: '100%', maxWidth: '350px' }}
                      />

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

          </div>
        </div>
      </div>
    </>
  );
}

export default NewReport;