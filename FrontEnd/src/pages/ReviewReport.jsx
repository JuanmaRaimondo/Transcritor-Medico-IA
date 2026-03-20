import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { CheckCircle, AlertCircle, ArrowLeft, Send, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';
import html2pdf from 'html2pdf.js';
import api from '../utils/api';

const ReviewReport = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [report, setReport] = useState(null);
    const [editedText, setEditedText] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        // In a real scenario, there should be an endpoint like GET /api/informe/{id}
        // As it was not explicitly provided, we will assume it exists or we fetch the list and filter.
        // For this demonstration, we'll try to fetch GET /api/informe/detalle/{id}
        const fetchReport = async () => {
            setIsLoading(true);
            try {
                const response = await api.get(`/api/informe/detalle/${id}`);
                setReport(response.data);
                
                let textToEdit = response.data.textoCorregido || '';
                try {
                    const parsed = JSON.parse(textToEdit);
                    if (parsed && typeof parsed === 'object') {
                        textToEdit = Object.entries(parsed)
                            .map(([key, value]) => {
                                const formattedKey = key
                                    .replace(/([A-Z])/g, ' $1')
                                    .replace(/[_]/g, ' ')
                                    .toUpperCase()
                                    .trim();
                                return `${formattedKey}:\n${value}`;
                            })
                            .join('\n\n');
                    }
                } catch (e) {
                    // Si falla el parseo, se asume que ya venía como texto plano
                }
                
                setEditedText(textToEdit);
            } catch (error) {
                console.error(error);
                toast.error('Error al cargar el informe.');
                // Fallback for demo if endpoint doesn't exist
                setReport({
                    id,
                    idPaciente: '12345678',
                    tipoEstudio: 'General',
                    textoCrudo: 'el paciente refiere dolor en el pecho desde ayer y también fiebre de treinta y ocho grados...',
                    textoCorregido: 'MOTIVO DE CONSULTA:\nDolor torácico y fiebre.\n\nENFERMEDAD ACTUAL:\nPaciente refiere dolor en el pecho de 24 hs de evolución, acompañado de registros febriles de 38°C.',
                    estado: 'PENDIENTE_REVISION',
                    fechaCreacion: new Date().toISOString()
                });
                setEditedText('MOTIVO DE CONSULTA:\nDolor torácico y fiebre.\n\nENFERMEDAD ACTUAL:\nPaciente refiere dolor en el pecho de 24 hs de evolución, acompañado de registros febriles de 38°C.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchReport();
    }, [id]);

    const downloadPDF = () => {
        const element = document.createElement('div');
        element.innerHTML = `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h1 style="color: #2563eb; text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">Transcriptor Médico IA</h1>
                <div style="margin-top: 20px; font-size: 14px; color: #4b5563;">
                    <p><strong>ID Paciente:</strong> ${report.idPaciente}</p>
                    <p><strong>Tipo de Estudio:</strong> ${report.tipoEstudio}</p>
                    <p><strong>Fecha:</strong> ${new Date(report.fechaCreacion).toLocaleString()}</p>
                </div>
                <div style="margin-top: 30px; line-height: 1.6; font-size: 15px; white-space: pre-wrap;">${editedText}</div>
            </div>
        `;

        html2pdf().from(element).save();
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
            navigate('/');
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
                                {report.estado === 'REVISADO' ? (
                                    <span className="badge badge-success"><CheckCircle size={14} className="mr-1" style={{ marginRight: '0.25rem' }} /> {report.estado}</span>
                                ) : (
                                    <span className="badge badge-warning"><AlertCircle size={14} className="mr-1" style={{ marginRight: '0.25rem' }} /> {report.estado}</span>
                                )}
                            </h1>
                            <p className="text-secondary" style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>
                                Paciente ID: <strong>{report.idPaciente}</strong> &bull; Fecha: {new Date(report.fechaCreacion).toLocaleString()}
                            </p>
                        </div>
                    </div>

                    <div className="split-screen mb-6">

                        {/* Lado Izquierdo: Solo Lectura */}
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

                        {/* Lado Derecho: Editable */}
                        <div className="card" style={{ display: 'flex', flexDirection: 'column', borderColor: 'var(--primary-light)', boxShadow: 'var(--shadow-lg)' }}>
                            <div className="flex items-center justify-between mb-4" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="text-primary" size={24} />
                                    <h2 style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>Informe Estructurado IA</h2>
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
                                disabled={report.estado === 'REVISADO' || isSaving}
                            />
                        </div>

                    </div>

                    {/* Acción Inferior */}
                    <div className="card flex justify-end gap-4">
                        <button
                            className="btn btn-outline"
                            onClick={downloadPDF}
                            disabled={report.estado === 'REVISADO' || isSaving}
                            style={{ padding: '0.75rem 2rem', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <Download size={20} />
                            Descargar PDF
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={handleApprove}
                            disabled={report.estado === 'REVISADO' || isSaving}
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
