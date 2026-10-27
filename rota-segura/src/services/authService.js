import api from './api';

export const authService = {
    login: async (email, senha) => {
        const response = await api.post('/api/auth/signin', { email, password: senha });
        return response.data;
    },

    cadastrar: async (dadosUsuario) => {
        const response = await api.post('/api/auth/signup', {
            nome: dadosUsuario.nome,
            email: dadosUsuario.email,
            password: dadosUsuario.senha
        });
        return response.data;
    },

    recuperarSenha: async (email) => {
        const response = await api.post('/api/auth/forgot-password', { email });
        return response.data;
    }

};
