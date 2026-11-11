import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Cadastro from './pages/Cadastro';
import RecuperarSenha from './pages/RecuperarSenha';
import NovaSenha from './pages/NovaSenha';
import Dashboard from './pages/Dashboard';
import Estudantes from './pages/Estudantes';
import Historico from './pages/Historico';
import Suporte from './pages/Suporte';
import Rotas from './pages/Rotas';
import './App.css';

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                {}
                <Route path="/" element={<Login />} />
                <Route path="/login" element={<Login />} />
                <Route path="/cadastro" element={<Cadastro />} />
                <Route path="/recuperar-senha" element={<RecuperarSenha />} />
                <Route path="/redefinir-senha" element={<NovaSenha />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/rotas" element={<Rotas />} />
                <Route path="/estudantes" element={<Estudantes />} />
                <Route path="/historico" element={<Historico />} />
                <Route path="/suporte" element={<Suporte />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}
