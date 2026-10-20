import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import './Login.css';

export default function Login() {
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [mostrarSenha, setMostrarSenha] = useState(false);

    const [erro, setErro] = useState('');
    const [carregando, setCarregando] = useState(false);

    const validarEmail = (emailStr) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(emailStr.trim());
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErro('');

        const emailFormatado = email.trim();

        if (!emailFormatado || !senha) {
            setErro('Por favor, preencha o e-mail e a senha.');
            return;
        }

        if (!validarEmail(emailFormatado)) {
            setErro('Informe um endereço de e-mail válido.');
            return;
        }

        try {
            setCarregando(true);

            const data = await authService.login(
                emailFormatado,
                senha
            );

            if (!data?.accessToken) {
                setErro(
                    'O login não pôde ser concluído. ' +
                    'Verifique a resposta do servidor.'
                );
                return;
            }

            localStorage.setItem(
                '@RotaSegura:token',
                data.accessToken
            );

            navigate('/dashboard', { replace: true });

        } catch (err) {
            if (err.response) {
                const status = err.response.status;

                if (status === 401 || status === 403) {
                    setErro(
                        'E-mail ou senha inválidos. Verifique seus dados.'
                    );
                } else {
                    setErro(
                        err.response.data?.erro ||
                        err.response.data?.message ||
                        'Não foi possível realizar o login. Tente novamente.'
                    );
                }
            } else {
                setErro(
                    'Não foi possível conectar ao servidor. ' +
                    'Verifique sua conexão e tente novamente.'
                );
            }
        } finally {
            setCarregando(false);
        }
    };

    return (
        <div className="login-split-container">
            <div className="login-left-pane">
                <div className="brand-header">
                    <div className="logo-shield">🛡️</div>
                    <span className="brand-title">RotaSegura</span>
                </div>

                <div className="hero-content">
                    <h1>
                        Rotas seguras.
                        <br />
                        Alunos protegidos.
                    </h1>

                    <p>
                        Gerencie o transporte escolar com mais
                        segurança, organização e tranquilidade
                        para todos.
                    </p>
                </div>

                <div className="hero-illustration-box">
                    <div className="route-map-mock">
                        <div className="pin school">🏫</div>
                        <div className="route-line"></div>
                        <div className="van-icon">🚐</div>
                        <div className="pin home">🏠</div>
                    </div>
                </div>

                <div className="security-footer-badge">
                    <div className="lock-icon">🔒</div>

                    <div className="security-text">
                        <strong>
                            Seu acesso é protegido com tecnologia
                            segura e confiável.
                        </strong>
                        <span>
                            Seus dados e informações estão sempre
                            protegidos.
                        </span>
                    </div>
                </div>
            </div>

            <div className="login-right-pane">
                <div className="login-card-modern">
                    <div className="card-top-brand">
                        <div className="logo-shield-small">🛡️</div>
                        <h2>RotaSegura</h2>
                    </div>

                    <div className="card-titles">
                        <h3>Acesse sua conta</h3>
                        <p>
                            Entre com seu e-mail e senha para
                            acessar o sistema.
                        </p>
                    </div>

                    {erro && (
                        <div className="alert-error" role="alert">
                            {erro}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} noValidate>
                        <div className="input-field-group">
                            <label htmlFor="email">E-mail</label>

                            <div className="input-with-icon">
                                <span className="field-icon" aria-hidden="true">
                                    ✉️
                                </span>

                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="seu@email.com"
                                    autoComplete="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={carregando}
                                    required
                                />
                            </div>
                        </div>

                        <div className="input-field-group">
                            <label htmlFor="senha">Senha</label>

                            <div className="input-with-icon">
                                <span className="field-icon" aria-hidden="true">
                                    🔒
                                </span>

                                <input
                                    id="senha"
                                    name="senha"
                                    type={mostrarSenha ? 'text' : 'password'}
                                    placeholder="Digite sua senha"
                                    autoComplete="current-password"
                                    value={senha}
                                    onChange={(e) => setSenha(e.target.value)}
                                    disabled={carregando}
                                    required
                                />

                                <button
                                    type="button"
                                    className="toggle-password-btn"
                                    onClick={() =>
                                        setMostrarSenha((anterior) => !anterior)
                                    }
                                    aria-label={
                                        mostrarSenha
                                            ? 'Ocultar senha'
                                            : 'Mostrar senha'
                                    }
                                    aria-pressed={mostrarSenha}
                                    disabled={carregando}
                                >
                                    {mostrarSenha ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>

                        <div className="form-extra-options">
                            <Link
                                to="/recuperar-senha"
                                className="forgot-link"
                            >
                                Esqueci minha senha
                            </Link>
                        </div>

                        <button
                            type="submit"
                            className="btn-login-primary"
                            disabled={carregando}
                        >
                            {carregando ? 'Entrando...' : 'Entrar'}
                        </button>
                    </form>

                    <div className="divider-or">ou</div>

                    <Link
                        to="/cadastro"
                        className="btn-create-account-outline"
                    >
                        Criar uma conta
                    </Link>
                </div>
            </div>
        </div>
    );
}
