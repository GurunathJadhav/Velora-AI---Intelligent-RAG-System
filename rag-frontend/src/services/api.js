import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
});

export const ragApi = {
    query: async (query, history, top_k = 5, namespace = "velora_knowledge_base") => {
        const response = await api.post('/query', {
            query,
            top_k,
            namespace,
            history,
        });
        return response.data;
    },

    ingest: async (data, namespace = "velora_knowledge_base") => {
        const response = await api.post('/internal/ingest', {
            ...data,
            namespace,
        });
        return response.data;
    },

    uploadFiles: async (files, namespace = "velora_knowledge_base") => {
        const formData = new FormData();
        files.forEach(f => formData.append('files', f));
        formData.append('namespace', namespace);

        const response = await api.post('/internal/ingest-files', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
        });
        return response.data;
    },
};

export default api;
