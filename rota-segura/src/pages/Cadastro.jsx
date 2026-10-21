import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import './Login.css';

export default function Cadastro() {
    const navigate = useNavigate();

    // Estados dos campos do cadastro
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    const [mostrarSenha, setMostrarSenha] = useState(false);

    // Estados de feedback
    const [erro, setErro] = useState('');
    const [sucesso, setSucesso] = useState('');
    const [carregando, setCarregando] = useState(false);

    // Validação de e-mail
    const validarEmail = (emailStr) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(emailStr.trim());
    };

    // Validação de segurança da senha (mínimo de 6 caracteres)
    const validarSenhaSegura = (senhaStr) => {
        return senhaStr.length >= 6;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErro('');
        setSucesso('');

        const nomeFormatado = nome.trim();
        const emailFormatado = email.trim();

        // 1. Validação de preenchimento dos campos obrigatórios
        if (!nomeFormatado || !emailFormatado || !senha || !confirmarSenha) {
            setErro('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        // 2. Validação do formato do e-mail
        if (!validarEmail(emailFormatado)) {
            setErro('Informe um endereço de e-mail válido.');
            return;
        }

        // 3. Validação dos critérios de segurança da senha
        if (!validarSenhaSegura(senha)) {
            setErro('A senha deve conter no mínimo 6 caracteres.');
            return;
        }

        // 4. Validação de coincidência entre senha e confirmação
        if (senha !== confirmarSenha) {
            setErro('As senhas não coincidem. Verifique e tente novamente.');
            return;
        }

        try {
            setCarregando(true);

            // Requisição para a API de cadastro no backend (rota /api/auth/signup)
            await authService.cadastrar({
                nome: nomeFormatado,
                email: emailFormatado,
                senha
            });

            // Feedback de sucesso e redirecionamento para o login conforme solicitado
            setSucesso('Conta criada com sucesso! Redirecionando para a tela de login...');
            
            setTimeout(() => {
                navigate('/login', { replace: true });
            }, 2000);

        } catch (err) {
            if (err.response) {
                const status = err.response.status;

                if (status === 400 && err.response.data?.message?.toLowerCase().includes('já')) {
                    setErro('Este e-mail já está cadastrado no sistema. Tente fazer login.');
                } else {
                    setErro(
                        err.response.data?.message ||
                        err.response.data?.erro ||
                        'Ocorreu um erro ao realizar o cadastro. Tente novamente.'
                    );
                }
            } else {
                setErro(
                    'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.'
                );
            }
        } finally {
            setCarregando(false);
        }
    };

    return (
        <div className="login-split-container">
            {/* Painel Esquerdo - Branding e Slogan */}
            <div className="login-left-pane">
                <div className="brand-header">
                    <div className="logo-shield" aria-hidden="true">
                        <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
                            <path d="M12 2L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-3zm0 2.18l7 2.33v4.99c0 4.67-3.13 9.01-7 10.18-3.87-1.17-7-5.51-7-10.18V6.51l7-2.33z"/>
                        </svg>
                    </div>
                    <span className="brand-title">RotaSegura</span>
                </div>

                <div className="hero-content">
                    <h1>
                        Crie sua conta. <br />
                        Junte-se à nossa rede.
                    </h1>
                    <p>
                        Cadastre-se para gerenciar e acompanhar o transporte escolar com praticidade e total segurança.
                    </p>
                </div>

                <div className="hero-illustration-box">
                    <div className="route-map-mock">
                        <div className="pin school" title="Escola">🏫</div>
                        <div className="route-line"></div>
                        <div className="van-icon" title="Van escolar">🚐</div>
                        <div className="pin home" title="Casa">🏠</div>
                    </div>
                </div>

                <div className="security-footer-badge">
                    <div className="lock-icon" aria-hidden="true">🔒</div>
                    <div className="security-text">
                        <strong>Seu acesso é protegido com tecnologia segura e confiável.</strong>
                        <span>Seus dados e informações estão sempre protegidos.</span>
                    </div>
                </div>
            </div>

            {/* Painel Direito - Formulário de Cadastro */}
            <div className="login-right-pane">
                <div className="login-card-modern">
                    <div className="card-top-brand">
                        <div className="logo-shield-small" aria-hidden="true">
                            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                                <path d="M12 2L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-3zm0 2.18l7 2.33v4.99c0 4.67-3.13 9.01-7 10.18-3.87-1.17-7-5.51-7-10.18V6.51l7-2.33z"/>
                            </svg>
                        </div>
                        <h2>RotaSegura</h2>
                    </div>

                    <div className="card-titles">
                        <h3>Criar uma conta</h3>
                        <p>Preencha os dados abaixo para cadastrar-se no sistema.</p>
                    </div>

                    {/* Alertas de Sucesso ou Erro */}
                    {sucesso && (
                        <div className="alert-success" style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.85rem', border: '1px solid #bbf7d0' }}>
                            {sucesso}
                        </div>
                    )}

                    {erro && (
                        <div className="alert-error" role="alert">
                            {erro}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} noValidate>
                        {/* Campo Nome Completo */}
                        <div className="input-field-group">
                            <label htmlFor="nome">Nome Completo</label>
                            <div className="input-with-icon">
                                <span className="field-icon" aria-hidden="true">👤</span>
                                <input
                                    id="nome"
                                    name="nome"
                                    type="text"
                                    placeholder="Seu nome completo"
                                    value={nome}
                                    onChange={(e) => {
                                        setNome(e.target.value);
                                        if (erro) setErro('');
                                    }}
                                    disabled={carregando || !!sucesso}
                                    required
                                />
                            </div>
                        </div>

                        {/* Campo Email */}
                        <div className="input-field-group">
                            <label htmlFor="email">Email</label>
                            <div className="input-with-icon">
                                <span className="field-icon" aria-hidden="true">✉️</span>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="seu@email.com"
                                    autoComplete="email"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (erro) setErro('');
                                    }}
                                    disabled={carregando || !!sucesso}
                                    required
                                />
                            </div>
                        </div>

                        {/* Campo Senha */}
                        <div className="input-field-group">
                            <label htmlFor="senha">Senha</label>
                            <div className="input-with-icon">
                                <span className="field-icon" aria-hidden="true">🔒</span>
                                <input
                                    id="senha"
                                    name="senha"
                                    type={mostrarSenha ? 'text' : 'password'}
                                    placeholder="Mínimo 6 caracteres"
                                    value={senha}
                                    onChange={(e) => {
                                        setSenha(e.target.value);
                                        if (erro) setErro('');
                                    }}
                                    disabled={carregando || !!sucesso}
                                    required
                                />
                                <button
                                    type="button"
                                    className="toggle-password-btn"
                                    onClick={() => setMostrarSenha((ant) => !ant)}
                                    aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                                    disabled={carregando || !!sucesso}
                                >
                                    {mostrarSenha ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>

                        {/* Campo Confirmar Senha */}
                        <div className="input-field-group">
                            <label htmlFor="confirmarSenha">Confirmar Senha</label>
                            <div className="input-with-icon">
                                <span className="field-icon" aria-hidden="true">🔒</span>
                                <input
                                    id="confirmarSenha"
                                    name="confirmarSenha"
                                    type={mostrarSenha ? 'text' : 'password'}
                                    placeholder="Repita sua senha"
                                    value={confirmarSenha}
                                    onChange={(e) => {
                                        setConfirmarSenha(e.target.value);
                                        if (erro) setErro('');
                                    }}
                                    disabled={carregando || !!sucesso}
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn-login-primary"
                            disabled={carregando || !!sucesso}
                        >
                            {carregando ? 'Cadastrando...' : 'Criar Conta'}
                        </button>
                    </form>

                    <div className="divider-or" style={{ margin: '1.5rem 0 1rem 0' }}>ou</div>

                    {/* Link para retornar à tela de login caso já possua conta */}
                    <Link to="/login" className="btn-create-account-outline">
                        Já possui uma conta? Log in
                    </Link>
                </div>
            </div>
        </div>
    );
}