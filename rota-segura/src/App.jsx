import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login'; 

function App() {
  return (
    <Router>
      <Routes>
        {/* Rota da Tela de Login */}
        <Route path="/login" element={<Login />} />

        {/* Exemplo de Rota para o Dashboard (Área Principal) */}
        <Route 
          path="/dashboard" 
          element={
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <h1>Bem-vindo à Área Principal - RotaSegura 🚐🏫</h1>
              <p>Você está autenticado com sucesso!</p>
            </div>
          } 
        />

        {/* Redireciona a raiz "/" diretamente para o login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Rota coringa para páginas não encontradas */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
