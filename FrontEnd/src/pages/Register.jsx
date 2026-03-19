import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { UserPlus, Activity } from 'lucide-react';
import api from '../utils/api';

const Register = () => {
    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        password: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        const { nombre, email, password } = formData;

        if (!nombre || !email || !password) {
            toast.error('Todos los campos son obligatorios');
            return;
        }

        setIsLoading(true);
        try {
            const response = await api.post('/api/auth/register', formData);
            const { token, usuario } = response.data;

            if (token) {
                login(token, usuario || { email, nombre });
                toast.success('Cuenta creada exitosamente');
                navigate('/');
            } else {
                toast.success('Cuenta creada. Por favor inicia sesión.');
                navigate('/login');
            }
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.mensaje || 'Error al crear la cuenta';
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-brand">
                        <Activity className="text-primary" size={32} />
                        Registro Médico
                    </div>
                    <p className="text-secondary mt-2">Cree su cuenta profesional</p>
                </div>

                <form onSubmit={handleRegister}>
                    <div className="form-group">
                        <label className="form-label">Nombre completo</label>
                        <input
                            type="text"
                            name="nombre"
                            className="form-control"
                            placeholder="Ej. Dr. Juan Pérez"
                            value={formData.nombre}
                            onChange={handleChange}
                            disabled={isLoading}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Email médico</label>
                        <input
                            type="email"
                            name="email"
                            className="form-control"
                            placeholder="dr.ejemplo@hospital.com"
                            value={formData.email}
                            onChange={handleChange}
                            disabled={isLoading}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Contraseña</label>
                        <input
                            type="password"
                            name="password"
                            className="form-control"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange}
                            disabled={isLoading}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary w-full mt-4"
                        disabled={isLoading}
                        style={{ fontSize: '1rem', padding: '0.75rem' }}
                    >
                        {isLoading ? <div className="spinner"></div> : <><UserPlus size={20} /> Crear Cuenta</>}
                    </button>
                </form>

                <div className="text-center" style={{ marginTop: '20px' }}>
                    <p className="text-secondary mb-2" style={{ fontSize: '0.875rem' }}>¿Ya tienes una cuenta?</p>
                    <Link to="/login" className="text-primary" style={{ fontWeight: 600 }}>
                        Inicia Sesión
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
