import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Dashboard.css';

export default function AcompanhamentoRotas() {
    const navigate = useNavigate();
    const [rotas, setRotas] = useState([]);
    const [alunos, setAlunos] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const fullName = localStorage.getItem('@RotaSegura:userName') || 'Usuário';

    useEffect(() => {
        carregarDados();
    }, []);

    const carregarDados = async () => {
        try {
            setCarregando(true);
            const [resRotas, resAlunos] = await Promise.all([
                api.get('/api/rotas'),
                api.get('/api/alunos')
            ]);
            
            const listaRotas = resRotas.data?.rotas || resRotas.data || [];
            const listaAlunos = resAlunos.data?.alunos || resAlunos.data || [];
            
            setRotas(listaRotas.filter(r => r.ativa !== false));
            setAlunos(listaAlunos);
        } catch (error) {
            console.error('Erro ao carregar dados de acompanhamento:', error);
        } finally {
            setCarregando(false);
        }
    };

    const handleConcluirViagem = async (rota) => {
        if (!window.confirm(`Deseja concluir a viagem da rota "${rota.nome}"?`)) {
            return;
        }

        try {
            const response = await api.post(
                `/api/viagens/rota/${rota.id}/finalizar`
            );

            alert(response.data.mensagem);

            navigate('/historico');

        } catch (error) {
            console.error(
                'Erro ao concluir viagem:',
                error.response?.data || error
            );

            alert(
                error.response?.data?.erro ||
                'Não foi possível concluir a viagem.'
            );
        }
    };

    const handleInativarRota = async (rota) => {
        if (window.confirm(`Tem certeza que deseja inativar a rota "${rota.nome}"?`)) {
            try {
                await api.patch(`/api/rotas/${rota.id}/status`, { ativa: false });
                alert('Rota inativada com sucesso.');
                carregarDados();
            } catch (error) {
                console.error('Erro ao inativar rota:', error);
                alert('Não foi possível inativar a rota.');
            }
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/', { replace: true });
    };

    const getInitials = (name) => {
        if (!name || name === 'Usuário') return 'US';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    return (
        <div className="dashboard-container">
            <aside className="dashboard-sidebar">
                <div className="sidebar-logo">
                    <h2>RotaSegura</h2>
                </div>
                <nav className="sidebar-nav">
                    <Link to="/dashboard" className="nav-item">
                        <span className="nav-icon">🏠</span> Início
                    </Link>
                    <Link to="/rotas" className="nav-item">
                        <span className="nav-icon">🚌</span> Rotas
                    </Link>
                    <Link to="/estudantes" className="nav-item">
                        <span className="nav-icon">👤</span> Estudantes
                    </Link>
                    <Link to="/historico" className="nav-item">
                        <span className="nav-icon">📋</span> Histórico
                    </Link>
                    <Link to="/acompanhamento" className="nav-item active">
                        <span className="nav-icon">📍</span> Acompanhamento
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
                        style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', color: '#ff6b6b', marginTop: 'auto', display: 'flex', alignItems: 'center', padding: '12px 16px' }}
                    >
                        <span className="nav-icon">🚪</span> Sair
                    </button>
                </nav>
            </aside>

            <main className="dashboard-main">
                <header className="dashboard-header">
                    <div className="welcome-text">
                        <h1>Acompanhamento de Rotas</h1>
                        <p>Monitore o status operacional e conclua viagens para alimentar o histórico e relatórios.</p>
                    </div>
                    <div className="user-avatar-initials">{getInitials(fullName)}</div>
                </header>

                <div className="card" style={{ marginTop: '20px', padding: '20px' }}>
                    <h3>Rotas Operacionais Cadastradas</h3>
                    
                    {carregando ? (
                        <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>Carregando rotas...</p>
                    ) : rotas.length === 0 ? (
                        <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>Nenhuma rota ativa encontrada no sistema.</p>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '15px', marginTop: '15px' }}>
                            {rotas.map((rota) => (
                                <div key={rota.id} style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '18px', background: '#fafafa', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                            <h4 style={{ color: '#0B192C', margin: 0 }}>{rota.nome}</h4>
                                            <span style={{ background: '#d1e7dd', color: '#0f5132', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                                                Ativa
                                            </span>
                                        </div>
                                        <p style={{ fontSize: '13px', color: '#555', marginBottom: '5px' }}><strong>ID da Rota:</strong> {rota.id}</p>
                                        <p style={{ fontSize: '13px', color: '#555', marginBottom: '5px' }}><strong>Veículo:</strong> {rota.veiculo || 'Não atribuído'}</p>
                                        <p style={{ fontSize: '13px', color: '#555', marginBottom: '15px' }}><strong>Motorista:</strong> {rota.motorista_nome || 'Não vinculado'}</p>
                                    </div>

                                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                                        <button 
                                            onClick={() => handleConcluirViagem(rota)}
                                            style={{ flex: 1, padding: '8px 10px', background: '#198754', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                                        >
                                            ✅ Concluir Viagem
                                        </button>
                                        <button 
                                            onClick={() => handleInativarRota(rota)}
                                            style={{ padding: '8px 10px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                                        >
                                            Inativar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}