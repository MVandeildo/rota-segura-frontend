import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const userRole = localStorage.getItem('@RotaSegura:userRole') || 'responsavel';

    const handleLogout = () => {
        localStorage.removeItem('@RotaSegura:token');
        localStorage.removeItem('@RotaSegura:userName');
        localStorage.removeItem('@RotaSegura:userRole');
        navigate('/', { replace: true });
    };

    const isActive = (path) => location.pathname === path ? 'nav-item active' : 'nav-item';

    return (
        <aside className="dashboard-sidebar">
            <div className="sidebar-logo">
                <h2>RotaSegura</h2>
            </div>
            <nav className="sidebar-nav">
                <Link to="/dashboard" className={isActive('/dashboard')}>
                    <span className="nav-icon">🏠</span> Início
                </Link>
                <Link to="/rotas" className={isActive('/rotas')}>
                    <span className="nav-icon">🚌</span> Rotas
                </Link>
                
                {userRole !== 'estudante' && (
                    <Link to="/estudantes" className={isActive('/estudantes')}>
                        <span className="nav-icon">👤</span> Estudantes
                    </Link>
                )}

                <Link to="/historico" className={isActive('/historico')}>
                    <span className="nav-icon">📋</span> Histórico
                </Link>

                <Link to="/acompanhamento" className={isActive('/acompanhamento')}>
                    <span className="nav-icon">📍</span> Acompanhamento
                </Link>

                <Link to="/notificacoes" className={isActive('/notificacoes')}>
                    <span className="nav-icon">🔔</span> Notificações
                </Link>
                <Link to="/perfil" className={isActive('/perfil')}>
                    <span className="nav-icon">⚙️</span> Perfil
                </Link>
                <Link to="/suporte" className={isActive('/suporte')}>
                    <span className="nav-icon">💬</span> Suporte
                </Link>

                <button 
                    onClick={handleLogout} 
                    className="nav-item btn-logout"
                    style={{ 
                        background: 'none', border: 'none', width: '100%', 
                        textAlign: 'left', cursor: 'pointer', color: '#ff6b6b', 
                        marginTop: 'auto', display: 'flex', alignItems: 'center', padding: '12px 16px' 
                    }}
                >
                    <span className="nav-icon">🚪</span> Sair
                </button>
            </nav>
        </aside>
    );
}