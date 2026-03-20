import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { toast } from 'react-hot-toast';
import { Search, Plus, FileAudio, UploadCloud, FileText, CheckCircle, Clock, Activity, Trash2, User, UserPlus } from 'lucide-react';
import api from '../utils/api';

const Dashboard = () => {
    const [patientId, setPatientId] = useState('');
    const [reports, setReports] = useState([]);
    const [viewMode, setViewMode] = useState('reports');
    const [patients, setPatients] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Modal Upload State
    const [showModal, setShowModal] = useState(false);
    const [uploadPatientId, setUploadPatientId] = useState('');
    const [activeDrop, setActiveDrop] = useState(false);
    const [audioFile, setAudioFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    // Modal Create Patient State
    const [showPatientModal, setShowPatientModal] = useState(false);
    const [newPatient, setNewPatient] = useState({
        nombre: '',
        apellido: '',
        obraSocial: '',
        fechaNacimiento: ''
    });
    const [isCreatingPatient, setIsCreatingPatient] = useState(false);

    const navigate = useNavigate();

    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro de que deseas borrar este informe? Esta acción no se puede deshacer.')) return;
        
        try {
            await api.delete(`/api/informe/borrar/${id}`);
            toast.success('Informe borrado exitosamente');
            setReports(prev => prev.filter(report => report.id !== id));
        } catch (error) {
            console.error(error);
            toast.error('Error al borrar el informe');
        }
    };

    const handleCreatePatient = async (e) => {
        e.preventDefault();
        
        if (!newPatient.nombre || !newPatient.apellido || !newPatient.obraSocial || !newPatient.fechaNacimiento) {
            toast.error('Todos los campos son obligatorios');
            return;
        }

        setIsCreatingPatient(true);
        try {
            await api.post('/api/paciente/crear', newPatient);
            toast.success('Paciente creado exitosamente');
            setShowPatientModal(false);
            setNewPatient({ nombre: '', apellido: '', obraSocial: '', fechaNacimiento: '' });
            
            // If we are currently viewing patients, refresh the list
            if (viewMode === 'patients') {
                fetchAllPatients();
            }
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.mensaje || 'Error al crear paciente';
            toast.error(msg);
        } finally {
            setIsCreatingPatient(false);
        }
    };

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
            setViewMode('reports');
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

    const fetchAllReports = async () => {
        setIsLoading(true);
        setPatientId(''); // Clear patient search field
        try {
            const response = await api.get('/api/informe/traerTodos');
            // Sort reports by date (newest first)
            const sortedReports = (response.data || []).sort((a, b) => {
                return new Date(b.fechaCreacion) - new Date(a.fechaCreacion);
            });
            setReports(sortedReports);
            setViewMode('reports');
        } catch (error) {
            console.error(error);
            toast.error('Error al cargar todos los informes');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAllPatients = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/api/paciente/listapacientes');
            setPatients(response.data || []);
            setViewMode('patients');
        } catch (error) {
            console.error(error);
            toast.error('Error al cargar la lista de pacientes');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAllReports();
    }, []);

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
                        <div className="flex" style={{ transform: 'translateY(-6px)', gap: '1.25rem' }}>
                            <button className="btn btn-outline" onClick={fetchAllPatients}>
                                Listar Pacientes
                            </button>
                            <button className="btn btn-outline" onClick={fetchAllReports}>
                                Listar Informes
                            </button>
                            <button className="btn btn-primary" onClick={() => setShowPatientModal(true)} style={{ backgroundColor: 'var(--success)', borderColor: 'var(--success)' }}>
                                <UserPlus size={20} /> Nuevo Paciente
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
                        {viewMode === 'reports' ? (
                            reports.length > 0 ? (
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
                                                    <div className="flex gap-2">
                                                        <button
                                                            className="btn btn-outline"
                                                            onClick={() => navigate(`/review/${report.id}`)}
                                                            style={{ padding: '0.4rem 0.8rem' }}
                                                        >
                                                            Ver Detalle
                                                        </button>
                                                        <button
                                                            className="btn btn-outline"
                                                            onClick={() => handleDelete(report.id)}
                                                            style={{ padding: '0.4rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}
                                                            title="Borrar informe"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
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
                            )
                        ) : (
                            patients.length > 0 ? (
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>ID / DNI</th>
                                            <th>Nombre</th>
                                            <th>Apellido</th>
                                            <th>Obra Social</th>
                                            <th>Fecha de Nacimiento</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {patients.map((patient) => (
                                            <tr key={patient.id}>
                                                <td style={{ fontWeight: 600 }}>{patient.id}</td>
                                                <td>{patient.nombre}</td>
                                                <td>{patient.apellido}</td>
                                                <td>
                                                    <div className="flex items-center gap-2">
                                                        <Activity size={16} className="text-primary" />
                                                        {patient.obraSocial}
                                                    </div>
                                                </td>
                                                <td>{patient.fechaNacimiento}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="text-center text-secondary" style={{ padding: '3rem 1rem' }}>
                                    <User size={48} className="mb-4" style={{ margin: '0 auto', opacity: 0.5 }} />
                                    <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Sin Pacientes</h3>
                                    <p>No se encontraron pacientes registrados en la base de datos.</p>
                                </div>
                            )
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

            {/* Create Patient Modal Overlay */}
            {showPatientModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 50,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '1rem'
                }}>
                    <div className="card" style={{ width: '100%', maxWidth: '500px', position: 'relative' }}>
                        <div className="flex justify-between items-center mb-4">
                            <h2 style={{ fontSize: '1.25rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <UserPlus /> Registrar Nuevo Paciente
                            </h2>
                            <button
                                type="button"
                                onClick={() => setShowPatientModal(false)}
                                style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}
                                disabled={isCreatingPatient}
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleCreatePatient}>
                            <div className="form-group">
                                <label className="form-label">Nombre</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Nombre del paciente"
                                    value={newPatient.nombre}
                                    onChange={(e) => setNewPatient({ ...newPatient, nombre: e.target.value })}
                                    disabled={isCreatingPatient}
                                />
                            </div>
                            <div className="form-group mt-3">
                                <label className="form-label">Apellido</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Apellido del paciente"
                                    value={newPatient.apellido}
                                    onChange={(e) => setNewPatient({ ...newPatient, apellido: e.target.value })}
                                    disabled={isCreatingPatient}
                                />
                            </div>
                            <div className="form-group mt-3">
                                <label className="form-label">Obra Social</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Ej. OSDE, Swiss Medical..."
                                    value={newPatient.obraSocial}
                                    onChange={(e) => setNewPatient({ ...newPatient, obraSocial: e.target.value })}
                                    disabled={isCreatingPatient}
                                />
                            </div>
                            <div className="form-group mt-3 flex flex-col">
                                <label className="form-label">Fecha de Nacimiento</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={newPatient.fechaNacimiento}
                                    onChange={(e) => setNewPatient({ ...newPatient, fechaNacimiento: e.target.value })}
                                    disabled={isCreatingPatient}
                                />
                            </div>

                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={() => setShowPatientModal(false)}
                                    disabled={isCreatingPatient}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={isCreatingPatient}
                                >
                                    {isCreatingPatient ? <div className="spinner" style={{ width: '1rem', height: '1rem' }}></div> : 'Crear Paciente'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default Dashboard;
