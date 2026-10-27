import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import './Login.css';

export default function RecuperarSenha() {
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [erro, setErro] = useState('');
    const [sucesso, setSucesso] = useState('');
    const [carregando, setCarregando] = useState(false);

    // Validação do formato do e-mail
    const validarEmail = (emailStr) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(emailStr.trim());
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErro('');
        setSucesso('');

        const emailFormatado = email.trim();

        // 1. Validação de preenchimento
        if (!emailFormatado) {
            setErro('Por favor, informe o seu endereço de e-mail.');
            return;
        }

        // 2. Validação do formato
        if (!validarEmail(emailFormatado)) {
            setErro('Informe um endereço de e-mail válido.');
            return;
        }

        try {
            setCarregando(true);

            // Requisição para a API de recuperação de senha
            await authService.recuperarSenha(emailFormatado);

            // 3. Sucesso: Mensagem informando que as instruções foram enviadas
            setSucesso('Instruções enviadas! Verifique sua caixa de entrada e siga as orientações enviadas para o e-mail informado.');

        } catch (err) {
            if (err.response) {
                setErro(
                    err.response.data?.message ||
                    err.response.data?.erro ||
                    'Não foi possível processar a solicitação. Verifique o e-mail e tente novamente.'
                );
            } else {
                setErro('Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.');
            }
        } finally {
            setCarregando(false);
        }
    };

    return (
        <div className="login-split-container">
            {/* Painel Esquerdo - Mantém a identidade visual */}
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
                        Recuperação de acesso. <br />
                        Estamos aqui para ajudar.
                    </h1>
                    <p>
                        Informe seu e-mail cadastrado para receber as orientações de redefinição de senha com total segurança.
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
                        <strong>Recuperação segura e protegida.</strong>
                        <span>Seus dados e informações estão sempre protegidos.</span>
                    </div>
                </div>
            </div>

            {/* Painel Direito - Formulário de Recuperação */}
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
                        <h3>Esqueceu sua senha?</h3>
                        <p>Digite seu e-mail abaixo e enviaremos as instruções para redefinição.</p>
                    </div>

                    {/* Alertas de Sucesso */}
                    {sucesso && (
                        <div className="alert-success" style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.85rem', border: '1px solid #bbf7d0' }}>
                            {sucesso}
                        </div>
                    )}

                    {/* Alertas de Erro */}
                    {erro && (
                        <div className="alert-error" role="alert">
                            {erro}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} noValidate>
                        <div className="input-field-group">
                            <label htmlFor="email">E-mail cadastrado</label>
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
                                    disabled={carregando}
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn-login-primary"
                            disabled={carregando}
                        >
                            {carregando ? 'Enviando...' : 'Enviar instruções'}
                        </button>
                    </form>

                    <div className="divider-or" style={{ margin: '1.5rem 0 1rem 0' }}>ou</div>

                    {/* Opção para retornar à tela de login */}
                    <Link to="/login" className="btn-create-account-outline">
                        Voltar para o Log in
                    </Link>
                </div>
            </div>
        </div>
    );
}