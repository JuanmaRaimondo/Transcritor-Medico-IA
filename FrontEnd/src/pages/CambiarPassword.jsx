import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Activity, KeyRound } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'react-hot-toast';

const CambiarPassword = () => {
    const [email, setEmail] = useState('');
    const [nuevaPassword, setNuevaPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMensaje({ tipo: '', texto: '' });

        if (!email || !nuevaPassword) {
            setMensaje({ tipo: 'error', texto: 'Todos los campos son obligatorios' });
            return;
        }

        setIsLoading(true);
        try {
            const response = await api.post('/api/auth/cambiar-password', {
                email: email,
                password: nuevaPassword
            });
            
            // Assume 200 OK since we're in the try block
            setMensaje({ 
                tipo: 'exito', 
                texto: response.data || 'La contraseña se actualizó correctamente. Redirigiendo...'
            });
            toast.success('Contraseña actualizada correctamente');
            
            // Redirect to login after a few seconds
            setTimeout(() => {
                navigate('/login');
            }, 3000);
            
        } catch (error) {
            console.error(error);
            const msgError = error.response?.data || error.response?.data?.mensaje || 'Error: verifique si el correo existe o si el servidor está caído.';
            setMensaje({ 
                tipo: 'error', 
                texto: typeof msgError === 'string' ? msgError : 'Error al cambiar la contraseña'
            });
            toast.error('No se pudo actualizar la contraseña');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-brand">
                        <Activity className="text-primary" size={32} />
                        Transcriptor IA
                    </div>
                    <p className="text-secondary mt-2">Restablecer Contraseña</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Correo Electrónico</label>
                        <input
                            type="email"
                            className="form-control"
                            placeholder="correo@ejemplo.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Nueva Contraseña</label>
                        <input
                            type="password"
                            className="form-control"
                            placeholder="••••••••"
                            value={nuevaPassword}
                            onChange={(e) => setNuevaPassword(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>

                    {mensaje.texto && (
                        <div 
                            style={{
                                color: mensaje.tipo === 'exito' ? '#10b981' : '#ef4444',
                                backgroundColor: mensaje.tipo === 'exito' ? '#d1fae5' : '#fee2e2',
                                padding: '0.75rem',
                                borderRadius: '0.375rem',
                                fontSize: '0.875rem',
                                marginBottom: '1rem',
                                textAlign: 'center',
                                fontWeight: '500'
                            }}
                        >
                            {mensaje.texto}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary w-full mt-2"
                        disabled={isLoading}
                        style={{ fontSize: '1rem', padding: '0.75rem' }}
                    >
                        {isLoading ? <div className="spinner"></div> : <><KeyRound size={20} /> Actualizar Contraseña</>}
                    </button>
                </form>

                <div className="text-center mt-6">
                    <p className="text-secondary mb-2" style={{ fontSize: '0.875rem' }}>¿Recordaste tu contraseña?</p>
                    <Link to="/login" className="text-primary" style={{ fontWeight: 600 }}>
                        Volver al inicio de sesión
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default CambiarPassword;
