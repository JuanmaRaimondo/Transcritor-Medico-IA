import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Activity } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import api from '../utils/api';

const Login = () => {
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleGoogleSuccess = async (credentialResponse) => {
        setIsLoading(true);
        const googleToken = credentialResponse.credential;

        try {
            // Mandamos el token de Google a tu backend en Java
            const response = await api.post('/api/auth/google', { token: googleToken });
            
            // Spring Boot nos va a responder con los datos y tu token propio de sesión
            const { token, nombre, email, especialidad } = response.data;

            if (token) {
                const userInfo = { nombre, email, especialidad };
                
                // Iniciamos sesión en el estado global de React
                login(token, userInfo);
                
                toast.success('¡Ingreso exitoso!');
                navigate('/'); // Al dashboard o pantalla principal
            } else {
                toast.error('Error al procesar la sesión en el servidor');
            }
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.mensaje || 'Error al autenticar con Google';
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-card" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
                <div className="auth-header" style={{ marginBottom: '3rem' }}>
                    <div className="auth-brand" style={{ justifyContent: 'center', fontSize: '1.8rem', gap: '10px' }}>
                        <Activity className="text-primary" size={36} />
                        Transcriptor IA
                    </div>
                    <p className="text-secondary mt-3" style={{ fontSize: '1rem' }}>
                        Acceso exclusivo para profesionales de la salud
                    </p>
                </div>

                <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: '1.5rem',
                    minHeight: '100px'
                }}>
                    {isLoading ? (
                        <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
                    ) : (
                        <>
                            {/* BOTÓN ÚNICO DE ACCESO */}
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={() => {
                                    toast.error('El inicio de sesión con Google falló');
                                }}
                                disabled={isLoading}
                                size="large"
                                theme="filled_blue"
                                text="signin_with"
                                shape="pill"
                            />
                            <p style={{ color: '#9ca3af', fontSize: '0.8rem', maxWidth: '280px', margin: '0 auto' }}>
                                Al ingresar, el sistema reconocerá tu cuenta institucional o personal de forma segura.
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Login;