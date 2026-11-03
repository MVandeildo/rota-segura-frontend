import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Dashboard.css';

export default function Estudantes() {
    const navigate = useNavigate();
    const [alunos, setAlunos] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [modalAberto, setModalAberto] = useState(false);
    const [alunoEmEdicao, setAlunoEmEdicao] = useState(null);
    const userRole = localStorage.getItem('@RotaSegura:userRole') || 'responsavel';

    const [formData, setFormData] = useState({
        nome: '',
        data_nascimento: '',
        serie: '',
        endereco_embarque: '',
        numero: '',
        bairro: '',
        cidade: '',
        estado: '',
        cep: '',
        rota_id: 1
    });

    useEffect(() => {
        // Se for estudante, bloqueia o acesso direto a esta tela de gerenciamento
        if (userRole === 'estudante') {
            alert('Acesso restrito a responsáveis e administradores.');
            navigate('/dashboard', { replace: true });
            return;
        }
        carregarAlunos();
    }, [userRole, navigate]);

    const carregarAlunos = async () => {
        try {
            setCarregando(true);
            const response = await api.get('/api/alunos');
            const lista = response.data?.alunos || response.data || [];
            setAlunos(lista);
        } catch (error) {
            console.error('Erro ao carregar estudantes:', error);
        } finally {
            setCarregando(false);
        }
    };

    const abrirModal = (aluno = null) => {
        if (aluno) {
            setAlunoEmEdicao(aluno);
            setFormData({
                nome: aluno.nome || '',
                data_nascimento: aluno.data_nascimento ? aluno.data_nascimento.slice(0, 10) : '',
                serie: aluno.serie || '',
                endereco_embarque: aluno.endereco_embarque || '',
                numero: aluno.numero || '',
                bairro: aluno.bairro || '',
                cidade: aluno.cidade || '',
                estado: aluno.estado || '',
                cep: aluno.cep || '',
                rota_id: aluno.rota_id || 1
            });
        } else {
            setAlunoEmEdicao(null);
            setFormData({
                nome: '', data_nascimento: '', serie: '', endereco_embarque: '',
                numero: '', bairro: '', cidade: '', estado: '', cep: '', rota_id: 1
            });
        }
        setModalAberto(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (alunoEmEdicao) {
                await api.put(`/api/alunos/${alunoEmEdicao.id}`, formData);
            } else {
                await api.post('/api/alunos', formData);
            }
            setModalAberto(false);
            carregarAlunos();
        } catch (error) {
            console.error('Erro ao salvar estudante:', error);
            alert(error.response?.data?.erro || 'Erro ao guardar dados do estudante.');
        }
    };

    const handleExcluir = async (id) => {
        if (window.confirm('Tem certeza que deseja remover este estudante?')) {
            try {
                await api.delete(`/api/alunos/${id}`);
                carregarAlunos();
            } catch (error) {
                console.error('Erro ao excluir estudante:', error);
            }
        }
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
                    <Link to="/estudantes" className="nav-item active">
                        <span className="nav-icon">👤</span> Estudantes
                    </Link>
                    <Link to="/notificacoes" className="nav-item">
                        <span className="nav-icon">🔔</span> Notificações
                    </Link>
                    <Link to="/perfil" className="nav-item">
                        <span className="nav-icon">⚙️</span> Perfil
                    </Link>
                </nav>
            </aside>

            <main className="dashboard-main">
                <header className="dashboard-header">
                    <div className="welcome-text">
                        <h1>Gerenciamento de Estudantes</h1>
                        <p>Cadastre e gerencie seus dependentes e dados de transporte.</p>
                    </div>
                    {userRole !== 'estudante' && (
                        <button 
                            onClick={() => abrirModal()} 
                            style={{ padding: '10px 20px', background: '#0d6efd', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                            + Novo Estudante
                        </button>
                    )}
                </header>

                <div className="card" style={{ marginTop: '20px', padding: '20px', overflowX: 'auto' }}>
                    {carregando ? (
                        <p>A carregar estudantes...</p>
                    ) : alunos.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#666' }}>Nenhum estudante cadastrado.</p>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #eee', color: '#555' }}>
                                    <th style={{ padding: '12px' }}>Nome</th>
                                    <th style={{ padding: '12px' }}>Série</th>
                                    <th style={{ padding: '12px' }}>Endereço</th>
                                    <th style={{ padding: '12px' }}>Cidade</th>
                                    {userRole !== 'estudante' && <th style={{ padding: '12px', textAlign: 'center' }}>Ações</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {alunos.map((aluno) => (
                                    <tr key={aluno.id} style={{ borderBottom: '1px solid #f1f1f1' }}>
                                        <td style={{ padding: '12px', fontWeight: '500' }}>{aluno.nome}</td>
                                        <td style={{ padding: '12px' }}>{aluno.serie}</td>
                                        <td style={{ padding: '12px' }}>{aluno.endereco_embarque}, {aluno.numero}</td>
                                        <td style={{ padding: '12px' }}>{aluno.cidade}</td>
                                        {userRole !== 'estudante' && (
                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                <button 
                                                    onClick={() => abrirModal(aluno)}
                                                    style={{ marginRight: '8px', padding: '6px 12px', background: '#ffc107', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                                >
                                                    Editar
                                                </button>
                                                <button 
                                                    onClick={() => handleExcluir(aluno.id)}
                                                    style={{ padding: '6px 12px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                                >
                                                    Excluir
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </main>
        </div>
    );
}
