import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../pages/Sidebar';
import api from '../services/api';
import './Dashboard.css';

function obterFotoSalva() {
    const direta = localStorage.getItem('@RotaSegura:userPhoto');
    if (direta) return direta;

    try {
        const rawUser =
            localStorage.getItem('@RotaSegura:user') ||
            sessionStorage.getItem('@RotaSegura:user');
        if (rawUser) {
            const parsed = JSON.parse(rawUser);
            const usuario = parsed?.usuario ?? parsed?.user ?? parsed;
            return usuario?.foto_url || usuario?.avatar_url || '';
        }
    } catch {
        // Ignora erro de parse
    }

    return '';
}

function sincronizarFotoNoStorage(fotoUrl, nomeCompleto) {
    if (fotoUrl) {
        localStorage.setItem('@RotaSegura:userPhoto', fotoUrl);
    } else {
        localStorage.removeItem('@RotaSegura:userPhoto');
    }

    try {
        const rawUser = localStorage.getItem('@RotaSegura:user');
        if (rawUser) {
            const parsed = JSON.parse(rawUser);
            const alvo = parsed?.usuario ?? parsed?.user ?? parsed;
            if (alvo && typeof alvo === 'object') {
                if (typeof nomeCompleto === 'string') {
                    alvo.nome = nomeCompleto;
                }
                alvo.foto_url = fotoUrl || '';
                localStorage.setItem('@RotaSegura:user', JSON.stringify(parsed));
            }
        }
    } catch {
        // Ignora erro de parse
    }
}

export default function Perfil() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [carregando, setCarregando] = useState(true);
    const [salvando, setSalvando] = useState(false);
    const [mensagem, setMensagem] = useState(null);

    const [form, setForm] = useState(() => ({
        nome_completo: localStorage.getItem('@RotaSegura:userName') || '',
        nome_exibicao: '',
        cpf: '',
        cnh: '',
        telefone: '',
        email: '',
        foto_url: obterFotoSalva()
    }));

    const fullName = form.nome_completo || localStorage.getItem('@RotaSegura:userName') || 'Usuário';

    useEffect(() => {
        carregarPerfil();
    }, []);

    const carregarPerfil = async () => {
        try {
            setCarregando(true);
            const response = await api.get('/api/perfil');
            const dados = response.data?.usuario || response.data || {};
            const fotoSalva =
                dados.foto_url ||
                dados.avatar_url ||
                obterFotoSalva() ||
                '';
            const nomeSalvo =
                dados.nome_completo ||
                dados.nome ||
                localStorage.getItem('@RotaSegura:userName') ||
                '';

            setForm({
                nome_completo: nomeSalvo,
                nome_exibicao: dados.nome_exibicao || dados.apelido || dados.nome || '',
                cpf: dados.cpf || '',
                cnh: dados.cnh || dados.numero_cnh || '',
                telefone: dados.telefone || '',
                email: dados.email || '',
                foto_url: fotoSalva
            });

            if (fotoSalva) {
                localStorage.setItem('@RotaSegura:userPhoto', fotoSalva);
            }
        } catch (error) {
            console.error('Erro ao carregar perfil:', error);
            const fotoLocal = obterFotoSalva();
            setForm((prev) => ({
                ...prev,
                nome_completo: prev.nome_completo || localStorage.getItem('@RotaSegura:userName') || '',
                foto_url: prev.foto_url || fotoLocal
            }));
        } finally {
            setCarregando(false);
        }
    };

    const handleChange = (campo, valor) => {
        setMensagem(null);
        setForm((prev) => {
            const atualizado = { ...prev, [campo]: valor };
            if (campo === 'foto_url') {
                sincronizarFotoNoStorage(valor, atualizado.nome_completo);
            }
            return atualizado;
        });
    };

    const handleArquivoFoto = (e) => {
        const arquivo = e.target.files?.[0];
        if (!arquivo) return;

        const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
        if (!tiposPermitidos.includes(arquivo.type)) {
            setMensagem({ tipo: 'erro', texto: 'Selecione uma imagem JPG, PNG ou WebP.' });
            return;
        }

        if (arquivo.size > 2 * 1024 * 1024) {
            setMensagem({ tipo: 'erro', texto: 'A imagem deve ter no máximo 2 MB.' });
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                handleChange('foto_url', reader.result);
            }
        };
        reader.readAsDataURL(arquivo);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMensagem(null);

        if (!form.nome_completo.trim()) {
            setMensagem({ tipo: 'erro', texto: 'O nome completo é obrigatório.' });
            return;
        }

        try {
            setSalvando(true);
            const payload = {
                nome_completo: form.nome_completo.trim(),
                nome_exibicao: (form.nome_exibicao || form.nome_completo).trim(),
                cpf: form.cpf.trim(),
                cnh: form.cnh.trim(),
                telefone: form.telefone.trim(),
                email: form.email.trim(),
                foto_url: form.foto_url.trim()
            };

            const response = await api.put('/api/perfil', payload);
            localStorage.setItem('@RotaSegura:userName', payload.nome_completo);
            sincronizarFotoNoStorage(payload.foto_url, payload.nome_completo);

            setMensagem({
                tipo: 'sucesso',
                texto: response.data?.mensagem || 'Perfil atualizado com sucesso!'
            });
        } catch (error) {
            console.error('Erro ao salvar perfil:', error);
            setMensagem({
                tipo: 'erro',
                texto: error.response?.data?.erro || 'Não foi possível salvar as alterações do perfil.'
            });
        } finally {
            setSalvando(false);
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

    const estiloInput = {
        width: '100%',
        padding: '10px 12px',
        borderRadius: '8px',
        border: '1px solid #d0d7de',
        fontSize: '14px',
        boxSizing: 'border-box',
        backgroundColor: '#ffffff',
        color: '#111827',
        WebkitTextFillColor: '#111827',
        caretColor: '#111827'
    };

    const estiloLabel = {
        display: 'block',
        fontSize: '13px',
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: '6px'
    };

    return (
        <div className="dashboard-container">
            <Sidebar />

            <main className="dashboard-main">
                <header className="dashboard-header">
                    <div className="welcome-text">
                        <h1>Editar titular da conta</h1>
                        <p>Mantenha seus dados e foto de perfil atualizados para os responsáveis.</p>
                    </div>
                    <div className="user-avatar-initials" style={{ overflow: 'hidden' }}>
                        {form.foto_url ? (
                            <img
                                src={form.foto_url}
                                alt={`Foto de ${fullName}`}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    display: 'block'
                                }}
                                onError={() => handleChange('foto_url', '')}
                            />
                        ) : (
                            getInitials(fullName)
                        )}
                    </div>
                </header>

                <div className="card" style={{ marginTop: '20px', padding: '24px', maxWidth: '760px' }}>
                    {carregando ? (
                        <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>Carregando dados do perfil...</p>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            {/* Banner de credibilidade */}
                            <div
                                style={{
                                    background: '#fffbeb',
                                    border: '1px solid #fde68a',
                                    borderRadius: '10px',
                                    padding: '14px 16px',
                                    marginBottom: '20px'
                                }}
                            >
                                <div style={{ fontWeight: '700', color: '#92400e', fontSize: '14px', marginBottom: '4px' }}>
                                    ⭐ 📷 Foto passa credibilidade para os pais
                                </div>
                                <p style={{ margin: 0, fontSize: '13px', color: '#78350f', lineHeight: 1.45 }}>
                                    Motoristas com foto geram muito mais confiança. Recomendamos fortemente que todos os motoristas tenham uma foto de perfil atualizada.
                                </p>
                            </div>

                            {mensagem && (
                                <div
                                    style={{
                                        padding: '12px 14px',
                                        borderRadius: '8px',
                                        marginBottom: '18px',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        background: mensagem.tipo === 'sucesso' ? '#d1e7dd' : '#f8d7da',
                                        color: mensagem.tipo === 'sucesso' ? '#0f5132' : '#842029'
                                    }}
                                >
                                    {mensagem.texto}
                                </div>
                            )}

                            {/* Foto de perfil: upload + URL */}
                            <div style={{ marginBottom: '20px' }}>
                                <label style={estiloLabel}>Foto de perfil</label>
                                <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            padding: '12px 16px',
                                            borderRadius: '10px',
                                            border: '1px dashed #9ca3af',
                                            background: '#f9fafb',
                                            cursor: 'pointer',
                                            minWidth: '185px'
                                        }}
                                    >
                                        {form.foto_url ? (
                                            <img
                                                src={form.foto_url}
                                                alt="Prévia do perfil"
                                                style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '50%',
                                                    objectFit: 'cover'
                                                }}
                                            />
                                        ) : (
                                            <span
                                                style={{
                                                    width: '38px',
                                                    height: '38px',
                                                    borderRadius: '50%',
                                                    background: '#e5e7eb',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '16px'
                                                }}
                                            >
                                                📷
                                            </span>
                                        )}
                                        <span style={{ textAlign: 'left' }}>
                                            <strong style={{ display: 'block', fontSize: '13px', color: '#111827' }}>
                                                Enviar imagem
                                            </strong>
                                            <small style={{ fontSize: '11px', color: '#6b7280' }}>
                                                JPG, PNG ou WebP
                                            </small>
                                        </span>
                                    </button>

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={handleArquivoFoto}
                                        style={{ display: 'none' }}
                                    />

                                    <div style={{ flex: 1, minWidth: '220px' }}>
                                        <label style={{ ...estiloLabel, fontSize: '12px', color: '#4b5563' }}>
                                            Ou cole uma URL pública:
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="https://exemplo.com/foto.jpg"
                                            value={form.foto_url.startsWith('data:') ? '' : form.foto_url}
                                            onChange={(e) => handleChange('foto_url', e.target.value)}
                                            style={estiloInput}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Nome completo */}
                            <div style={{ marginBottom: '16px' }}>
                                <label style={estiloLabel}>
                                    Nome completo <span style={{ color: '#dc2626' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="João da Silva"
                                    value={form.nome_completo}
                                    onChange={(e) => handleChange('nome_completo', e.target.value)}
                                    style={estiloInput}
                                />
                            </div>

                            {/* Como quer ser chamado pelos pais? */}
                            <div style={{ marginBottom: '18px' }}>
                                <label style={estiloLabel}>Como quer ser chamado pelos pais?</label>
                                <input
                                    type="text"
                                    placeholder="João da Silva"
                                    value={form.nome_exibicao}
                                    onChange={(e) => handleChange('nome_exibicao', e.target.value)}
                                    style={estiloInput}
                                />
                                <small style={{ display: 'block', marginTop: '4px', fontSize: '12px', color: '#6b7280' }}>
                                    Este nome aparece para os responsáveis no aplicativo.
                                </small>
                            </div>

                            {/* CPF e Número da CNH */}
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                                    gap: '14px',
                                    marginBottom: '16px'
                                }}
                            >
                                <div>
                                    <label style={estiloLabel}>CPF</label>
                                    <input
                                        type="text"
                                        placeholder="000.000.000-00"
                                        value={form.cpf}
                                        onChange={(e) => handleChange('cpf', e.target.value)}
                                        style={estiloInput}
                                    />
                                </div>
                                <div>
                                    <label style={estiloLabel}>Número da CNH</label>
                                    <input
                                        type="text"
                                        placeholder="00000000000"
                                        value={form.cnh}
                                        onChange={(e) => handleChange('cnh', e.target.value)}
                                        style={estiloInput}
                                    />
                                </div>
                            </div>

                            {/* Telefone e E-mail */}
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                                    gap: '14px',
                                    marginBottom: '20px'
                                }}
                            >
                                <div>
                                    <label style={estiloLabel}>Telefone</label>
                                    <input
                                        type="text"
                                        placeholder="(11) 99999-9999"
                                        value={form.telefone}
                                        onChange={(e) => handleChange('telefone', e.target.value)}
                                        style={estiloInput}
                                    />
                                </div>
                                <div>
                                    <label style={estiloLabel}>E-mail</label>
                                    <input
                                        type="email"
                                        placeholder="joaosilva@gmail.com"
                                        value={form.email}
                                        onChange={(e) => handleChange('email', e.target.value)}
                                        style={estiloInput}
                                    />
                                    <small style={{ display: 'block', marginTop: '4px', fontSize: '12px', color: '#6b7280' }}>
                                        É o login no painel e no app; altere só se necessário.
                                    </small>
                                </div>
                            </div>

                            {/* Rodapé informativo e botões */}
                            <div
                                style={{
                                    background: '#f9fafb',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    padding: '12px 14px',
                                    fontSize: '12px',
                                    color: '#4b5563',
                                    marginBottom: '20px'
                                }}
                            >
                                Veículos do titular ficam no cadastro de <strong>Veículos</strong> e nas rotas.
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button
                                    type="button"
                                    onClick={() => navigate('/dashboard')}
                                    style={{
                                        padding: '10px 18px',
                                        borderRadius: '8px',
                                        border: '1px solid #d1d5db',
                                        background: '#fff',
                                        color: '#374151',
                                        cursor: 'pointer',
                                        fontSize: '14px'
                                    }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={salvando}
                                    style={{
                                        padding: '10px 22px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: '#0d6efd',
                                        color: '#fff',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        fontSize: '14px'
                                    }}
                                >
                                    {salvando ? 'Salvando...' : 'Salvar alterações'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </main>
        </div>
    );
}