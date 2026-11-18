import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../pages/Sidebar';
import api from '../services/api';
import './Dashboard.css';
import './Rotas.css';

const paradaVazia = () => ({
    id: `${Date.now()}-${Math.random()}`,
    local: '',
    embarque: '',
    desembarque: ''
});

const formularioVazio = () => ({
    nome: '',
    turno: 'MANHA',
    paradas: [paradaVazia()]
});

const mensagemErro = (error, padrao) => error.response?.data?.erro || padrao;

const normalizarRota = (rota) => ({
    id: rota.id,
    nome: rota.nome,
    turno: rota.turno || 'MANHA',
    ativa: rota.ativa !== false,
    paradas: (rota.paradas || []).map((parada) => ({
        id: parada.id,
        local: parada.endereco,
        embarque: parada.horario_embarque?.slice(0, 5) || '',
        desembarque: parada.horario_desembarque?.slice(0, 5) || ''
    }))
});

export default function Rotas() {
    const navigate = useNavigate();
    const userRole = localStorage.getItem('@RotaSegura:userRole') || 'responsavel';
    const userName = localStorage.getItem('@RotaSegura:userName') || 'Usuário';
    const podeGerenciar = ['administrador', 'admin', 'gestor'].includes(userRole.toLowerCase());
    
    const [rotas, setRotas] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [salvando, setSalvando] = useState(false);
    
    const [erro, setErro] = useState('');
    const [busca, setBusca] = useState('');
    const [filtro, setFiltro] = useState('ativas');
    const [modalAberto, setModalAberto] = useState(false);
    const [rotaEmEdicao, setRotaEmEdicao] = useState(null);
    const [formulario, setFormulario] = useState(formularioVazio);

    useEffect(() => {
        let ativo = true;

        const carregarDados = async () => {
            setCarregando(true);
            setErro('');
            try {
                const respostaRotas = await api.get('/api/rotas');
                if (!ativo) return;
                if (!Array.isArray(respostaRotas.data)) {
                    throw new Error('A API retornou um formato inválido para as rotas.');
                }
                setRotas(respostaRotas.data.map(normalizarRota));
            } catch (error) {
                console.error('Não foi possível carregar os dados das rotas:', error);
                if (ativo) setErro(mensagemErro(error, 'Não foi possível carregar as rotas. Tente novamente.'));
            } finally {
                if (ativo) setCarregando(false);
            }
        };

        carregarDados();
        return () => { ativo = false; };
    }, []);

    const rotasVisiveis = useMemo(() => {
        const termo = busca.trim().toLocaleLowerCase('pt-BR');
        return rotas.filter((rota) => {
            if (!podeGerenciar && !rota.ativa) return false;
            if (filtro === 'ativas' && !rota.ativa) return false;
            if (filtro === 'inativas' && rota.ativa) return false;
            if (!termo) return true;

            const conteudo = [
                rota.nome,
                ...rota.paradas.map((parada) => parada.local)
            ].join(' ').toLocaleLowerCase('pt-BR');
            return conteudo.includes(termo);
        });
    }, [busca, filtro, podeGerenciar, rotas]);

    const abrirCadastro = (rota = null) => {
        if (!podeGerenciar) return;
        setErro('');
        setRotaEmEdicao(rota);
        setFormulario(rota ? {
            nome: rota.nome,
            turno: rota.turno || 'MANHA',
            paradas: rota.paradas.length
                ? rota.paradas.map((parada) => ({ ...parada }))
                : [paradaVazia()]
        } : formularioVazio());
        setModalAberto(true);
    };

    const fecharCadastro = () => {
        setModalAberto(false);
        setRotaEmEdicao(null);
    };

    const adicionarParada = () => {
        setFormulario((atual) => ({
            ...atual,
            paradas: [...atual.paradas, paradaVazia()]
        }));
    };

    const removerParada = (id) => {
        setFormulario((atual) => ({
            ...atual,
            paradas: atual.paradas.length > 1 ? atual.paradas.filter((p) => p.id !== id) : atual.paradas
        }));
    };

    const atualizarParada = (id, campo, valor) => {
        setFormulario((atual) => ({
            ...atual,
            paradas: atual.paradas.map((parada) => (
                parada.id === id ? { ...parada, [campo]: valor } : parada
            ))
        }));
    };

    const salvarCadastro = async (event) => {
        event.preventDefault();
        if (!podeGerenciar || salvando) return;

        setSalvando(true);
        setErro('');
        const dadosRota = {
            nome: formulario.nome.trim(),
            turno: formulario.turno,
            ativa: rotaEmEdicao?.ativa ?? true,
            paradas: formulario.paradas.map((parada) => ({
                endereco: parada.local.trim(),
                horario_embarque: parada.embarque,
                horario_desembarque: parada.desembarque
            }))
        };

        try {
            const resposta = rotaEmEdicao
                ? await api.put(`/api/rotas/${rotaEmEdicao.id}`, dadosRota)
                : await api.post('/api/rotas', dadosRota);
            const rotaSalva = normalizarRota(resposta.data);
            setRotas((atuais) => (
                rotaEmEdicao
                    ? atuais.map((rota) => rota.id === rotaSalva.id ? rotaSalva : rota)
                    : [...atuais, rotaSalva]
            ));
            fecharCadastro();
        } catch (error) {
            console.error('Não foi possível salvar a rota:', error);
            setErro(mensagemErro(error, 'Não foi possível salvar a rota. Tente novamente.'));
        } finally {
            setSalvando(false);
        }
    };

    const alternarStatus = async (rota) => {
        if (!podeGerenciar) return;
        setErro('');
        try {
            const resposta = await api.patch(`/api/rotas/${rota.id}/status`, { ativa: !rota.ativa });
            const atualizada = normalizarRota(resposta.data);
            setRotas((atuais) => atuais.map((item) => item.id === atualizada.id ? atualizada : item));
        } catch (error) {
            console.error('Não foi possível atualizar o status da rota:', error);
            setErro(mensagemErro(error, 'Não foi possível atualizar o status da rota.'));
        }
    };

    const iniciais = userName.trim().split(/\s+/).slice(0, 2).map((parte) => parte[0]).join('').toUpperCase();

    return (
        <div className="dashboard-container">
            <Sidebar />

            <main className="dashboard-main rotas-main">
                <header className="dashboard-header rotas-header">
                    <div className="welcome-text">
                        <h1>Rotas escolares</h1>
                        <p>Consulte itinerários e horários.</p>
                    </div>
                    <div className="header-user-actions">
                        <span className="rotas-role">{userRole}</span>
                        <div className="user-avatar-initials" aria-label={`Usuário ${userName}`}>{iniciais || 'US'}</div>
                    </div>
                </header>

                {erro && <div className="rotas-alert" role="alert">{erro}</div>}

                <section className="rotas-summary" aria-label="Resumo das rotas">
                    <div className="rotas-summary-card">
                        <span className="rotas-summary-icon">🚌</span>
                        <div><strong>{rotasVisiveis.filter((rota) => rota.ativa).length}</strong><span>Rotas ativas</span></div>
                    </div>
                    <div className="rotas-summary-card">
                        <span className="rotas-summary-icon">📍</span>
                        <div><strong>{rotasVisiveis.filter((rota) => rota.ativa).reduce((total, rota) => total + rota.paradas.length, 0)}</strong><span>Pontos de parada</span></div>
                    </div>
                </section>

                <section className="rotas-toolbar" aria-label="Filtros de rotas">
                    <div className="rotas-search">
                        <span aria-hidden="true">⌕</span>
                        <input
                            type="search"
                            value={busca}
                            onChange={(event) => setBusca(event.target.value)}
                            placeholder="Buscar rota ou parada..."
                            aria-label="Buscar rotas"
                        />
                    </div>
                    <div className="rotas-toolbar-actions">
                        {podeGerenciar && (
                            <select value={filtro} onChange={(event) => setFiltro(event.target.value)} aria-label="Filtrar por status">
                                <option value="ativas">Rotas ativas</option>
                                <option value="inativas">Rotas inativas</option>
                                <option value="todas">Todas as rotas</option>
                            </select>
                        )}
                        {podeGerenciar && (
                            <button className="rotas-primary-button" onClick={() => abrirCadastro()}>
                                <span aria-hidden="true">＋</span> Nova rota
                            </button>
                        )}
                    </div>
                </section>

                {carregando ? (
                    <div className="rotas-empty"><span aria-hidden="true">⏳</span><h2>Carregando rotas...</h2></div>
                ) : rotasVisiveis.length === 0 ? (
                    <div className="rotas-empty">
                        <span aria-hidden="true">🧭</span>
                        <h2>Nenhuma rota encontrada</h2>
                        <p>{busca ? 'Tente ajustar sua busca ou os filtros.' : 'As rotas cadastradas aparecerão aqui.'}</p>
                    </div>
                ) : (
                    <section className="rotas-list" aria-label="Itinerários">
                        {rotasVisiveis.map((rota) => (
                            <article className={`rota-card${rota.ativa ? '' : ' rota-card-inativa'}`} key={rota.id}>
                                <div className="rota-card-header">
                                    <div className="rota-heading">
                                        <span className="rota-bus-icon" aria-hidden="true">🚌</span>
                                        <div>
                                            <div className="rota-title-line">
                                                <h2>{rota.nome}</h2>
                                                <span className={`rota-status ${rota.ativa ? 'status-ativa' : 'status-inativa'}`}>
                                                    {rota.ativa ? 'Ativa' : 'Inativa'}
                                                </span>
                                            </div>
                                            <p>Turno: {rota.turno}</p>
                                        </div>
                                    </div>
                                    {podeGerenciar && (
                                        <div className="rota-actions">
                                            <button className="rota-edit-button" onClick={() => abrirCadastro(rota)}>Editar</button>
                                            <button
                                                className={`rota-status-button ${rota.ativa ? 'status-button-disable' : 'status-button-enable'}`}
                                                onClick={() => alternarStatus(rota)}
                                            >
                                                {rota.ativa ? 'Inativar' : 'Reativar'}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="rota-itinerary">
                                    <div className="rota-itinerary-title">
                                        <h3>Itinerário completo</h3>
                                        <span>{rota.paradas.length} {rota.paradas.length === 1 ? 'parada' : 'paradas'}</span>
                                    </div>
                                    <ol>
                                        {rota.paradas.map((parada, index) => (
                                            <li key={parada.id}>
                                                <span className={`rota-stop-marker${index === rota.paradas.length - 1 ? ' rota-stop-final' : ''}`}>
                                                    {index === rota.paradas.length - 1 ? '🏫' : index + 1}
                                                </span>
                                                <div className="rota-stop-location">
                                                    <strong>{parada.local}</strong>
                                                    <span>{index === rota.paradas.length - 1 ? 'Destino' : 'Ponto de embarque'}</span>
                                                </div>
                                                <div className="rota-stop-times">
                                                    <span><small>Embarque</small><strong>{parada.embarque || '—'}</strong></span>
                                                    <span><small>Desembarque</small><strong>{parada.desembarque || '—'}</strong></span>
                                                </div>
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            </article>
                        ))}
                    </section>
                )}
            </main>

            {modalAberto && (
                <div className="rotas-modal-backdrop" onMouseDown={(event) => {
                    if (event.target === event.currentTarget) fecharCadastro();
                }}>
                    <section className="rotas-modal" role="dialog" aria-modal="true" aria-labelledby="rota-modal-title">
                        <header className="rotas-modal-header">
                            <div>
                                <span>GERENCIAMENTO DE ROTAS</span>
                                <h2 id="rota-modal-title">{rotaEmEdicao ? 'Editar rota' : 'Cadastrar nova rota'}</h2>
                            </div>
                            <button type="button" className="rotas-modal-close" onClick={fecharCadastro} aria-label="Fechar">×</button>
                        </header>
                        <form onSubmit={salvarCadastro}>
                            {erro && <div className="rotas-alert" role="alert">{erro}</div>}
                            <div className="rotas-form-grid">
                                <label>
                                    Nome da rota
                                    <input
                                        required
                                        maxLength="60"
                                        value={formulario.nome}
                                        onChange={(event) => setFormulario((atual) => ({ ...atual, nome: event.target.value }))}
                                        placeholder="Ex.: Rota Centro"
                                    />
                                </label>
                                <label>
                                    Turno
                                    <select
                                        required
                                        value={formulario.turno}
                                        onChange={(event) => setFormulario((atual) => ({ ...atual, turno: event.target.value }))}
                                    >
                                        <option value="MANHA">Manhã</option>
                                        <option value="TARDE">Tarde</option>
                                        <option value="NOITE">Noite</option>
                                    </select>
                                </label>

                                <div className="rotas-stops-section" style={{ gridColumn: '1 / -1' }}>
                                    <div className="rotas-stops-header">
                                        <h3>Paradas e itinerário</h3>
                                        <button type="button" className="rota-add-stop" onClick={adicionarParada}>＋ Adicionar parada</button>
                                    </div>
                                    {formulario.paradas.map((parada, index) => (
                                        <div key={parada.id} className="rotas-stop-row">
                                            <span className="rotas-stop-index">{index + 1}</span>
                                            <input
                                                required
                                                placeholder="Endereço ou referência da parada"
                                                value={parada.local}
                                                onChange={(e) => atualizarParada(parada.id, 'local', e.target.value)}
                                            />
                                            <input
                                                type="time"
                                                value={parada.embarque}
                                                onChange={(e) => atualizarParada(parada.id, 'embarque', e.target.value)}
                                                title="Horário de embarque"
                                            />
                                            <input
                                                type="time"
                                                value={parada.desembarque}
                                                onChange={(e) => atualizarParada(parada.id, 'desembarque', e.target.value)}
                                                title="Horário de desembarque"
                                            />
                                            {formulario.paradas.length > 1 && (
                                                <button
                                                    type="button"
                                                    className="rotas-stop-remove"
                                                    onClick={() => removerParada(parada.id)}
                                                    title="Remover parada"
                                                >
                                                    ×
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <footer className="rotas-modal-footer">
                                <button type="button" className="rotas-secondary-button" onClick={fecharCadastro}>Cancelar</button>
                                <button type="submit" className="rotas-primary-button" disabled={salvando}>
                                    {salvando ? 'Salvando...' : (rotaEmEdicao ? 'Salvar alterações' : 'Cadastrar rota')}
                                </button>
                            </footer>
                        </form>
                    </section>
                </div>
            )}
        </div>
    );
}