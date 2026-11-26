import React, { useState, useEffect } from 'react';
import Sidebar from '../pages/Sidebar';
import api from '../services/api';
import './Dashboard.css';

const FAQ_TOPICOS = [
    {
        topico: 'Rotas e Embarque',
        itens: [
            {
                pergunta: 'Como posso acompanhar a rota e a van em tempo real?',
                resposta: 'No menu "Acompanhamento" (ou no painel "Início"), visualize as rotas ativas, o status da viagem e o veículo designado.'
            },
            {
                pergunta: 'Como alterar o endereço ou ponto de embarque do estudante?',
                resposta: 'Acesse o menu "Estudantes" para atualizar o endereço do aluno ou abra um chamado na categoria "Rotas" para a administração validar a alteração.'
            }
        ]
    },
    {
        topico: 'Atrasos e Ausências',
        itens: [
            {
                pergunta: 'O que fazer em caso de atraso no embarque ou no trajeto?',
                resposta: 'Verifique o status da viagem em "Acompanhamento" ou envie um chamado na categoria "Atrasos" informando rota e horário para a equipe administrativa.'
            },
            {
                pergunta: 'Como avisar quando o aluno não vai utilizar o transporte no dia?',
                resposta: 'Envie uma mensagem pela aba de suporte com antecedência informando o nome do aluno, a data e o turno para que a rota seja ajustada.'
            }
        ]
    },
    {
        topico: 'Pagamentos e Cadastros',
        itens: [
            {
                pergunta: 'Onde tiro dúvidas sobre mensalidades, cobranças ou recibos?',
                resposta: 'Selecione a categoria "Pagamentos" no formulário ao lado e descreva o assunto e o período referente para atendimento da equipe administrativa.'
            },
            {
                pergunta: 'Como atualizar meus dados de perfil ou veículo?',
                resposta: 'Use as opções "Perfil" e "Veículos" no menu lateral para manter seus dados pessoais, CNH e informações do veículo sempre atualizados.'
            }
        ]
    }
];

const STATUS_BADGES = {
    ABERTO: { label: 'Aberto', bg: '#fef3c7', color: '#92400e' },
    EM_ATENDIMENTO: { label: 'Em atendimento', bg: '#dbeafe', color: '#1e40af' },
    RESOLVIDO: { label: 'Resolvido', bg: '#d1e7dd', color: '#0f5132' }
};

const STORAGE_KEY_CHAMADOS = '@RotaSegura:chamadosSuporte';

export default function Suporte() {
    const fullName = localStorage.getItem('@RotaSegura:userName') || 'Usuário';
    const [assunto, setAssunto] = useState('');
    const [categoria, setCategoria] = useState('rotas');
    const [mensagem, setMensagem] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [sucesso, setSucesso] = useState('');
    const [erro, setErro] = useState('');

    const [topicoAtivo, setTopicoAtivo] = useState(FAQ_TOPICOS[0].topico);
    const [chamados, setChamados] = useState([]);
    const [carregandoChamados, setCarregandoChamados] = useState(true);

    useEffect(() => {
        carregarChamados();
    }, []);

    const lerChamadosLocais = () => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY_CHAMADOS);
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    };

    const salvarChamadosLocais = (lista) => {
        try {
            localStorage.setItem(STORAGE_KEY_CHAMADOS, JSON.stringify(lista));
        } catch (e) {
            console.warn('Não foi possível salvar chamados localmente:', e);
        }
    };

    const carregarChamados = async () => {
        setCarregandoChamados(true);
        const locais = lerChamadosLocais();

        try {
            const res = await api.get('/api/suporte/chamados');
            const listaApi = Array.isArray(res.data) ? res.data : res.data?.chamados || [];
            setChamados(listaApi.length > 0 ? listaApi : locais);
        } catch {
            setChamados(locais);
        } finally {
            setCarregandoChamados(false);
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

    const formatarData = (isoString) => {
        if (!isoString) return 'Agora';
        const data = new Date(isoString);
        if (Number.isNaN(data.getTime())) return isoString;
        return data.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErro('');
        setSucesso('');

        if (!assunto.trim() || !mensagem.trim()) {
            setErro('Por favor, preencha o assunto e a mensagem detalhada.');
            return;
        }

        const novoChamadoLocal = {
            id: `CH-${Date.now().toString().slice(-6)}`,
            assunto: assunto.trim(),
            categoria,
            mensagem: mensagem.trim(),
            status: 'ABERTO',
            criado_em: new Date().toISOString()
        };

        try {
            setEnviando(true);
            const res = await api.post('/api/suporte/chamados', {
                assunto: novoChamadoLocal.assunto,
                categoria: novoChamadoLocal.categoria,
                mensagem: novoChamadoLocal.mensagem
            });

            const criado = res.data?.chamado || res.data || novoChamadoLocal;
            const registroFinal = {
                ...novoChamadoLocal,
                ...criado,
                id: criado.id || novoChamadoLocal.id,
                status: criado.status || 'ABERTO',
                criado_em: criado.criado_em || novoChamadoLocal.criado_em
            };

            const atualizados = [registroFinal, ...chamados];
            setChamados(atualizados);
            salvarChamadosLocais(atualizados);

            setSucesso(
                `Confirmação de recebimento: seu chamado #${registroFinal.id} foi registrado com sucesso e encaminhado à equipe administrativa.`
            );
            setAssunto('');
            setMensagem('');
        } catch (err) {
            const semRespostaServidor = !err?.response;
            const statusHttp = err?.response?.status;

            if (semRespostaServidor || statusHttp === 404 || statusHttp === 501) {
                const atualizados = [novoChamadoLocal, ...chamados];
                setChamados(atualizados);
                salvarChamadosLocais(atualizados);

                setSucesso(
                    `Confirmação de recebimento: chamado #${novoChamadoLocal.id} registrado localmente (servidor de suporte indisponível no momento).`
                );
                setAssunto('');
                setMensagem('');
            } else {
                setErro(
                    err?.response?.data?.erro ||
                    'Falha ao enviar o chamado. Verifique sua conexão e tente novamente.'
                );
            }
        } finally {
            setEnviando(false);
        }
    };

    const estiloInput = {
        width: '100%',
        padding: '10px 12px',
        borderRadius: '8px',
        border: '1px solid #d1d5db',
        backgroundColor: '#ffffff',
        color: '#111827',
        WebkitTextFillColor: '#111827',
        fontSize: '14px',
        boxSizing: 'border-box'
    };

    const topicoSelecionadoObj =
        FAQ_TOPICOS.find((t) => t.topico === topicoAtivo) || FAQ_TOPICOS[0];

    return (
        <div className="dashboard-container">
            <Sidebar />

            <main className="dashboard-main">
                <header className="dashboard-header">
                    <div className="welcome-text">
                        <h1>Central de Ajuda e Suporte</h1>
                        <p>Consulte dúvidas frequentes, abra chamados e acompanhe o atendimento.</p>
                    </div>
                    <div className="header-user-actions">
                        <div className="user-avatar-initials">{getInitials(fullName)}</div>
                    </div>
                </header>

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                        gap: '20px',
                        marginTop: '20px'
                    }}
                >
                    {/* Formulário de Contato / Abertura de Chamado */}
                    <div className="card" style={{ padding: '24px' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Abrir Chamado / Enviar Mensagem</h3>

                        {sucesso && (
                            <div
                                role="status"
                                style={{
                                    backgroundColor: '#dcfce7',
                                    color: '#166534',
                                    padding: '12px 14px',
                                    borderRadius: '8px',
                                    marginBottom: '16px',
                                    fontSize: '14px',
                                    border: '1px solid #bbf7d0',
                                    fontWeight: '500'
                                }}
                            >
                                {sucesso}
                            </div>
                        )}

                        {erro && (
                            <div
                                role="alert"
                                style={{
                                    backgroundColor: '#fee2e2',
                                    color: '#991b1b',
                                    padding: '12px 14px',
                                    borderRadius: '8px',
                                    marginBottom: '16px',
                                    fontSize: '14px',
                                    border: '1px solid #fecaca',
                                    fontWeight: '500'
                                }}
                            >
                                {erro}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                                    Categoria
                                </label>
                                <select
                                    value={categoria}
                                    onChange={(e) => setCategoria(e.target.value)}
                                    style={estiloInput}
                                >
                                    <option value="rotas">Rotas e Embarque</option>
                                    <option value="atrasos">Atrasos e Ausências</option>
                                    <option value="pagamentos">Pagamentos</option>
                                    <option value="cadastro">Cadastro / Conta</option>
                                    <option value="geral">Dúvida Geral</option>
                                </select>
                            </div>

                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                                    Assunto
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ex: Alteração no ponto de embarque ou atraso na rota"
                                    value={assunto}
                                    onChange={(e) => setAssunto(e.target.value)}
                                    style={estiloInput}
                                />
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                                    Mensagem detalhada
                                </label>
                                <textarea
                                    rows="4"
                                    placeholder="Descreva detalhadamente sua dúvida, solicitação ou ocorrência..."
                                    value={mensagem}
                                    onChange={(e) => setMensagem(e.target.value)}
                                    style={{ ...estiloInput, resize: 'vertical' }}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={enviando}
                                style={{
                                    background: enviando ? '#93c5fd' : '#0d6efd',
                                    color: '#fff',
                                    border: 'none',
                                    padding: '12px 20px',
                                    borderRadius: '8px',
                                    cursor: enviando ? 'not-allowed' : 'pointer',
                                    fontWeight: 'bold',
                                    width: '100%'
                                }}
                            >
                                {enviando ? 'Enviando chamado...' : 'Enviar Mensagem'}
                            </button>
                        </form>
                    </div>

                    {/* Perguntas Frequentes (FAQ) por Tópicos */}
                    <div className="card" style={{ padding: '24px' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '14px' }}>Perguntas Frequentes (FAQ)</h3>

                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '18px' }}>
                            {FAQ_TOPICOS.map((item) => {
                                const ativo = item.topico === topicoAtivo;
                                return (
                                    <button
                                        key={item.topico}
                                        type="button"
                                        onClick={() => setTopicoAtivo(item.topico)}
                                        style={{
                                            padding: '6px 12px',
                                            borderRadius: '20px',
                                            border: ativo ? '1px solid #0d6efd' : '1px solid #d1d5db',
                                            background: ativo ? '#0d6efd' : '#f9fafb',
                                            color: ativo ? '#ffffff' : '#374151',
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {item.topico}
                                    </button>
                                );
                            })}
                        </div>

                        <div>
                            {topicoSelecionadoObj.itens.map((faq) => (
                                <div
                                    key={faq.pergunta}
                                    style={{
                                        padding: '12px 14px',
                                        borderRadius: '8px',
                                        background: '#f9fafb',
                                        border: '1px solid #e5e7eb',
                                        marginBottom: '12px'
                                    }}
                                >
                                    <strong style={{ display: 'block', color: '#111827', marginBottom: '4px', fontSize: '14px' }}>
                                        {faq.pergunta}
                                    </strong>
                                    <p style={{ fontSize: '13px', color: '#4b5563', margin: 0, lineHeight: 1.5 }}>
                                        {faq.resposta}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Meus Chamados / Status */}
                <div className="card" style={{ padding: '24px', marginTop: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <h3 style={{ margin: 0 }}>Meus Chamados</h3>
                        <button
                            type="button"
                            onClick={carregarChamados}
                            style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: '1px solid #d1d5db',
                                background: '#fff',
                                color: '#374151',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            Atualizar lista
                        </button>
                    </div>

                    {carregandoChamados ? (
                        <p style={{ color: '#6b7280', fontSize: '14px' }}>Carregando chamados...</p>
                    ) : chamados.length === 0 ? (
                        <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
                            Você ainda não abriu nenhum chamado. Use o formulário acima para falar com a administração.
                        </p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {chamados.map((ch) => {
                                const badge = STATUS_BADGES[ch.status] || STATUS_BADGES.ABERTO;
                                return (
                                    <div
                                        key={ch.id}
                                        style={{
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '8px',
                                            padding: '14px 16px',
                                            background: '#fafafa'
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                gap: '10px',
                                                flexWrap: 'wrap',
                                                marginBottom: '6px'
                                            }}
                                        >
                                            <div>
                                                <strong style={{ color: '#111827', fontSize: '14px' }}>
                                                    #{ch.id} — {ch.assunto}
                                                </strong>
                                                <span
                                                    style={{
                                                        marginLeft: '10px',
                                                        fontSize: '12px',
                                                        color: '#6b7280',
                                                        textTransform: 'capitalize'
                                                    }}
                                                >
                                                    ({ch.categoria})
                                                </span>
                                            </div>

                                            <span
                                                style={{
                                                    background: badge.bg,
                                                    color: badge.color,
                                                    padding: '3px 10px',
                                                    borderRadius: '999px',
                                                    fontSize: '11px',
                                                    fontWeight: '700'
                                                }}
                                            >
                                                {badge.label}
                                            </span>
                                        </div>

                                        <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#374151', lineHeight: 1.45 }}>
                                            {ch.mensagem}
                                        </p>

                                        <span style={{ fontSize: '12px', color: '#6b7280' }}>
                                            Enviado em: {formatarData(ch.criado_em)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}