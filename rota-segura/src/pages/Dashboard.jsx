import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api'; // Importa a instância do axios
import './Dashboard.css';

export default function Dashboard() {
    const [userName, setUserName] = useState('Usuário');
    const [fullName, setFullName] = useState('Usuário');

    useEffect(() => {
        const carregarDadosUsuario = async () => {
            let savedName = localStorage.getItem('@RotaSegura:userName');

            // Se não houver nome salvo ou estiver como 'Usuário', tenta buscar da API de perfil
            if (!savedName || savedName === 'Usuário') {
                try {
                    const response = await api.get('/api/usuarios/me'); // Ajuste a rota se necessário conforme seu backend
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

        carregarDadosUsuario();
    }, []);

    // Função corrigida para gerar as iniciais do avatar (ex: "Maria Beatriz" -> "MB")
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
            {/* Menu Lateral Esquerdo */}
            <aside className="dashboard-sidebar">
                <div className="sidebar-logo">
                    <h2>Rota Segura</h2>
                </div>
                <nav className="sidebar-nav">
                    <Link to="/dashboard" className="nav-item active">
                        <span className="nav-icon">🏠</span> Inicio
                    </Link>
                    <Link to="/rotas" className="nav-item">
                        <span className="nav-icon">🚌</span> Rotas
                    </Link>
                    <Link to="/estudantes" className="nav-item">
                        <span className="nav-icon">👤</span> Estudantes
                    </Link>
                    <Link to="/notificacoes" className="nav-item">
                        <span className="nav-icon">🔔</span> Notificações
                    </Link>
                    <Link to="/perfil" className="nav-item">
                        <span className="nav-icon">⚙️</span> Perfil
                    </Link>
                </nav>
                <div className="sidebar-illustration">
                    <div className="school-art"></div>
                </div>
            </aside>

            {/* Conteúdo Principal */}
            <main className="dashboard-main">
                {/* Header Superior */}
                <header className="dashboard-header">
                    <div className="welcome-text">
                        <h1>Olá, {userName}</h1>
                        <p>Acompanhe o transporte escolar de Lucas e fique por dentro de tudo.</p>
                    </div>
                    <div className="header-user-actions">
                        <button className="notification-btn" aria-label="Notificações">
                            🔔 <span className="badge">1</span>
                        </button>
                        <div className="user-avatar-initials">{getInitials(fullName)}</div>
                    </div>
                </header>

                {/* Seção de Seleção do Estudante */}
                <section className="student-select-card">
                    <div className="student-info-left">
                        <div className="student-avatar">👦</div>
                        <div>
                            <h2>Lucas Almeida</h2>
                            <p className="student-grade">5th year</p>
                            <p className="student-school">Colégio Horizonte</p>
                            <span className="status-badge active">Transporte ativo</span>
                        </div>
                    </div>
                    <div className="student-info-right">
                        <label>Selecionar estudante</label>
                        <div className="dropdown-box">
                            <span>👦 Lucas Almeida</span>
                            <span className="dropdown-arrow">▼</span>
                        </div>
                    </div>
                </section>

                {/* Grade de Conteúdos Centrais */}
                <div className="dashboard-grid">
                    {/* Coluna Esquerda: Próximo Embarque */}
                    <div className="card next-board-card">
                        <div className="card-header-icon">
                            <span>🚌 Próximo Embarque</span>
                        </div>
                        <div className="board-time">07:15</div>
                        
                        <div className="board-detail-row">
                            <span className="icon">📍</span>
                            <div>
                                <p className="label">Ponto de embarque</p>
                                <p className="value">Rua das Flores, 123</p>
                            </div>
                        </div>

                        <div className="board-detail-row">
                            <span className="icon">🚐</span>
                            <div>
                                <p className="value">Van 23</p>
                            </div>
                        </div>

                        <div className="board-status-row">
                            <div>
                                <p className="label">Status</p>
                                <p className="status-text">Transporte a caminho</p>
                                <p className="label-sub">Previsão de Chegada: 07:12</p>
                            </div>
                            <div className="status-right">
                                <span className="status-highlight">A caminho</span>
                                <p className="sub-time">Faltam --3 min</p>
                            </div>
                        </div>

                        <button className="track-transport-btn">
                            📍 Track transport
                        </button>
                    </div>

                    {/* Coluna Direita: Resumo da Rota de Hoje */}
                    <div className="card route-summary-card">
                        <h3>Resumo da rota de hoje</h3>
                        <div className="summary-item">
                            <div>
                                <p className="summary-title">Embarque</p>
                                <p className="summary-desc">Rua das Flores, 123</p>
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
                        <div className="summary-item">
                            <div>
                                <p className="summary-title">Desembarque (volta)</p>
                                <p className="summary-desc">Rua das Flores, 123</p>
                            </div>
                            <span className="summary-time">12:30</span>
                        </div>
                    </div>

                    {/* Próximos Eventos */}
                    <div className="card events-card">
                        <div className="card-title-row">
                            <h3>Próximos eventos</h3>
                        </div>
                        <div className="event-item">
                            <div>
                                <p className="event-title">Próximo embarque</p>
                                <p className="event-desc">Rua das Flores, 123</p>
                            </div>
                            <div className="event-time-box">
                                <span className="time">07:15</span>
                                <span className="day">Amanhã</span>
                            </div>
                        </div>
                        <div className="event-item">
                            <div>
                                <p className="event-title">Próximo desembarque</p>
                                <p className="event-desc">Rua das Flores, 123</p>
                            </div>
                            <div className="event-time-box">
                                <span className="time">12:30</span>
                                <span className="day">Amanhã</span>
                            </div>
                        </div>
                        <a href="#all" className="link-action">Ver todos os eventos</a>
                    </div>

                    {/* Atividades Recentes */}
                    <div className="card activities-card">
                        <div className="card-title-row">
                            <h3>Atividades recentes</h3>
                            <a href="#all" className="link-action">Ver todas</a>
                        </div>
                        <ul className="activity-list">
                            <li>
                                <div>
                                    <p className="activity-text">Transporte a caminho do ponto de embarque. Van 23 saiu a garagem.</p>
                                </div>
                                <span className="activity-time">07:02</span>
                            </li>
                            <li>
                                <div>
                                    <p className="activity-text">Lucas embarcou no transporte. Ponto: Rua das Flores, 123</p>
                                </div>
                            </li>
                            <li>
                                <div>
                                    <p className="activity-text">Lucas chegou à escola. Colégio Horizonte</p>
                                </div>
                            </li>
                            <li>
                                <div>
                                    <p className="activity-text">Aviso: Reunião de pais e responsáveis. Sexta-feira, 24/05 às 18:30.</p>
                                </div>
                                <span className="activity-time">Ontem</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </main>
        </div>
    );
}
