export function formatDateTime(dataIso) {
    const data = new Date(dataIso);

    // Formatar data
    const dateFormated = data.toLocaleDateString('pt-BR');

    // Formatar hora
    const timeFormated = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    return `${dateFormated} ${timeFormated}`;
}