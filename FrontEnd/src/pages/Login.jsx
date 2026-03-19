import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { LogIn, Activity } from 'lucide-react';
import api from '../utils/api';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            toast.error('Todos los campos son obligatorios');
            return;
        }

        setIsLoading(true);
        try {
            const response = await api.post('/api/auth/login', { email, password });

            // 1. Extraemos los datos EXACTAMENTE como los manda tu AuthResponseDTO en Spring Boot
            const { token, nombre, email: userEmail, especialidad } = response.data;
            
            if (token) {
                // 2. Armamos el objeto usuario acá mismo y lo guardamos
                const userInfo = { 
                    nombre: nombre, 
                    email: userEmail, 
                    especialidad: especialidad 
                };
                
                login(token, userInfo);
                
                toast.success('Sesión iniciada correctamente');
                navigate('/');
            } else {
                toast.error('Token no recibido');
            }
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.mensaje || 'Credenciales inválidas';
            toast.error(msg);
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
                    <p className="text-secondary mt-2">Acceso seguro para profesionales</p>
                </div>

                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label className="form-label">Email médico</label>
                        <input
                            type="email"
                            className="form-control"
                            placeholder="dr.ejemplo@hospital.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Contraseña</label>
                        <input
                            type="password"
                            className="form-control"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary w-full mt-4"
                        disabled={isLoading}
                        style={{ fontSize: '1rem', padding: '0.75rem' }}
                    >
                        {isLoading ? <div className="spinner"></div> : <><LogIn size={20} /> Iniciar Sesión</>}
                    </button>
                </form>

                <div className="text-center mt-6">
                    <p className="text-secondary mb-2" style={{ fontSize: '0.875rem' }}>¿No tienes cuenta?</p>
                    <Link to="/register" className="text-primary" style={{ fontWeight: 600 }}>
                        Regístrate aquí
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
