import { useState } from 'react';
import api from '../services/api';
import './Login.css';

export default function NovoUsuario() {
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [perfil, setPerfil] = useState('MOTORISTA'); 
    const [mensagem, setMensagem] = useState('');
    const [erro, setErro] = useState('');
    const [carregando, setCarregando] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMensagem('');
        setErro('');

        try {
            setCarregando(true);
            const token = localStorage.getItem('@RotaSegura:token');

            const response = await api.post('/api/admin/usuarios', 
                { nome, email, password, perfil },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setMensagem(response.data.message);
            setNome('');
            setEmail('');
            setPassword('');
        } catch (err) {
            setErro(err.response?.data?.message || 'Erro ao cadastrar usuário.');
        } finally {
            setCarregando(false);
        }
    };

    return (
        <div className="admin-form-container" style={{ padding: '2rem', maxWidth: '500px', margin: 'auto' }}>
            <h2>Cadastrar Novo Membro da Equipe</h2>
            <p>Adicione motoristas ou novos administradores ao sistema.</p>

            {mensagem && <div className="alert-success" style={{ color: 'green', marginBottom: '1rem' }}>{mensagem}</div>}
            {erro && <div className="alert-error" style={{ color: 'red', marginBottom: '1rem' }}>{erro}</div>}

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '1rem' }}>
                    <label>Nome Completo</label>
                    <input 
                        type="text" 
                        value={nome} 
                        onChange={(e) => setNome(e.target.value)} 
                        required 
                        style={{ width: '100%', padding: '8px' }}
                    />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label>E-mail</label>
                    <input 
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        required 
                        style={{ width: '100%', padding: '8px' }}
                    />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label>Senha Temporária</label>
                    <input 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                        style={{ width: '100%', padding: '8px' }}
                    />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label>Tipo de Perfil</label>
                    <select 
                        value={perfil} 
                        onChange={(e) => setPerfil(e.target.value)}
                        style={{ width: '100%', padding: '8px' }}
                    >
                        <option value="MOTORISTA">🚐 Motorista</option>
                        <option value="ADMIN">⚙️ Administrador / Gestor</option>
                    </select>
                </div>

                <button 
                    type="submit" 
                    disabled={carregando}
                    style={{ width: '100%', padding: '10px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                    {carregando ? 'Salvando...' : 'Cadastrar Usuário'}
                </button>
            </form>
        </div>
    );
}