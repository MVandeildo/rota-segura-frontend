import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';

export default function Suporte() {
    const navigate = useNavigate();

    const fullName = localStorage.getItem('@RotaSegura:userName') || 'Usuário';
    const [assunto, setAssunto] = useState('');
    const [categoria, setCategoria] = useState('geral');
    const [mensagem, setMensagem] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [sucesso, setSucesso] = useState('');
    const [erro, setErro] = useState('');

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErro('');
        setSucesso('');

        if (!assunto.trim() || !mensagem.trim()) {
            setErro('Por favor, preencha o assunto e a mensagem.');
            return;
        }

        try {
            setEnviando(true);
            
            setTimeout(() => {
                setSucesso('Mensagem enviada com sucesso! A nossa equipa entrará em contacto em breve.');
                setAssunto('');
                setMensagem('');
                setEnviando(false);
            }, 1000);
        } catch (err) {
            setErro('Ocorreu um erro ao enviar a mensagem. Tente novamente.');
            setEnviando(false);
        }
    };

    return (
        <div className="dashboard-container">
            {/* Menu Lateral Esquerdo */}
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
                    <Link to="/historico" className="nav-item">
                        <span className="nav-icon">📋</span> Histórico
                    </Link>
                    <Link to="/notificacoes" className="nav-item">
                        <span className="nav-icon">🔔</span> Notificações
                    </Link>
                    <Link to="/perfil" className="nav-item">
                        <span className="nav-icon">⚙️</span> Perfil
                    </Link>
                    <Link to="/suporte" className="nav-item active">
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
                        <h1>Central de Ajuda e Suporte</h1>
                        <p>Tire as suas dúvidas ou envie uma mensagem diretamente para a administração.</p>
                    </div>
                    <div className="header-user-actions">
                        <div className="user-avatar-initials">{getInitials(fullName)}</div>
                    </div>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
                    {/* Formulário de Contato */}
                    <div className="card" style={{ padding: '24px' }}>
                        <h3 style={{ marginBottom: '16px' }}>Enviar uma mensagem</h3>

                        {sucesso && (
                            <div style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', border: '1px solid #bbf7d0' }}>
                                {sucesso}
                            </div>
                        )}

                        {erro && (
                            <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', border: '1px solid #fecaca' }}>
                                {erro}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '6px' }}>Categoria</label>
                                <select 
                                    value={categoria} 
                                    onChange={(e) => setCategoria(e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', background: '#fff' }}
                                >
                                    <option value="geral">Dúvida Geral</option>
                                    <option value="atraso">Atraso ou Problema na Rota</option>
                                    <option value="cadastro">Alteração de Cadastro / Aluno</option>
                                    <option value="outro">Outro assunto</option>
                                </select>
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '6px' }}>Assunto</label>
                                <input 
                                    type="text" 
                                    placeholder="Ex: Alteração no ponto de embarque" 
                                    value={assunto}
                                    onChange={(e) => setAssunto(e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                                />
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '6px' }}>Mensagem</label>
                                <textarea 
                                    rows="4" 
                                    placeholder="Descreva detalhadamente a sua dúvida ou ocorrência..." 
                                    value={mensagem}
                                    onChange={(e) => setMensagem(e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', resize: 'vertical' }}
                                />
                            </div>

                            <button 
                                type="submit" 
                                disabled={enviando}
                                style={{ background: '#0d6efd', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', width: '100%' }}
                            >
                                {enviando ? 'A enviar...' : 'Enviar Mensagem'}
                            </button>
                        </form>
                    </div>

                    {/* Perguntas Frequentes (FAQ) */}
                    <div className="card" style={{ padding: '24px' }}>
                        <h3 style={{ marginBottom: '16px' }}>Perguntas Frequentes (FAQ)</h3>
                        
                        <div style={{ marginBottom: '16px' }}>
                            <strong style={{ display: 'block', color: '#333', marginBottom: '4px' }}>Como posso rastrear a van em tempo real?</strong>
                            <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>No painel "Início", selecione o estudante desejado e clique no botão "Rastrear transporte" para ver a estimativa de chegada.</p>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <strong style={{ display: 'block', color: '#333', marginBottom: '4px' }}>O que fazer se o aluno faltar à aula?</strong>
                            <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>Pode enviar uma mensagem por esta página de suporte com antecedência para alertar o motorista sobre a ausência.</p>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <strong style={{ display: 'block', color: '#333', marginBottom: '4px' }}>Como alterar o endereço de embarque?</strong>
                            <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>Vá até o menu "Estudantes", edite os dados do dependente correspondente ou entre em contacto com a administração.</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
