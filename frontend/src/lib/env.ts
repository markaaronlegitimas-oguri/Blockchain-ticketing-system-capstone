// Runtime configuration, read once from Vite's environment.
export const API_BASE: string = import.meta.env.VITE_API_BASE_URL || '/api';
export const CONTRACT_ADDRESS: string = import.meta.env.VITE_CONTRACT_ADDRESS || '';
