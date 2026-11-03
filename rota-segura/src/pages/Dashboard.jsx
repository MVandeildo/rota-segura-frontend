import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Dashboard.css';

export default function Dashboard() {
    const navigate = useNavigate();

    // Estados de dados do usuário e perfil
    const [userName, setUserName] = useState('Usuário');
    const [fullName, setFullName] = useState('Usuário');
    const [userRole, setUserRole] = useState('responsavel');

    // Estados para gerenciamento dinâmico de estudantes
    const [estudantes, setEstudantes] = useState([]);
    const [alunoSelecionado, setAlunoSelecionado] = useState(null);
    const [carregandoEstudantes, setCarregandoEstudantes] = useState(true);

    useEffect(() => {
        // Recupera o perfil salvo no login ('administrador', 'responsavel', 'estudante')
        const roleSalvo = localStorage.getItem('@RotaSegura:userRole') || 'responsavel';
        setUserRole(roleSalvo);

        const carregarDadosUsuario = async () => {
            let savedName = localStorage.getItem('@RotaSegura:userName');

            if (!savedName || savedName === 'Usuário') {
                try {
                    const response = await api.get('/api/usuarios/me');
                    savedName = response.data?.nome || response.data?.name;
                    if (savedName) {
                        localStorage.setItem('@RotaSegura:userName', savedName);
                    }
                } catch (error) {
                    console.error('Não foi possível carregar os dados do usuário:', error);
                }
            }

            if (savedName) {
                setFullName(savedName);
                const primeiroNome = savedName.trim().split(' ')[0];
                setUserName(primeiroNome);
            }
        };

        const carregarEstudantes = async () => {
            try {
                setCarregandoEstudantes(true);
                const response = await api.get('/api/alunos');
                const lista = response.data?.alunos || response.data || [];
                setEstudantes(lista);

                if (lista.length > 0) {
                    setAlunoSelecionado(lista[0]);
                }
            } catch (error) {
                console.error('Erro ao carregar estudantes:', error);
            } finally {
                setCarregandoEstudantes(false);
            }
        };

        carregarDadosUsuario();
        carregarEstudantes();
    }, []);

    const getInitials = (name) => {
        if (!name || name === 'Usuário') return 'US';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const handleLogout = () => {
        localStorage.removeItem('@RotaSegura:token');
        localStorage.removeItem('@RotaSegura:userName');
        localStorage.removeItem('@RotaSegura:userRole');
        navigate('/', { replace: true });
    };

    return (
        <div className="dashboard-container">
            {/* Menu Lateral Esquerdo - Com restrições baseadas no perfil */}
            <aside className="dashboard-sidebar">
                <div className="sidebar-logo">
                    <h2>RotaSegura</h2>
                </div>
                <nav className="sidebar-nav">
                    <Link to="/dashboard" className="nav-item active">
                        <span className="nav-icon">🏠</span> Inicio
                    </Link>
                    <Link to="/rotas" className="nav-item">
                        <span className="nav-icon">🚌</span> Rotas
                    </Link>
                    
                    {/* Estudantes: Visível para Responsáveis e Administradores */}
                    {userRole !== 'estudante' && (
                        <Link to="/estudantes" className="nav-item">
                            <span className="nav-icon">👤</span> Estudantes
                        </Link>
                    )}

                    <Link to="/historico" className="nav-item">
                        <span className="nav-icon">📋</span> Histórico
                    </Link>
                    <Link to="/notificacoes" className="nav-item">
                        <span className="nav-icon">🔔</span> Notificações
                    </Link>
                    <Link to="/perfil" className="nav-item">
                        <span className="nav-icon">⚙️</span> Perfil
                    </Link>
                    <Link to="/suporte" className="nav-item">
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

            {/* Conteúdo Principal */}
            <main className="dashboard-main">
                <header className="dashboard-header">
                    <div className="welcome-text">
                        <h1>Olá, {userName} <span style={{ fontSize: '12px', background: '#e2e8f0', padding: '2px 8px', borderRadius: '12px', color: '#475569', textTransform: 'capitalize' }}>{userRole}</span></h1>
                    </div>
                    <div className="header-user-actions">
                        <button className="notification-btn" aria-label="Notificações">
                            🔔 <span className="badge">1</span>
                        </button>
                        <div className="user-avatar-initials">{getInitials(fullName)}</div>
                    </div>
                </header>

                {/* Seção Dinâmica de Seleção do Estudante */}
                <section className="student-select-card">
                    {carregandoEstudantes ? (
                        <p style={{ padding: '20px', color: '#666' }}>Carregando dados...</p>
                    ) : estudantes.length === 0 ? (
                        <div style={{ padding: '20px' }}>
                            <p style={{ color: '#666' }}>Nenhum estudante vinculado à sua conta.</p>
                            {userRole !== 'estudante' && (
                                <Link to="/estudantes" style={{ color: '#0d6efd', fontWeight: 'bold' }}>
                                    + Cadastrar um estudante agora
                                </Link>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="student-info-left">
                                <div className="student-avatar">👦</div>
                                <div>
                                    <h2>{alunoSelecionado?.nome}</h2>
                                    <p className="student-grade">Série: {alunoSelecionado?.serie || 'Não informada'}</p>
                                    <p className="student-school">Ponto: {alunoSelecionado?.endereco_embarque || 'Não informado'}</p>
                                    <span className="status-badge active">Transporte ativo</span>
                                </div>
                            </div>
                            
                            {estudantes.length > 1 && (
                                <div className="student-info-right">
                                    <label htmlFor="select-aluno" style={{ fontSize: '13px', color: '#666', marginBottom: '4px', display: 'block' }}>
                                        Selecionar estudante
                                    </label>
                                    <div className="dropdown-box">
                                        <select 
                                            id="select-aluno"
                                            value={alunoSelecionado?.id || ''} 
                                            onChange={(e) => {
                                                const alunoEncontrado = estudantes.find(item => item.id === Number(e.target.value));
                                                setAlunoSelecionado(alunoEncontrado);
                                            }}
                                            style={{ border: 'none', background: 'transparent', outline: 'none', cursor: 'pointer', width: '100%', fontWeight: 'bold' }}
                                        >
                                            {estudantes.map((aluno) => (
                                                <option key={aluno.id} value={aluno.id}>
                                                    👦 {aluno.nome}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </section>

                {/* Demais cards do Dashboard mantidos... */}
                <div className="dashboard-grid">
                    <div className="card next-board-card">
                        <div className="card-header-icon">
                            <span>🚌 Próximo Embarque</span>
                        </div>
                        <div className="board-time">07:15</div>
                        <div className="board-detail-row">
                            <span className="icon">📍</span>
                            <div>
                                <p className="label">Ponto de embarque</p>
                                <p className="value">{alunoSelecionado ? `${alunoSelecionado.endereco_embarque}, ${alunoSelecionado.numero || ''}` : 'Rua das Flores, 123'}</p>
                            </div>
                        </div>
                        <div className="board-detail-row">
                            <span className="icon">🚐</span>
                            <div>
                                <p className="value">Van {alunoSelecionado?.rota_id || '23'}</p>
                            </div>
                        </div>
                        <button className="track-transport-btn">📍 Rastrear transporte</button>
                    </div>

                    <div className="card route-summary-card">
                        <h3>Resumo da rota de hoje</h3>
                        <div className="summary-item">
                            <div>
                                <p className="summary-title">Embarque</p>
                                <p className="summary-desc">{alunoSelecionado ? `${alunoSelecionado.endereco_embarque}, ${alunoSelecionado.numero || ''}` : 'Rua das Flores, 123'}</p>
                            </div>
                            <span className="summary-time">07:15</span>
                        </div>
                        <div className="summary-item">
                            <div>
                                <p className="summary-title">Escola</p>
                                <p className="summary-desc">Colégio Horizonte</p>
                            </div>
                            <span className="summary-time">07:45</span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
