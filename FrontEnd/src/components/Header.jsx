import React, { useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Stethoscope, LogOut, User } from 'lucide-react';

const Header = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="header">
            <div className="container header-content">
                <Link to="/" className="brand">
                    <Stethoscope size={28} />
                    Transcriptor Médico IA
                </Link>
                <div className="user-profile">
                    <div className="flex items-center gap-2">
                        <User size={20} className="text-secondary" />
                        <span style={{ fontWeight: 500 }}>
                            Dr(a). {user?.nombre || 'Médico'}
                        </span>
                        <span className="badge badge-info" style={{ marginLeft: '4px' }}>
                            {user?.especialidad || 'General'}
                        </span>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="btn btn-outline"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                        <LogOut size={16} />
                        Cerrar Sesión
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
