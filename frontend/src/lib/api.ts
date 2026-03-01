import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
console.log('DEBUG: API_BASE_URL:', API_BASE_URL);
console.log('DEBUG: Lib/API Version: 3');

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export interface QuizQuestion {
    question?: string;
    statement_a?: string;
    statement_b?: string;
    choices: string[];
    answer_index: number;
    explanation: string;
    era: string;
    field: string;
    answer?: string;
}

export interface QuizRequest {
    user_id: string;
    era: string;
    field: string;
    quiz_type: string;
    pdf_ids: number[];
}

export interface QuizSubmit {
    user_id: string;
    question_text: string;
    user_answer: string;
    correct_answer: string;
    is_correct: boolean;
    era: string;
    field: string;
}

export interface PDFInfo {
    id: number;
    file_name: string;
    char_count: number;
    created_at: string;
}

export interface UserStats {
    total: number;
    correct: number;
    accuracy: number;
    by_era: {
        era: string;
        total: number;
        correct: number;
        accuracy: number;
    }[];
}

export interface WeakArea {
    era: string;
    field: string;
    total: number;
    wrong: number;
    error_rate: number;
}

export const quizApi = {
    generate: (data: QuizRequest) => api.post<QuizQuestion[]>('/quiz/generate', data),
    submit: (data: QuizSubmit) => api.post('/quiz/submit', data),
};

export const pdfApi = {
    list: (userId: string) => api.get<PDFInfo[]>(`/pdf/list/${userId}`),
    upload: (userId: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post(`/pdf/upload/${userId}`, formData, {
            // Do NOT set Content-Type header manually for FormData. 
            // Axios will handle it including the boundary.
        });
    },
    uploadDrive: (userId: string, url: string) => api.post('/pdf/upload-drive', { user_id: userId, url }),
    delete: (pdfId: number) => api.delete(`/pdf/${pdfId}`),
};

export const statsApi = {
    get: (userId: string) => api.get<UserStats>(`/stats/${userId}`),
    weakAreas: (userId: string) => api.get<WeakArea[]>(`/stats/weak-areas/${userId}`),
};

export default api;
