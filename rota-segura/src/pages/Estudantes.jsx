import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import './Dashboard.css'; 

export default function Estudantes() {
    const [alunos, setAlunos] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [modalAberto, setModalAberto] = useState(false);
    const [alunoEmEdicao, setAlunoEmEdicao] = useState(null);

    // Estados do formulário
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
        rota_id: 1 // Valor padrão ou obtido de rotas cadastradas
    });

    // Buscar alunos ao carregar a página
    const carregarAlunos = async () => {
        try {
            setCarregando(true);
            const response = await api.get('/api/alunos'); // Rota protegida que filtra pelo responsável logado
            const lista = response.data?.alunos || response.data || [];
            setAlunos(lista);
        } catch (error) {
            console.error('Erro ao carregar estudantes:', error);
        } finally {
            setCarregando(false);
        }
    };

    useEffect(() => {
        carregarAlunos();
    }, []);

    // Abrir modal para cadastro ou edição
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
        }
        setModalAberto(true);
    };

    const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        const usuarioId = obterUsuarioLogadoId();

        const dadosParaEnviar = {
            ...formData,
            responsavel_id: formData.responsavel_id || usuarioId // Vincula automaticamente ao responsável logado
        };

        if (alunoEmEdicao) {
            await api.put(`/api/alunos/${alunoEmEdicao.id}`, dadosParaEnviar);
        } else {
            await api.post('/api/alunos', dadosParaEnviar);
        }
        setModalAberto(false);
        carregarAlunos();
    } catch (error) {
        console.error('Erro ao salvar estudante:', error);
        alert(error.response?.data?.erro || 'Erro ao guardar dados do estudante.');
    }
    };

    // Deletar ou desativar aluno
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

    const obterUsuarioLogadoId = () => {
        const token = localStorage.getItem('@RotaSegura:token');
        if (!token) return null;
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload).id;
        } catch (e) {
            return null;
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

            {/* Conteúdo Principal */}
            <main className="dashboard-main">
                <header className="dashboard-header">
                    <div className="welcome-text">
                        <h1>Gerenciamento de Estudantes</h1>
                        <p>Cadastre e gira os seus dependentes e dados de transporte.</p>
                    </div>
                    <button 
                        onClick={() => abrirModal()} 
                        style={{ padding: '10px 20px', background: '#0d6efd', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        + Novo Estudante
                    </button>
                </header>

                {/* Tabela de Estudantes */}
                <div className="card" style={{ marginTop: '20px', padding: '20px', overflowX: 'auto' }}>
                    {carregando ? (
                        <p>A carregar estudantes...</p>
                    ) : alunos.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#666' }}>Nenhum estudante cadastrado para esta conta.</p>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #eee', color: '#555' }}>
                                    <th style={{ padding: '12px' }}>Nome</th>
                                    <th style={{ padding: '12px' }}>Série</th>
                                    <th style={{ padding: '12px' }}>Endereço de Embarque</th>
                                    <th style={{ padding: '12px' }}>Cidade</th>
                                    <th style={{ padding: '12px' }}>Responsável</th> {/* Nova Coluna */}
                                    <th style={{ padding: '12px', textAlign: 'center' }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {alunos.map((aluno) => (
                                    <tr key={aluno.id} style={{ borderBottom: '1px solid #f1f1f1' }}>
                                        <td style={{ padding: '12px', fontWeight: '500' }}>{aluno.nome}</td>
                                        <td style={{ padding: '12px' }}>{aluno.serie}</td>
                                        <td style={{ padding: '12px' }}>{aluno.endereco_embarque}, {aluno.numero}</td>
                                        <td style={{ padding: '12px' }}>{aluno.cidade}</td>
                                        <td style={{ padding: '12px', color: '#555' }}>{aluno.responsavel_nome || 'Não vinculado'}</td> {/* Exibe o nome */}
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
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Modal Simples de Cadastro/Edição */}
                {modalAberto && (
                    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                        <div style={{ background: '#fff', padding: '30px', borderRadius: '8px', width: '500px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
                            <h2>{alunoEmEdicao ? 'Editar Estudante' : 'Cadastrar Novo Estudante'}</h2>
                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px' }}>
                                <input 
                                    type="text" placeholder="Nome Completo" value={formData.nome} 
                                    onChange={(e) => setFormData({...formData, nome: e.target.value})} required 
                                    style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                />
                                <input 
                                    type="date" placeholder="Data de Nascimento" value={formData.data_nascimento} 
                                    onChange={(e) => setFormData({...formData, data_nascimento: e.target.value})} required 
                                    style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                />
                                <input 
                                    type="text" placeholder="Série (ex: 5º Ano)" value={formData.serie} 
                                    onChange={(e) => setFormData({...formData, serie: e.target.value})} required 
                                    style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                />
                                <input 
                                    type="text" placeholder="Endereço de Embarque (Rua, Av...)" value={formData.endereco_embarque} 
                                    onChange={(e) => setFormData({...formData, endereco_embarque: e.target.value})} required 
                                    style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                />
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input 
                                        type="text" placeholder="Número" value={formData.numero} 
                                        onChange={(e) => setFormData({...formData, numero: e.target.value})} required 
                                        style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', flex: 1 }}
                                    />
                                    <input 
                                        type="text" placeholder="Bairro" value={formData.bairro} 
                                        onChange={(e) => setFormData({...formData, bairro: e.target.value})} required 
                                        style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', flex: 2 }}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input 
                                        type="text" placeholder="Cidade" value={formData.cidade} 
                                        onChange={(e) => setFormData({...formData, cidade: e.target.value})} required 
                                        style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', flex: 2 }}
                                    />
                                    <input 
                                        type="text" placeholder="Estado (UF)" value={formData.estado} 
                                        onChange={(e) => setFormData({...formData, estado: e.target.value})} required 
                                        style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', flex: 1 }}
                                    />
                                </div>
                                <input 
                                    type="text" placeholder="CEP" value={formData.cep} 
                                    onChange={(e) => setFormData({...formData, cep: e.target.value})} 
                                    style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                />
                                <input 
                                    type="number" placeholder="ID da Rota" value={formData.rota_id} 
                                    onChange={(e) => setFormData({...formData, rota_id: e.target.value})} required 
                                    style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '15px' }}>
                                    <button 
                                        type="button" onClick={() => setModalAberto(false)}
                                        style={{ padding: '10px 15px', background: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        type="submit"
                                        style={{ padding: '10px 15px', background: '#198754', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        Salvar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
