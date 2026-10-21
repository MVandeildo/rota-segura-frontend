import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Cadastro from './pages/Cadastro';
import './App.css';

function Dashboard() {
    return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h1>Área Principal - RotaSegura 🚍</h1>
        </div>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Redireciona a raiz "/" diretamente para a tela de Login */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                
                {/* Tela de Login */}
                <Route path="/login" element={<Login />} />
                
                {/* Tela de Cadastro (acessada pelo botão Create account do login) */}
                <Route path="/cadastro" element={<Cadastro />} />
                
                {/* Área protegida / Dashboard após logar */}
                <Route path="/dashboard" element={<Dashboard />} />
                
                {/* Qualquer rota inválida redireciona para o login */}
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    );
}
