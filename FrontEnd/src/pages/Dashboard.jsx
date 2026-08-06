import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { toast } from 'react-hot-toast';
import { Search, Plus, FileText, CheckCircle, Clock, Activity, Trash2 } from 'lucide-react';
import api from '../utils/api';

const Dashboard = () => {

    const [nombrePaciente, setNombrePaciente] = useState('');
    const [apellidoPaciente, setApellidoPaciente] = useState('');
    const [reports, setReports] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

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

    const fetchReports = async (e) => {
        if (e) e.preventDefault();

        setIsLoading(true);
        try {
            const response = await api.get('/api/informe/buscar', {
                params: {
                    nombrePaciente: nombrePaciente || undefined,
                    apellidoPaciente: apellidoPaciente || undefined,
                }
            });
            const sortedReports = (response.data || []).sort((a, b) => {
                return new Date(b.fechaCreacion) - new Date(a.fechaCreacion);
            });
            setReports(sortedReports);
            if (sortedReports.length === 0) {
                toast('No se encontraron informes con esos datos.', { icon: 'ℹ️' });
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
        setNombrePaciente('');
        setApellidoPaciente('');
        try {
            const response = await api.get('/api/informe/buscar');
            const sortedReports = (response.data || []).sort((a, b) => {
                return new Date(b.fechaCreacion) - new Date(a.fechaCreacion);
            });
            setReports(sortedReports);
        } catch (error) {
            console.error(error);
            toast.error('Error al cargar todos los informes');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAllReports();
    }, []);

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
                        <h1 style={{ fontSize: '1.5rem' }}>Informes</h1>
                        <div className="flex" style={{ transform: 'translateY(-6px)', gap: '1.25rem' }}>
                            <button className="btn btn-outline" onClick={fetchAllReports}>
                                Ver todos
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
                                    placeholder="Nombre del paciente..."
                                    value={nombrePaciente}
                                    onChange={(e) => setNombrePaciente(e.target.value)}
                                    style={{ maxWidth: '280px' }}
                                />
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Apellido del paciente..."
                                    value={apellidoPaciente}
                                    onChange={(e) => setApellidoPaciente(e.target.value)}
                                    style={{ maxWidth: '280px' }}
                                />
                                <button type="submit" className="btn btn-outline" disabled={isLoading}>
                                    {isLoading ? <div className="spinner" style={{ width: '1rem', height: '1rem' }}></div> : <Search size={20} />}
                                    Buscar
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
                                        <th>Paciente</th>
                                        <th>Tipo de Estudio</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reports.map((report) => (
                                        <tr key={report.id}>
                                            <td>{formatDate(report.fechaCreacion)}</td>
                                            <td>{report.nombrePaciente} {report.apellidoPaciente}</td>
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
                                <FileText size={48} className="mb-4" style={{ margin: '0 auto', opacity: 0.5 }} />
                                <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Sin Informes</h3>
                                <p>Buscá por paciente o empezá grabando un nuevo dictado médico.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </>
    );
};

export default Dashboard;