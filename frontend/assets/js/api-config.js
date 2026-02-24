// assets/js/api-config.js
/**
 * Configuração centralizada da API.
 * Quando rodando localmente (localhost ou via file://), aponta para o servidor local porta 3000.
 * Quando rodando em produção (Netlify), deve apontar para o URL do backend no Render.
 */
(function () {
    const isLocal = location.hostname === "localhost" || location.hostname === "127.0.0.1" || location.protocol === "file:";

    // URL do seu backend no Render
    const RENDER_BACKEND_URL = "https://platform-design.onrender.com";

    window.IC_API_CONFIG = {
        baseUrl: isLocal ? "http://localhost:3000" : RENDER_BACKEND_URL,
        isLocal: isLocal
    };

    console.log(`[API Config] Mode: ${isLocal ? "Local" : "Production"} | URL: ${window.IC_API_CONFIG.baseUrl}`);
})();
