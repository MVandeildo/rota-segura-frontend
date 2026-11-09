import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Dashboard.css';

export default function Estudantes() {
    const navigate = useNavigate();
    const [alunos, setAlunos] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [modalAberto, setModalAberto] = useState(false);
    const [modalVisualizarAberto, setModalVisualizarAberto] = useState(false);
    const [alunoEmEdicao, setAlunoEmEdicao] = useState(null);
    const [alunoVisualizando, setAlunoVisualizando] = useState(null);
    const [salvando, setSalvando] = useState(false);
    const [termoBusca, setTermoBusca] = useState('');
    
    const userRole = localStorage.getItem('@RotaSegura:userRole') || 'responsavel';
    const userId = localStorage.getItem('@RotaSegura:userId') || '';
    const fullName = localStorage.getItem('@RotaSegura:userName') || 'Usuário';

    // Verifica se é administrador
    const ehAdmin = userRole === 'administrador' || userRole === 'admin';

    const [formData, setFormData] = useState({
        nome: '',
        data_nascimento: '',
        serie: '',
        email_responsavel: '',
        responsavel_email: '',
        email_estudante: '', // Credencial de login do estudante
        senha_estudante: '', // Senha inicial de acesso
        endereco_embarque: '',
        numero: '',
        bairro: '',
        cidade: '',
        estado: '',
        cep: '',
        rota_id: 1
    });

    useEffect(() => {
        carregarAlunos();
    }, [userRole, navigate, userId]);

    const carregarAlunos = async () => {
        try {
            setCarregando(true);
            const response = await api.get('/api/alunos');
            let lista = response.data?.alunos || response.data || [];

            if (userRole === 'responsavel' && userId) {
                lista = lista.filter(aluno => String(aluno.responsavel_id) === String(userId));
            } else if (userRole === 'estudante' && userId) {
                lista = lista.filter(aluno => String(aluno.usuario_id) === String(userId) || String(aluno.id) === String(userId));
            }

            setAlunos(lista);
        } catch (error) {
            console.error('Erro ao carregar estudantes:', error);
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

    const handleLogout = () => {
        localStorage.clear();
        navigate('/', { replace: true });
    };

    const alunoMenorDeIdade = (dataNascimento) => {
        if (!dataNascimento) return true;
        const hoje = new Date();
        const nascimento = new Date(dataNascimento + 'T00:00:00');
        let idade = hoje.getFullYear() - nascimento.getFullYear();
        const m = hoje.getMonth() - nascimento.getMonth();
        if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
            idade--;
        }
        return idade < 18;
    };

    const abrirModal = (aluno = null) => {
        if (!ehAdmin) return;

        if (aluno) {
            setAlunoEmEdicao(aluno);
            const dataNasc = aluno.data_nascimento ? aluno.data_nascimento.slice(0, 10) : '';
            const emailResp = aluno.email_responsavel || aluno.responsavel_email || '';
            setFormData({
                nome: aluno.nome || '',
                data_nascimento: dataNasc,
                serie: aluno.serie || '',
                email_responsavel: emailResp,
                responsavel_email: emailResp,
                email_estudante: aluno.email_estudante || '', // Disponível também na edição
                senha_estudante: '', // Senha vazia por segurança para redefinição opcional
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
                email_responsavel: '', 
                responsavel_email: '', 
                email_estudante: '',
                senha_estudante: '',
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

    const fecharModal = () => {
        setModalAberto(false);
        setAlunoEmEdicao(null);
    };

    const abrirModalVisualizar = (aluno) => {
        setAlunoVisualizando(aluno);
        setModalVisualizarAberto(true);
    };

    const fecharModalVisualizar = () => {
        setModalVisualizarAberto(false);
        setAlunoVisualizando(null);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: value,
            ...(name === 'email_responsavel' ? { responsavel_email: value } : {}),
            ...(name === 'responsavel_email' ? { email_responsavel: value } : {})
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!ehAdmin) {
            alert('Apenas administradores podem realizar esta ação.');
            return;
        }

        try {
            setSalvando(true);
            
            const payload = {
                ...formData,
                userRole: userRole,
                responsavel_email: formData.email_responsavel || formData.responsavel_email,
                rota_id: Number(formData.rota_id)
            };

            if (alunoEmEdicao) {
                await api.put(`/api/alunos/${alunoEmEdicao.id}`, payload);
            } else {
                await api.post('/api/alunos', payload);
            }
            fecharModal();
            await carregarAlunos();
        } catch (error) {
            console.error('Erro detalhado do backend:', error.response?.data);
            const mensagemErro = error.response?.data?.erro || error.response?.data?.message || error.message || 'Erro ao guardar dados do estudante.';
            alert(`Erro ao salvar: ${mensagemErro}`);
        } finally {
            setSalvando(false);
        }
    };

    const handleExcluir = async (id) => {
        if (!ehAdmin) return;
        if (window.confirm('Tem certeza que deseja remover este estudante?')) {
            try {
                await api.delete(`/api/alunos/${id}`);
                await carregarAlunos();
            } catch (error) {
                console.error('Erro ao excluir estudante:', error);
                alert('Ocorreu um erro ao excluir o estudante.');
            }
        }
    };

    const alunosFiltrados = alunos.filter(aluno => {
        const termo = termoBusca.toLowerCase();
        const nomeMatch = aluno.nome?.toLowerCase().includes(termo);
        const serieMatch = aluno.serie?.toLowerCase().includes(termo);
        return nomeMatch || serieMatch;
    });

    const menorIdadeAtual = alunoMenorDeIdade(formData.data_nascimento);

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
                        style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', color: '#ff6b6b', marginTop: 'auto', display: 'flex', alignItems: 'center', padding: '12px 16px' }}
                    >
                        <span className="nav-icon">🚪</span> Sair
                    </button>
                </nav>
            </aside>

            <main className="dashboard-main">
                <header className="dashboard-header">
                    <div className="welcome-text">
                        <h1>Gerenciamento de Estudantes</h1>
                        <p>{ehAdmin ? 'Cadastre e gerencie todos os estudantes do sistema.' : 'Visualize seus dados de transporte.'}</p>
                    </div>
                    <div className="header-user-actions" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        {ehAdmin && (
                            <button 
                                onClick={() => abrirModal()} 
                                style={{ padding: '10px 18px', background: '#0d6efd', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
                            >
                                + Novo Estudante
                            </button>
                        )}
                        <div className="user-avatar-initials">{getInitials(fullName)}</div>
                    </div>
                </header>

                {/* NOTA: A barra flutuante de seleção de estudante foi completamente removida daqui */}

                <div className="card" style={{ marginTop: '20px', padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                        <input 
                            type="text" 
                            placeholder="Filtrar por nome ou série..." 
                            value={termoBusca} 
                            onChange={(e) => setTermoBusca(e.target.value)}
                            style={{ padding: '8px 12px', width: '100%', maxWidth: '320px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' }}
                        />
                        <span style={{ fontSize: '13px', color: '#666' }}>
                            Total exibido: <strong>{alunosFiltrados.length}</strong> de {alunos.length}
                        </span>
                    </div>

                    {carregando ? (
                        <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>A carregar estudantes...</p>
                    ) : alunos.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '30px' }}>
                            <p style={{ color: '#666', marginBottom: '15px' }}>Nenhum estudante encontrado para a sua conta.</p>
                            {ehAdmin && (
                                <button 
                                    onClick={() => abrirModal()} 
                                    style={{ padding: '10px 20px', background: '#0d6efd', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                    + Cadastrar primeiro estudante
                                </button>
                            )}
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid #eee', color: '#555' }}>
                                        <th style={{ padding: '12px' }}>Nome</th>
                                        <th style={{ padding: '12px' }}>Série</th>
                                        <th style={{ padding: '12px' }}>Responsável</th>
                                        <th style={{ padding: '12px' }}>Endereço</th>
                                        <th style={{ padding: '12px', textAlign: 'center' }}>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {alunosFiltrados.map((aluno) => (
                                        <tr key={aluno.id} style={{ borderBottom: '1px solid #f1f1f1' }}>
                                            <td style={{ padding: '12px', fontWeight: '500' }}>{aluno.nome}</td>
                                            <td style={{ padding: '12px' }}>{aluno.serie || 'Não informada'}</td>
                                            <td style={{ padding: '12px' }}>{aluno.email_responsavel || aluno.responsavel_email || 'Não vinculado'}</td>
                                            <td style={{ padding: '12px' }}>
                                                {aluno.endereco_embarque}{aluno.numero ? `, ${aluno.numero}` : ''} - {aluno.bairro}
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                                <button 
                                                    onClick={() => abrirModalVisualizar(aluno)}
                                                    title="Visualizar Detalhes"
                                                    style={{ marginRight: '6px', padding: '6px 10px', background: '#17a2b8', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                                >
                                                    👁️ Visualizar
                                                </button>

                                                {ehAdmin ? (
                                                    <>
                                                        <button 
                                                            onClick={() => abrirModal(aluno)}
                                                            title="Editar Estudante"
                                                            style={{ marginRight: '6px', padding: '6px 10px', background: '#ffc107', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                                        >
                                                            ✏️ Editar
                                                        </button>
                                                        <button 
                                                            onClick={() => handleExcluir(aluno.id)}
                                                            title="Excluir Estudante"
                                                            style={{ padding: '6px 10px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                                        >
                                                            🗑️ Excluir
                                                        </button>
                                                    </>
                                                ) : (
                                                    <span style={{ fontSize: '12px', color: '#9ca3af', fontStyle: 'italic', marginLeft: '6px' }}>Somente leitura</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>

            {/* Modal de Cadastro / Edição */}
            {modalAberto && ehAdmin && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#fff', padding: '25px 30px', borderRadius: '8px', width: '100%', maxWidth: '520px', maxHeight: '92vh', overflowY: 'auto' }}>
                        <h2 style={{ marginBottom: '15px', color: '#0B192C', fontSize: '20px' }}>
                            {alunoEmEdicao ? 'Editar Estudante' : 'Novo Estudante'}
                        </h2>
                        
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '10px' }}>
                                <label style={{ display: 'block', fontSize: '13px', marginBottom: '3px', fontWeight: '500' }}>Nome Completo *</label>
                                <input type="text" name="nome" value={formData.nome} onChange={handleChange} required style={{ width: '100%', padding: '7px 10px', borderRadius: '4px', border: '1px solid #ccc' }} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', marginBottom: '3px', fontWeight: '500' }}>Data Nasc. *</label>
                                    <input type="date" name="data_nascimento" value={formData.data_nascimento} onChange={handleChange} required style={{ width: '100%', padding: '7px 10px', borderRadius: '4px', border: '1px solid #ccc' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', marginBottom: '3px', fontWeight: '500' }}>Série *</label>
                                    <input type="text" name="serie" placeholder="Ex: 5º Ano" value={formData.serie} onChange={handleChange} required style={{ width: '100%', padding: '7px 10px', borderRadius: '4px', border: '1px solid #ccc' }} />
                                </div>
                            </div>

                            <div style={{ marginBottom: '10px' }}>
                                <label style={{ display: 'block', fontSize: '13px', marginBottom: '3px', fontWeight: '500' }}>
                                    E-mail do Responsável {menorIdadeAtual ? '*' : '(Opcional para maiores de 18)'}
                                </label>
                                <input 
                                    type="email" 
                                    name="email_responsavel" 
                                    placeholder="responsavel@email.com" 
                                    value={formData.email_responsavel} 
                                    onChange={handleChange} 
                                    required={menorIdadeAtual} 
                                    style={{ width: '100%', padding: '7px 10px', borderRadius: '4px', border: '1px solid #ccc' }} 
                                />
                            </div>

                            {/* Campos para Credenciais de Acesso do Estudante (Disponíveis tanto no Cadastro quanto na Edição) */}
                            <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '6px', marginBottom: '10px', border: '1px dashed #ccc' }}>
                                <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#555', marginBottom: '8px' }}>Credenciais de Acesso do Estudante (Opcional)</p>
                                
                                <div style={{ marginBottom: '8px' }}>
                                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '2px', fontWeight: '500' }}>E-mail de Login do Estudante</label>
                                    <input 
                                        type="email" 
                                        name="email_estudante" 
                                        placeholder="estudante@email.com" 
                                        value={formData.email_estudante} 
                                        onChange={handleChange} 
                                        style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '13px' }} 
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '2px', fontWeight: '500' }}>Senha Inicial {alunoEmEdicao ? '(Deixe em branco para manter)' : ''}</label>
                                    <input 
                                        type="password" 
                                        name="senha_estudante" 
                                        placeholder="Mínimo 6 caracteres" 
                                        value={formData.senha_estudante} 
                                        onChange={handleChange} 
                                        style={{ width: '100%', padding: '6px 8px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '13px' }} 
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '10px' }}>
                                <label style={{ display: 'block', fontSize: '13px', marginBottom: '3px', fontWeight: '500' }}>Endereço de Embarque *</label>
                                <input type="text" name="endereco_embarque" placeholder="Rua / Ponto" value={formData.endereco_embarque} onChange={handleChange} required style={{ width: '100%', padding: '7px 10px', borderRadius: '4px', border: '1px solid #ccc' }} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px', marginBottom: '10px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', marginBottom: '3px', fontWeight: '500' }}>Número *</label>
                                    <input type="text" name="numero" value={formData.numero} onChange={handleChange} required style={{ width: '100%', padding: '7px 10px', borderRadius: '4px', border: '1px solid #ccc' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', marginBottom: '3px', fontWeight: '500' }}>Bairro *</label>
                                    <input type="text" name="bairro" value={formData.bairro} onChange={handleChange} required style={{ width: '100%', padding: '7px 10px', borderRadius: '4px', border: '1px solid #ccc' }} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', marginBottom: '3px', fontWeight: '500' }}>CEP *</label>
                                    <input type="text" name="cep" placeholder="00000-000" value={formData.cep} onChange={handleChange} required style={{ width: '100%', padding: '7px 10px', borderRadius: '4px', border: '1px solid #ccc' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', marginBottom: '3px', fontWeight: '500' }}>ID da Rota *</label>
                                    <input type="number" name="rota_id" value={formData.rota_id} onChange={handleChange} required style={{ width: '100%', padding: '7px 10px', borderRadius: '4px', border: '1px solid #ccc' }} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px', marginBottom: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', marginBottom: '3px', fontWeight: '500' }}>Cidade *</label>
                                    <input type="text" name="cidade" value={formData.cidade} onChange={handleChange} required style={{ width: '100%', padding: '7px 10px', borderRadius: '4px', border: '1px solid #ccc' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', marginBottom: '3px', fontWeight: '500' }}>Estado *</label>
                                    <input type="text" name="estado" maxLength="2" value={formData.estado} onChange={handleChange} required style={{ width: '100%', padding: '7px 10px', borderRadius: '4px', border: '1px solid #ccc' }} />
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button type="button" onClick={fecharModal} style={{ padding: '8px 16px', background: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                    Cancelar
                                </button>
                                <button type="submit" disabled={salvando} style={{ padding: '8px 16px', background: '#0d6efd', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                                    {salvando ? 'Salvando...' : 'Salvar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        {}
        {modalVisualizarAberto && alunoVisualizando && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                <div style={{ background: '#fff', padding: '25px 30px', borderRadius: '8px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto' }}>
                    <h2 style={{ marginBottom: '15px', color: '#0B192C', fontSize: '20px' }}>Detalhes do Estudante</h2>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', color: '#333', marginBottom: '20px' }}>
                        <p><strong>Nome:</strong> {alunoVisualizando.nome}</p>
                        <p><strong>E-mail de Acesso (Login):</strong> {alunoVisualizando.email_estudante || 'Não cadastrado'}</p>
                        <p><strong>Data de Nascimento:</strong> {alunoVisualizando.data_nascimento ? alunoVisualizando.data_nascimento.slice(0, 10) : 'Não informada'}</p>
                        <p><strong>Série:</strong> {alunoVisualizando.serie || 'Não informada'}</p>
                        <p><strong>E-mail do Responsável:</strong> {alunoVisualizando.email_responsavel || alunoVisualizando.responsavel_email || 'Não informado'}</p>
                        <p><strong>Endereço de Embarque:</strong> {alunoVisualizando.endereco_embarque}, nº {alunoVisualizando.numero}</p>
                        <p><strong>Bairro:</strong> {alunoVisualizando.bairro}</p>
                        <p><strong>Cidade/Estado:</strong> {alunoVisualizando.cidade} - {alunoVisualizando.estado}</p>
                        <p><strong>CEP:</strong> {alunoVisualizando.cep}</p>
                        <p><strong>ID da Rota:</strong> {alunoVisualizando.rota_id}</p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button onClick={fecharModalVisualizar} style={{ padding: '8px 16px', background: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                            Fechar
                        </button>
                    </div>
                </div>
            </div>
        )}
        </div>
    );
}
