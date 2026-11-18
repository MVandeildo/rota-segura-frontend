import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../pages/Sidebar';
import api from '../services/api';
import './Dashboard.css';

export default function Historico() {
    const navigate = useNavigate();

    const [fullName, setFullName] = useState('Usuário');
    const [registros, setRegistros] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [baixandoCsv, setBaixandoCsv] = useState(false);

    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');
    const [rotaId, setRotaId] = useState('');
    const [motoristaId, setMotoristaId] = useState('');

    useEffect(() => {
        const savedName = localStorage.getItem('@RotaSegura:userName');
        if (savedName) {
            setFullName(savedName);
        }
        carregarRelatorio();
    }, []);

    const carregarRelatorio = async (limpar = false) => {
        try {
            setCarregando(true);
            const params = {};
            
            if (!limpar) {
                if (dataInicio) params.data_inicio = dataInicio;
                if (dataFim) params.data_fim = dataFim;
                if (rotaId) params.rota_id = rotaId;
                if (motoristaId) params.motorista_id = motoristaId;
            }

            const response = await api.get('/api/relatorios/auditoria', { params });
            const dados = response.data?.viagens || [];
            setRegistros(dados);
        } catch (error) {
            console.error('Erro ao carregar o relatório de auditoria:', error);
            setRegistros([]);
        } finally {
            setCarregando(false);
        }
    };

    const handleLimparFiltros = () => {
        setDataInicio('');
        setDataFim('');
        setRotaId('');
        setMotoristaId('');
        carregarRelatorio(true);
    };

    const handleDownloadCsv = async () => {
        try {
            setBaixandoCsv(true);
            const params = { formato: 'csv' };
            if (dataInicio) params.data_inicio = dataInicio;
            if (dataFim) params.data_fim = dataFim;
            if (rotaId) params.rota_id = rotaId;
            if (motoristaId) params.motorista_id = motoristaId;

            const response = await api.get('/api/relatorios/auditoria', {
                params,
                responseType: 'blob', 
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `relatorio-auditoria-${new Date().toISOString().slice(0, 10)}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Erro ao baixar CSV:', error);
            alert('Não foi possível gerar o arquivo CSV.');
        } finally {
            setBaixandoCsv(false);
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

    return (
        <div className="dashboard-container">
            <Sidebar />

            <main className="dashboard-main">
                <header className="dashboard-header">
                    <div className="welcome-text">
                        <h1>Relatórios e Histórico de Rotas</h1>
                        <p>Consulte o registro cronológico completo das presenças e viagens realizadas.</p>
                    </div>
                    <div className="header-user-actions" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <button 
                            onClick={handleDownloadCsv}
                            disabled={baixandoCsv}
                            style={{ padding: '10px 18px', background: '#198754', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
                        >
                            {baixandoCsv ? 'Gerando CSV...' : '📥 Baixar Relatório CSV'}
                        </button>
                        <div className="user-avatar-initials">{getInitials(fullName)}</div>
                    </div>
                </header>

                <div className="card" style={{ marginTop: '20px', padding: '20px' }}>
                    {/* Barra de Filtros */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px', background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '3px' }}>Data Início:</label>
                                <input 
                                    type="date" 
                                    value={dataInicio} 
                                    onChange={(e) => setDataInicio(e.target.value)}
                                    style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '13px' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '3px' }}>Data Fim:</label>
                                <input 
                                    type="date" 
                                    value={dataFim} 
                                    onChange={(e) => setDataFim(e.target.value)}
                                    style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '13px' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '3px' }}>ID da Rota:</label>
                                <input 
                                    type="number" 
                                    placeholder="Ex: 1" 
                                    value={rotaId} 
                                    onChange={(e) => setRotaId(e.target.value)}
                                    style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '13px', width: '90px' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '3px' }}>ID do Motorista:</label>
                                <input 
                                    type="number" 
                                    placeholder="Ex: 2" 
                                    value={motoristaId} 
                                    onChange={(e) => setMotoristaId(e.target.value)}
                                    style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '13px', width: '90px' }}
                                />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                            <button 
                                onClick={() => carregarRelatorio(false)}
                                style={{ padding: '8px 16px', background: '#0d6efd', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                            >
                                Filtrar
                            </button>
                            <button 
                                onClick={handleLimparFiltros}
                                style={{ padding: '8px 16px', background: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
                            >
                                Limpar
                            </button>
                        </div>
                    </div>

                    {carregando ? (
                        <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>Carregando histórico de rotas...</p>
                    ) : registros.length === 0 ? (
                        <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>Nenhum registro encontrado para os filtros selecionados.</p>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr>
                                        <th>Data</th>
                                        <th>Turno</th>
                                        <th>Rota</th>
                                        <th>Motorista</th>
                                        <th>Status</th>
                                        <th>Início</th>
                                        <th>Término</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {registros.map((item) => (
                                        <tr key={item.viagem_id}>
                                            <td>
                                                {item.data
                                                    ? new Date(item.data).toLocaleDateString('pt-BR', {
                                                        timeZone: 'UTC'
                                                    })
                                                    : 'N/D'}
                                            </td>

                                            <td>{item.turno || 'N/D'}</td>

                                            <td>
                                                {item.rota_nome} (ID: {item.rota_id})
                                            </td>

                                            <td>{item.motorista_nome}</td>

                                            <td>{item.status || 'N/D'}</td>

                                            <td>
                                                {item.iniciada_em
                                                    ? new Date(item.iniciada_em).toLocaleString('pt-BR')
                                                    : 'Não iniciada'}
                                            </td>

                                            <td>
                                                {item.finalizada_em
                                                    ? new Date(item.finalizada_em).toLocaleString('pt-BR')
                                                    : 'Não finalizada'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}