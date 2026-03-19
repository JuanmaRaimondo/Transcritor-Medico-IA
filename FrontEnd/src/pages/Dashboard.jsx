import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { toast } from 'react-hot-toast';
import { Search, Plus, FileAudio, UploadCloud, FileText, CheckCircle, Clock } from 'lucide-react';
import api from '../utils/api';

const Dashboard = () => {
    const [patientId, setPatientId] = useState('');
    const [reports, setReports] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Modal Upload State
    const [showModal, setShowModal] = useState(false);
    const [uploadPatientId, setUploadPatientId] = useState('');
    const [activeDrop, setActiveDrop] = useState(false);
    const [audioFile, setAudioFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    const navigate = useNavigate();

    const fetchReports = async (e) => {
        if (e) e.preventDefault();
        if (!patientId) {
            toast.error('Ingrese el ID o DNI del paciente');
            return;
        }

        setIsLoading(true);
        try {
            const response = await api.get(`/api/informe/traerlistaInformes/${patientId}`);
            setReports(response.data || []);
            if (response.data.length === 0) {
                toast('No se encontraron informes para el paciente especificado.', { icon: 'ℹ️' });
            }
        } catch (error) {
            console.error(error);
            toast.error('Error al cargar la lista de informes');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setActiveDrop(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setActiveDrop(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setActiveDrop(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (file.name.endsWith('.wav')) {
                setAudioFile(file);
            } else {
                toast.error('Solo se admiten archivos .wav');
            }
        }
    };

    const handleFileInput = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.name.endsWith('.wav')) {
                setAudioFile(file);
            } else {
                toast.error('Solo se admiten archivos .wav');
            }
        }
    };

    const handleUpload = async () => {
        if (!uploadPatientId) {
            toast.error('Ingrese el ID del paciente para el informe');
            return;
        }
        if (!audioFile) {
            toast.error('Debe seleccionar o arrastrar un archivo de audio');
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append('idpaciente', uploadPatientId);
        formData.append('audio', audioFile);

        try {
            const response = await api.post('/api/informe/subir-audio', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            toast.success('Informe generado con éxito');
            setShowModal(false);
            setAudioFile(null);
            setUploadPatientId('');

            // Navigate to review screen
            if (response.data && response.data.id) {
                navigate(`/review/${response.data.id}`);
            } else {
                // If no ID returned but successful, refresh
                if (patientId === uploadPatientId) fetchReports();
            }

        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.mensaje || 'Error al subir el archivo y procesar el audio.';
            toast.error(msg);
        } finally {
            setIsUploading(false);
        }
    };

    const getStatusBadge = (estado) => {
        switch (estado) {
            case 'PENDIENTE_REVISION':
                return <span className="badge badge-warning"><Clock size={12} className="mr-1" style={{ marginRight: '4px' }} /> Pendiente</span>;
            case 'REVISADO':
                return <span className="badge badge-success"><CheckCircle size={12} className="mr-1" style={{ marginRight: '4px' }} /> Revisado</span>;
            case 'PROCESANDO':
                return <span className="badge badge-info"><Activity size={12} className="mr-1" style={{ marginRight: '4px' }} /> Procesando</span>;
            default:
                return <span className="badge badge-info">{estado}</span>;
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Fecha no disponible';
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <>
            <Header />
            <main className="page-wrapper">
                <div className="container">
                    <div className="flex justify-between items-center mb-6" style={{ marginTop: '15px', padding: '0 2rem' }}>
                        <h1 style={{ fontSize: '1.5rem' }}>Informes de Pacientes</h1>
                        <div className="flex gap-3" style={{ transform: 'translateY(-6px)' }}>
                            <button className="btn btn-outline" onClick={() => toast('Por implementar: Listar Pacientes', { icon: '🚧' })}>
                                Listar Pacientes
                            </button>
                            <button className="btn btn-outline" onClick={() => toast('Por implementar: Listar Informes', { icon: '🚧' })}>
                                Listar Informes
                            </button>
                            <button className="btn btn-primary" onClick={() => navigate('/new-report')}>
                                <Plus size={20} /> Nuevo Dictado
                            </button>
                        </div>
                    </div>

                    <div className="card mb-6">
                        <form onSubmit={fetchReports} className="flex gap-4 items-center">
                            <div className="w-full flex items-center gap-4">
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Ingrese ID o DNI del paciente..."
                                    value={patientId}
                                    onChange={(e) => setPatientId(e.target.value)}
                                    style={{ maxWidth: '400px' }}
                                />
                                <button type="submit" className="btn btn-outline" disabled={isLoading}>
                                    {isLoading ? <div className="spinner" style={{ width: '1rem', height: '1rem' }}></div> : <Search size={20} />}
                                    Buscar Informes
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="table-container">
                        {reports.length > 0 ? (
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Fecha de Creación</th>
                                        <th>ID Paciente</th>
                                        <th>Tipo de Estudio</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reports.map((report) => (
                                        <tr key={report.id}>
                                            <td>{formatDate(report.fechaCreacion)}</td>
                                            <td>{report.idPaciente}</td>
                                            <td>
                                                <div className="flex items-center gap-2 font-medium">
                                                    <FileText size={16} className="text-secondary" />
                                                    {report.tipoEstudio || 'General'}
                                                </div>
                                            </td>
                                            <td>{getStatusBadge(report.estado)}</td>
                                            <td>
                                                <button
                                                    className="btn btn-outline"
                                                    onClick={() => navigate(`/review/${report.id}`)}
                                                    style={{ padding: '0.4rem 0.8rem' }}
                                                >
                                                    Ver Detalle
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="text-center text-secondary" style={{ padding: '3rem 1rem' }}>
                                <FileAudio size={48} className="mb-4" style={{ margin: '0 auto', opacity: 0.5 }} />
                                <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Sin Informes</h3>
                                <p>Busca un paciente o empieza grabando un nuevo dictado médico.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Upload Modal Overlay */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 50,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '1rem'
                }}>
                    <div className="card" style={{ width: '100%', maxWidth: '540px', position: 'relative' }}>
                        {isUploading && (
                            <div style={{
                                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                backgroundColor: 'rgba(255,255,255,0.9)', zIndex: 60,
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                borderRadius: 'var(--radius-lg)'
                            }}>
                                <div className="spinner-lg mb-4"></div>
                                <h3 className="text-primary">Transcribiendo y analizando con IA...</h3>
                                <p className="text-secondary mt-2">Por favor, espere. Esto puede tardar unos segundos.</p>
                            </div>
                        )}

                        <div className="flex justify-between items-center mb-4">
                            <h2 style={{ fontSize: '1.25rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <FileAudio /> Subir Audio Médico
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}
                                disabled={isUploading}
                            >
                                &times;
                            </button>
                        </div>

                        <div className="form-group">
                            <label className="form-label">ID / DNI del Paciente</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Ej. 12345678"
                                value={uploadPatientId}
                                onChange={(e) => setUploadPatientId(e.target.value)}
                                disabled={isUploading}
                            />
                        </div>

                        <div className="form-group mt-4">
                            <label className="form-label">Archivo de Audio (.wav)</label>

                            <div
                                className={`dropzone ${activeDrop ? 'active' : ''}`}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => document.getElementById('audioInput').click()}
                            >
                                {audioFile ? (
                                    <div className="flex flex-col items-center">
                                        <CheckCircle size={40} className="text-success mb-2" />
                                        <p style={{ fontWeight: 600 }}>{audioFile.name}</p>
                                        <p className="text-secondary" style={{ fontSize: '0.8rem' }}>
                                            {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <UploadCloud size={40} className="text-secondary mb-2" style={{ margin: '0 auto' }} />
                                        <p style={{ fontWeight: 500, margin: '0.5rem 0' }}>Arrastra tu archivo aquí</p>
                                        <p className="text-secondary" style={{ fontSize: '0.875rem' }}>o haz clic para explorar</p>
                                    </>
                                )}
                                <input
                                    type="file"
                                    id="audioInput"
                                    accept=".wav"
                                    style={{ display: 'none' }}
                                    onChange={handleFileInput}
                                    disabled={isUploading}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-6">
                            <button
                                className="btn btn-outline"
                                onClick={() => setShowModal(false)}
                                disabled={isUploading}
                            >
                                Cancelar
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleUpload}
                                disabled={isUploading || !audioFile || !uploadPatientId}
                            >
                                Generar Informe
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Dashboard;
