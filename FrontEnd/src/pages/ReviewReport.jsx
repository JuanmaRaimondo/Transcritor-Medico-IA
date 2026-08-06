import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { CheckCircle, AlertCircle, ArrowLeft, Send, Download, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../utils/api';

const ReviewReport = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [report, setReport] = useState(null);
    const [editedText, setEditedText] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        const fetchReport = async () => {
            setIsLoading(true);
            try {
                const response = await api.get(`/api/informe/detalle/${id}`);
                setReport(response.data);
                setEditedText(response.data.textoCorregido || '');
            } catch (error) {
                console.error(error);
                toast.error('Error al cargar el informe.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchReport();
    }, [id]);

    const descargarArchivo = async (formato) => {
        setIsDownloading(true);
        try {
            const response = await api.get(`/api/informe/${id}/${formato}`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `informe-${id}.${formato}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error(error);
            toast.error(`Error al descargar el ${formato.toUpperCase()}`);
        } finally {
            setIsDownloading(false);
        }
    };

    const handleApprove = async () => {
        if (!editedText.trim()) {
            toast.error('El informe estructurado no puede estar vacío');
            return;
        }

        setIsSaving(true);
        try {
            await api.put(`/api/informe/finalizar/${id}`, { textoFinal: editedText });
            toast.success('Informe aprobado y finalizado con éxito');
            navigate('/informes');
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.mensaje || 'Error al aprobar el informe';
            toast.error(msg);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <>
                <Header />
                <main className="page-wrapper container" style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem' }}>
                    <div className="spinner-lg"></div>
                </main>
            </>
        );
    }

    const yaConfirmado = report.estado === 'REVISADO';

    return (
        <>
            <Header />
            <main className="page-wrapper bg-color">
                <div className="container">

                    <div className="flex items-center gap-4 mb-6">
                        <button className="btn btn-outline" onClick={() => navigate(-1)} style={{ padding: '0.5rem' }}>
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                Revisión Médica
                                {yaConfirmado ? (
                                    <span className="badge badge-success"><CheckCircle size={14} className="mr-1" style={{ marginRight: '0.25rem' }} /> {report.estado}</span>
                                ) : (
                                    <span className="badge badge-warning"><AlertCircle size={14} className="mr-1" style={{ marginRight: '0.25rem' }} /> {report.estado}</span>
                                )}
                            </h1>
                            <p className="text-secondary" style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>
                                Paciente: <strong>{report.nombrePaciente} {report.apellidoPaciente}</strong> &bull; {report.tipoEstudio} &bull; {new Date(report.fechaCreacion).toLocaleString()}
                            </p>
                        </div>
                    </div>

                    {report.procedimiento && (
                        <div className="card mb-6" style={{ backgroundColor: '#f8fafc' }}>
                            <div className="flex items-center gap-2 mb-3">
                                <FileText size={20} className="text-secondary" />
                                <h2 style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Procedimiento (fijo, no editable)</h2>
                            </div>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
                                {report.procedimiento}
                            </p>
                        </div>
                    )}

                    <div className="split-screen mb-6">

                        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                            <div className="flex items-center gap-2 mb-4" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                                <AlertCircle className="text-secondary" size={24} />
                                <h2 style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>Transcripción Original</h2>
                            </div>
                            <div
                                style={{
                                    flex: 1,
                                    backgroundColor: '#f8fafc',
                                    padding: '1.5rem',
                                    borderRadius: 'var(--radius-md)',
                                    color: 'var(--text-secondary)',
                                    whiteSpace: 'pre-wrap',
                                    lineHeight: '1.6',
                                    fontStyle: 'italic',
                                    border: '1px solid var(--border)'
                                }}
                            >
                                {report.textoCrudo || 'No hay transcripción original disponible.'}
                            </div>
                        </div>

                        <div className="card" style={{ display: 'flex', flexDirection: 'column', borderColor: 'var(--primary-light)', boxShadow: 'var(--shadow-lg)' }}>
                            <div className="flex items-center justify-between mb-4" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="text-primary" size={24} />
                                    <h2 style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>Interpretación</h2>
                                </div>
                                <span className="badge badge-info text-primary">Editable</span>
                            </div>

                            <textarea
                                className="form-control"
                                style={{
                                    flex: 1,
                                    minHeight: '400px',
                                    fontSize: '1rem',
                                    lineHeight: '1.6',
                                    padding: '1.5rem',
                                    resize: 'none'
                                }}
                                value={editedText}
                                onChange={(e) => setEditedText(e.target.value)}
                                disabled={yaConfirmado || isSaving}
                            />
                        </div>

                    </div>

                    <div className="card flex justify-end gap-4">
                        <button
                            className="btn btn-outline"
                            onClick={() => descargarArchivo('docx')}
                            disabled={!yaConfirmado || isDownloading}
                            style={{ padding: '0.75rem 1.5rem', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <Download size={20} />
                            .docx
                        </button>
                        <button
                            className="btn btn-outline"
                            onClick={() => descargarArchivo('pdf')}
                            disabled={!yaConfirmado || isDownloading}
                            style={{ padding: '0.75rem 1.5rem', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <Download size={20} />
                            PDF
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={handleApprove}
                            disabled={yaConfirmado || isSaving}
                            style={{ padding: '0.75rem 2rem', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            {isSaving ? <div className="spinner"></div> : <><Send size={20} /> Aprobar y Finalizar Informe</>}
                        </button>
                    </div>

                </div>
            </main>
        </>
    );
};

export default ReviewReport;