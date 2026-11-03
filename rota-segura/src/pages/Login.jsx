import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import './Login.css';

export default function Login() {
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [perfil, setPerfil] = useState('responsavel'); // Valor padrão: responsável
    const [mostrarSenha, setMostrarSenha] = useState(false);
    const [lembrarMe, setLembrarMe] = useState(false);

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

            // Envia o e-mail, senha e o perfil selecionado para a autenticação
            const data = await authService.login(
                emailFormatado,
                senha,
                perfil
            );

            const token = data?.accesstoken || data?.accessToken || data?.token;

            if (!token) {
                setErro('O login não pôde ser concluído. Verifique a resposta do servidor.');
                return;
            }

            // Persiste o Token, Nome e Perfil do Usuário
            localStorage.setItem('@RotaSegura:token', token);

            const nomeUsuario = data?.user?.nome || data?.user?.name || data?.nome || 'Usuário';
            localStorage.setItem('@RotaSegura:userName', nomeUsuario);

            // Salva o perfil recebido da API (ou o selecionado na tela)
            const roleFinal = data?.user?.perfil || data?.perfil || perfil;
            localStorage.setItem('@RotaSegura:userRole', roleFinal);

            navigate('/dashboard', { replace: true });

        } catch (err) {
            if (err.response) {
                const status = err.response.status;
                if (status === 401 || status === 403) {
                    setErro('E-mail, senha ou perfil incorretos. Verifique seus dados.');
                } else {
                    setErro(
                        err.response.data?.erro ||
                        err.response.data?.message ||
                        'Não foi possível realizar o login. Tente novamente.'
                    );
                }
            } else {
                setErro('Não foi possível conectar ao servidor. Verifique sua conexão.');
            }
        } finally {
            setCarregando(false);
        }
    };

    return (
        <div className="login-split-container">
            {/* Painel Esquerdo - Branding */}
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
                        Rotas seguras. <br />
                        Alunos protegidos.
                    </h1>
                    <p>
                        Gerencie o transporte escolar com mais segurança, organização e tranquilidade para todos.
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

            {/* Painel Direito - Formulário com Seletor de Perfil */}
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
                        <h3>Acesse sua conta</h3>
                        <p>Selecione seu perfil e entre com suas credenciais.</p>
                    </div>

                    {erro && (
                        <div className="alert-error" role="alert">
                            {erro}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} noValidate>
                        {/* Seletor de Perfil do Usuário */}
                        <div className="input-field-group">
                            <label htmlFor="perfil">Tipo de Perfil</label>
                            <div className="input-with-icon">
                                <span className="field-icon" aria-hidden="true">👤</span>
                                <select
                                    id="perfil"
                                    name="perfil"
                                    value={perfil}
                                    onChange={(e) => setPerfil(e.target.value)}
                                    disabled={carregando}
                                    style={{
                                        width: '100%',
                                        padding: '12px 12px 12px 40px',
                                        borderRadius: '8px',
                                        border: '1px solid #d1d5db',
                                        fontSize: '14px',
                                        outline: 'none',
                                        background: '#fff',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="responsavel">👨‍👩‍👧 Responsável</option>
                                    <option value="estudante">🎓 Estudante</option>
                                    <option value="administrador">⚙️ Administrador</option>
                                </select>
                            </div>
                        </div>

                        {/* Campo de Email */}
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
                                    disabled={carregando}
                                    required
                                />
                            </div>
                        </div>

                        {/* Campo de Senha */}
                        <div className="input-field-group">
                            <label htmlFor="senha">Senha</label>
                            <div className="input-with-icon">
                                <span className="field-icon" aria-hidden="true">🔒</span>
                                <input
                                    id="senha"
                                    name="senha"
                                    type={mostrarSenha ? 'text' : 'password'}
                                    placeholder="••••••••••••"
                                    autoComplete="current-password"
                                    value={senha}
                                    onChange={(e) => {
                                        setSenha(e.target.value);
                                        if (erro) setErro('');
                                    }}
                                    disabled={carregando}
                                    required
                                />
                                <button
                                    type="button"
                                    className="toggle-password-btn"
                                    onClick={() => setMostrarSenha((anterior) => !anterior)}
                                    aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                                    aria-pressed={mostrarSenha}
                                    disabled={carregando}
                                >
                                    {mostrarSenha ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>

                        <div className="form-extra-options">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={lembrarMe}
                                    onChange={(e) => setLembrarMe(e.target.checked)}
                                    disabled={carregando}
                                />
                                <span>Lembrar-me</span>
                            </label>

                            <Link to="/recuperar-senha" className="forgot-link">
                                Esqueci minha senha
                            </Link>
                        </div>

                        <button
                            type="submit"
                            className="btn-login-primary"
                            disabled={carregando}
                        >
                            {carregando ? 'Entrando...' : 'Log in'}
                        </button>
                    </form>

                    <Link to="/cadastro" className="btn-create-account-outline">
                        Criar conta
                    </Link>
                </div>
            </div>
        </div>
    );
}
