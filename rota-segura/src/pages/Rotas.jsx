import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
    veiculoId: '',
    motoristaId: '',
    paradas: [paradaVazia()]
});

const motoristaVazio = () => ({ nome: '', email: '', senha: '', telefone: '' });

const mensagemErro = (error, padrao) => error.response?.data?.erro || padrao;

const normalizarRota = (rota) => ({
    id: rota.id,
    nome: rota.nome,
    turno: rota.turno || 'MANHA',
    van: [rota.veiculo_modelo, rota.veiculo_placa].filter(Boolean).join(' · ') || 'Veículo não alocado',
    veiculoId: rota.veiculo_id ? String(rota.veiculo_id) : '',
    motoristaId: rota.motorista_id ? String(rota.motorista_id) : '',
    motorista: rota.motorista_nome || 'Motorista não definido',
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
    const [veiculos, setVeiculos] = useState([]);
    const [motoristas, setMotoristas] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [salvando, setSalvando] = useState(false);
    const [cadastrandoMotorista, setCadastrandoMotorista] = useState(false);
    const [cadastroMotoristaAberto, setCadastroMotoristaAberto] = useState(false);
    const [motoristaForm, setMotoristaForm] = useState(motoristaVazio);
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

                if (podeGerenciar) {
                    const [respostaVeiculos, respostaMotoristas] = await Promise.all([
                        api.get('/api/veiculos'),
                        api.get('/api/motoristas')
                    ]);
                    if (!ativo) return;
                    if (!Array.isArray(respostaVeiculos.data) || !Array.isArray(respostaMotoristas.data)) {
                        throw new Error('A API retornou um formato inválido para veículos ou motoristas.');
                    }
                    setVeiculos(respostaVeiculos.data);
                    setMotoristas(respostaMotoristas.data);
                }
            } catch (error) {
                console.error('Não foi possível carregar os dados das rotas:', error);
                if (ativo) setErro(mensagemErro(error, 'Não foi possível carregar as rotas. Tente novamente.'));
            } finally {
                if (ativo) setCarregando(false);
            }
        };

        carregarDados();
        return () => { ativo = false; };
    }, [podeGerenciar]);

    const rotasVisiveis = useMemo(() => {
        const termo = busca.trim().toLocaleLowerCase('pt-BR');
        return rotas.filter((rota) => {
            if (!podeGerenciar && !rota.ativa) return false;
            if (filtro === 'ativas' && !rota.ativa) return false;
            if (filtro === 'inativas' && rota.ativa) return false;
            if (!termo) return true;

            const conteudo = [
                rota.nome,
                rota.van,
                rota.motorista,
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
            veiculoId: rota.veiculoId,
            motoristaId: rota.motoristaId,
            paradas: rota.paradas.length
                ? rota.paradas.map((parada) => ({ ...parada }))
                : [paradaVazia()]
        } : formularioVazio());
        setCadastroMotoristaAberto(false);
        setMotoristaForm(motoristaVazio());
        setModalAberto(true);
    };

    const fecharCadastro = () => {
        setModalAberto(false);
        setRotaEmEdicao(null);
        setCadastroMotoristaAberto(false);
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
            veiculo_id: Number(formulario.veiculoId),
            motorista_id: Number(formulario.motoristaId),
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

    const cadastrarMotorista = async () => {
        if (!podeGerenciar || cadastrandoMotorista) return;
        setCadastrandoMotorista(true);
        setErro('');
        try {
            const resposta = await api.post('/api/motoristas', {
                nome: motoristaForm.nome.trim(),
                email: motoristaForm.email.trim(),
                senha: motoristaForm.senha,
                telefone: motoristaForm.telefone.trim()
            });
            const novoMotorista = resposta.data.motorista;
            setMotoristas((atuais) => [...atuais, novoMotorista]);
            setFormulario((atual) => ({ ...atual, motoristaId: String(novoMotorista.id) }));
            setMotoristaForm(motoristaVazio());
            setCadastroMotoristaAberto(false);
        } catch (error) {
            console.error('Não foi possível cadastrar o motorista:', error);
            setErro(mensagemErro(error, 'Não foi possível cadastrar o motorista. Verifique os dados.'));
        } finally {
            setCadastrandoMotorista(false);
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

    const sair = () => {
        localStorage.removeItem('@RotaSegura:token');
        localStorage.removeItem('@RotaSegura:userName');
        localStorage.removeItem('@RotaSegura:userRole');
        navigate('/', { replace: true });
    };

    const iniciais = userName.trim().split(/\s+/).slice(0, 2).map((parte) => parte[0]).join('').toUpperCase();

    return (
        <div className="dashboard-container">
            <aside className="dashboard-sidebar">
                <div className="sidebar-logo"><h2>RotaSegura</h2></div>
                <nav className="sidebar-nav">
                    <Link to="/dashboard" className="nav-item"><span className="nav-icon">🏠</span> Início</Link>
                    <Link to="/rotas" className="nav-item active"><span className="nav-icon">🚌</span> Rotas</Link>
                    {userRole !== 'estudante' && (
                        <Link to="/estudantes" className="nav-item"><span className="nav-icon">👤</span> Estudantes</Link>
                    )}
                    <Link to="/historico" className="nav-item"><span className="nav-icon">📋</span> Histórico</Link>
                    <Link to="/suporte" className="nav-item"><span className="nav-icon">💬</span> Suporte</Link>
                    <button onClick={sair} className="nav-item btn-logout rotas-logout">
                        <span className="nav-icon">🚪</span> Sair
                    </button>
                </nav>
            </aside>

            <main className="dashboard-main rotas-main">
                <header className="dashboard-header rotas-header">
                    <div className="welcome-text">
                        <h1>Rotas escolares</h1>
                        <p>Consulte itinerários, veículos, motoristas e horários.</p>
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
                        <div><strong>{rotas.filter((rota) => rota.ativa).length}</strong><span>Rotas ativas</span></div>
                    </div>
                    <div className="rotas-summary-card">
                        <span className="rotas-summary-icon">📍</span>
                        <div><strong>{rotas.filter((rota) => rota.ativa).reduce((total, rota) => total + rota.paradas.length, 0)}</strong><span>Pontos de parada</span></div>
                    </div>
                    <div className="rotas-summary-card">
                        <span className="rotas-summary-icon">👨‍✈️</span>
                        <div><strong>{new Set(rotas.filter((rota) => rota.ativa).map((rota) => rota.motorista)).size}</strong><span>Motoristas alocados</span></div>
                    </div>
                </section>

                <section className="rotas-toolbar" aria-label="Filtros de rotas">
                    <div className="rotas-search">
                        <span aria-hidden="true">⌕</span>
                        <input
                            type="search"
                            value={busca}
                            onChange={(event) => setBusca(event.target.value)}
                            placeholder="Buscar rota, motorista, van ou parada..."
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
                                            <p>{rota.van}</p>
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

                                <div className="rota-driver">
                                    <span aria-hidden="true">👨‍✈️</span>
                                    <div><span>Motorista responsável</span><strong>{rota.motorista}</strong></div>
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
                                <label>
                                    Veiculo alocada
                                    <select
                                        required
                                        value={formulario.veiculoId}
                                        onChange={(event) => setFormulario((atual) => ({ ...atual, veiculoId: event.target.value }))}
                                    >
                                        <option value="">Selecione um veículo</option>
                                        {veiculos.filter((veiculo) => veiculo.status === 'ATIVO').map((veiculo) => (
                                            <option key={veiculo.id} value={veiculo.id}>
                                                {veiculo.modelo} · {veiculo.placa}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label className="rotas-driver-field">
                                    Motorista responsável
                                    <select
                                        required
                                        value={formulario.motoristaId}
                                        onChange={(event) => setFormulario((atual) => ({ ...atual, motoristaId: event.target.value }))}
                                    >
                                        <option value="">Selecione um motorista</option>
                                        {motoristas.map((motorista) => (
                                            <option key={motorista.id} value={motorista.id}>{motorista.nome}</option>
                                        ))}
                                    </select>
                                </label>
                            </div>

                            <div className="rotas-driver-register">
                                <button
                                    type="button"
                                    className="rota-add-stop"
                                    onClick={() => {
                                        setCadastroMotoristaAberto((aberto) => !aberto);
                                        setMotoristaForm(motoristaVazio());
                                    }}
                                >
                                    {cadastroMotoristaAberto ? 'Cancelar cadastro de motorista' : '＋ Cadastrar novo motorista'}
                                </button>
                                {cadastroMotoristaAberto && (
                                    <div className="rotas-driver-register-fields">
                                        <label>
                                            Nome completo do motorista
                                            <input
                                                required
                                                maxLength="100"
                                                value={motoristaForm.nome}
                                                onChange={(event) => setMotoristaForm((atual) => ({ ...atual, nome: event.target.value }))}
                                                placeholder="Nome completo"
                                            />
                                        </label>
                                        <label>
                                            E-mail de acesso
                                            <input
                                                required
                                                type="email"
                                                maxLength="150"
                                                value={motoristaForm.email}
                                                onChange={(event) => setMotoristaForm((atual) => ({ ...atual, email: event.target.value }))}
                                                placeholder="motorista@email.com"
                                            />
                                        </label>
                                        <label>
                                            Senha inicial
                                            <input
                                                required
                                                type="password"
                                                minLength="8"
                                                value={motoristaForm.senha}
                                                onChange={(event) => setMotoristaForm((atual) => ({ ...atual, senha: event.target.value }))}
                                                placeholder="Mínimo de 8 caracteres"
                                            />
                                        </label>
                                        <label>
                                            Telefone
                                            <input
                                                type="tel"
                                                maxLength="30"
                                                value={motoristaForm.telefone}
                                                onChange={(event) => setMotoristaForm((atual) => ({ ...atual, telefone: event.target.value }))}
                                                placeholder="(00) 00000-0000"
                                            />
                                        </label>
                                        <button
                                            type="button"
                                            className="rotas-driver-submit"
                                            disabled={cadastrandoMotorista || !motoristaForm.nome.trim() || !motoristaForm.email.trim() || motoristaForm.senha.length < 8}
                                            onClick={cadastrarMotorista}
                                        >
                                            {cadastrandoMotorista ? 'Cadastrando...' : 'Cadastrar e selecionar motorista'}
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="rotas-stops-header">
                                <div><h3>Pontos e horários</h3><p>Informe o endereço e os horários previstos em cada parada.</p></div>
                                <button
                                    type="button"
                                    className="rota-add-stop"
                                    onClick={() => setFormulario((atual) => ({ ...atual, paradas: [...atual.paradas, paradaVazia()] }))}
                                >＋ Adicionar parada</button>
                            </div>
                            <div className="rotas-stop-fields">
                                {formulario.paradas.map((parada, index) => (
                                    <fieldset key={parada.id}>
                                        <legend>Parada {index + 1}</legend>
                                        <label className="rotas-stop-address">
                                            Endereço ou ponto de referência
                                            <input
                                                required
                                                maxLength="150"
                                                value={parada.local}
                                                onChange={(event) => atualizarParada(parada.id, 'local', event.target.value)}
                                                placeholder="Rua, número, bairro ou escola"
                                            />
                                        </label>
                                        <label>
                                            Embarque
                                            <input
                                                required
                                                type="time"
                                                value={parada.embarque}
                                                onChange={(event) => atualizarParada(parada.id, 'embarque', event.target.value)}
                                            />
                                        </label>
                                        <label>
                                            Desembarque
                                            <input
                                                required
                                                type="time"
                                                value={parada.desembarque}
                                                onChange={(event) => atualizarParada(parada.id, 'desembarque', event.target.value)}
                                            />
                                        </label>
                                        {formulario.paradas.length > 1 && (
                                            <button
                                                type="button"
                                                className="rota-remove-stop"
                                                onClick={() => setFormulario((atual) => ({
                                                    ...atual,
                                                    paradas: atual.paradas.filter((item) => item.id !== parada.id)
                                                }))}
                                                aria-label={`Remover parada ${index + 1}`}
                                            >×</button>
                                        )}
                                    </fieldset>
                                ))}
                            </div>
                            <footer className="rotas-modal-footer">
                                <button type="button" className="rota-cancel-button" onClick={fecharCadastro}>Cancelar</button>
                                <button type="submit" className="rotas-primary-button" disabled={salvando}>
                                    {salvando ? 'Salvando...' : rotaEmEdicao ? 'Salvar alterações' : 'Cadastrar rota'}
                                </button>
                            </footer>
                        </form>
                    </section>
                </div>
            )}
        </div>
    );
}
