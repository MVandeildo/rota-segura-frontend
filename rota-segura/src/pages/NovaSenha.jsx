import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './NovaSenha.css';

export default function NovaSenha() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token'); // Captura o token enviado pelo link do e-mail
    
    const [novaSenha, setNovaSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    const [feedback, setFeedback] = useState({ mensagem: '', tipo: '' });
    const [carregando, setCarregando] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (novaSenha !== confirmarSenha) {
            setFeedback({ mensagem: 'As senhas não coincidem.', tipo: 'error' });
            return;
        }

        if (!token) {
            setFeedback({ mensagem: 'Token de recuperação inválido ou ausente.', tipo: 'error' });
            return;
        }

        setCarregando(true);
        setFeedback({ mensagem: '', tipo: '' });

        try {
            const response = await fetch('http://localhost:3000/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, novaSenha })
            });

            const data = await response.json();

            if (response.ok) {
                setFeedback({ mensagem: data.message || 'Senha redefinida com sucesso!', tipo: 'success' });
                // Redireciona para o login após 3 segundos
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } else {
                setFeedback({ mensagem: data.message || 'Erro ao redefinir a senha.', tipo: 'error' });
            }
        } catch (error) {
            console.error('Erro na requisição:', error);
            setFeedback({ mensagem: 'Erro de conexão com o servidor.', tipo: 'error' });
        } finally {
            setCarregando(false);
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '80px auto', padding: '2rem', background: '#fff', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#333' }}>Redefinir Senha</h2>
            
            {feedback.mensagem && (
                <div style={{ 
                    padding: '10px', 
                    marginBottom: '15px', 
                    borderRadius: '4px',
                    backgroundColor: feedback.tipo === 'success' ? '#d4edda' : '#f8d7da',
                    color: feedback.tipo === 'success' ? '#155724' : '#721c24',
                    border: `1px solid ${feedback.tipo === 'success' ? '#c3e6cb' : '#f5c6cb'}`
                }}>
                    {feedback.mensagem}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#555' }}>Nova Senha</label>
                    <input 
                        type="password" 
                        value={novaSenha} 
                        onChange={(e) => setNovaSenha(e.target.value)} 
                        required 
                        placeholder="Digite a nova senha"
                        style={{ width: '100%', padding: '10px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' }}
                    />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#555' }}>Confirme a Nova Senha</label>
                    <input 
                        type="password" 
                        value={confirmarSenha} 
                        onChange={(e) => setConfirmarSenha(e.target.value)} 
                        required 
                        placeholder="Confirme a nova senha"
                        style={{ width: '100%', padding: '10px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' }}
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={carregando}
                    style={{ 
                        width: '100%', 
                        padding: '12px', 
                        background: '#2563eb', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '4px', 
                        fontWeight: 'bold', 
                        cursor: carregando ? 'not-allowed' : 'pointer',
                        opacity: carregando ? 0.7 : 1
                    }}
                >
                    {carregando ? 'A redefinir...' : 'Salvar Nova Senha'}
                </button>
            </form>
        </div>
    );
}