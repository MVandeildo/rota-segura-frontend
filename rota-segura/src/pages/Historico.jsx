import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Dashboard.css';

export default function Historico() {
    const navigate = useNavigate();

    const [userName, setUserName] = useState('Usuário');
    const [fullName, setFullName] = useState('Usuário');
    const [historicoViagens, setHistoricoViagens] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [filtroPeriodo, setFiltroPeriodo] = useState('todos');

    useEffect(() => {
        const savedName = localStorage.getItem('@RotaSegura:userName');
        if (savedName) {
            setFullName(savedName);
            setUserName(savedName.trim().split(' ')[0]);
        }
    }, []);

    useEffect(() => {
        carregarHistorico();
    }, [filtroPeriodo]);

    const calcularDatasFiltro = (periodo) => {
        const hoje = new Date();
        const formatarData = (d) => d.toISOString().split('T')[0];

        if (periodo === 'semana') {
            const umaSemanaAtras = new Date();
            umaSemanaAtras.setDate(hoje.getDate() - 7);
            return {
                data_inicio: formatarData(umaSemanaAtras),
                data_fim: formatarData(hoje)
            };
        }

        if (periodo === 'mes') {
            const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
            return {
                data_inicio: formatarData(primeiroDiaMes),
                data_fim: formatarData(hoje)
            };
        }

        return { data_inicio: undefined, data_fim: undefined };
    };

    const carregarHistorico = async () => {
        try {
            setCarregando(true);
            const { data_inicio, data_fim } = calcularDatasFiltro(filtroPeriodo);

            const params = {};
            if (data_inicio) params.data_inicio = data_inicio;
            if (data_fim) params.data_fim = data_fim;

            const response = await api.get('/api/relatorios/auditoria', { params });
            
            const registros = response.data?.registros || response.data || [];
            setHistoricoViagens(registros);
        } catch (error) {
            console.error('Erro ao carregar o histórico de viagens:', error);
            setHistoricoViagens([]);
        } finally {
            setCarregando(false);
        }
    };

    const getInitials = (name) => {
        if (!name || name === 'Usuário') return 'US';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const formatarDataHora = (dataString) => {
        if (!dataString) return '-';
        const data = new Date(dataString);
        return isNaN(data) ? dataString : data.toLocaleString('pt-BR');
    };

    const handleLogout = () => {
        localStorage.removeItem('@RotaSegura:token');
        localStorage.removeItem('@RotaSegura:userName');
        localStorage.removeItem('@RotaSegura:userRole');
        navigate('/', { replace: true });
    };

    return (
        <div className="dashboard-container">
            <aside className="dashboard-sidebar">
                <div className="sidebar-logo">
                    <h2>RotaSegura</h2>
                </div>
                <nav className="sidebar-nav">
                    <Link to="/dashboard" className="nav-item">
                        <span className="nav-icon">🏠</span> Inicio
                    </Link>
                    <Link to="/rotas" className="nav-item">
                        <span className="nav-icon">🚌</span> Rotas
                    </Link>
                    <Link to="/estudantes" className="nav-item">
                        <span className="nav-icon">👤</span> Estudantes
                    </Link>
                    <Link to="/historico" className="nav-item active">
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

            <main className="dashboard-main">
                <header className="dashboard-header">
                    <div className="welcome-text">
                        <h1>Histórico de Viagens</h1>
                        <p>Consulte o registro cronológico dos transportes realizados pelos estudantes.</p>
                    </div>
                    <div className="header-user-actions">
                        <div className="user-avatar-initials">{getInitials(fullName)}</div>
                    </div>
                </header>

                <div className="card" style={{ marginTop: '20px', padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                        <h3>Registros Anteriores</h3>
                        <div>
                            <label style={{ fontSize: '13px', marginRight: '8px', color: '#666' }}>Filtrar período:</label>
                            <select 
                                value={filtroPeriodo} 
                                onChange={(e) => setFiltroPeriodo(e.target.value)}
                                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #ccc', background: '#fff' }}
                            >
                                <option value="todos">Todos os registros</option>
                                <option value="semana">Última semana</option>
                                <option value="mes">Este mês</option>
                            </select>
                        </div>
                    </div>

                    {carregando ? (
                        <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>A carregar histórico...</p>
                    ) : historicoViagens.length === 0 ? (
                        <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>Nenhum registro de viagem encontrado.</p>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid #eee', color: '#555', fontSize: '14px' }}>
                                        <th style={{ padding: '12px' }}>Estudante</th>
                                        <th style={{ padding: '12px' }}>Data e Hora</th>
                                        <th style={{ padding: '12px' }}>Tipo de Evento</th>
                                        <th style={{ padding: '12px' }}>Rota</th>
                                        <th style={{ padding: '12px' }}>Motorista</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {historicoViagens.map((item) => (
                                        <tr key={item.presenca_id || item.id} style={{ borderBottom: '1px solid #f1f1f1', fontSize: '14px' }}>
                                            <td style={{ padding: '12px', fontWeight: '500' }}>{item.aluno_nome}</td>
                                            <td style={{ padding: '12px' }}>{formatarDataHora(item.registrado_em)}</td>
                                            <td style={{ padding: '12px' }}>
                                                <span style={{ 
                                                    background: '#d1e7dd', 
                                                    color: '#0f5132', 
                                                    padding: '4px 8px', 
                                                    borderRadius: '4px', 
                                                    fontSize: '12px', 
                                                    fontWeight: 'bold' 
                                                }}>
                                                    {item.tipo}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px' }}>{item.rota_nome}</td>
                                            <td style={{ padding: '12px' }}>{item.motorista_nome}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
