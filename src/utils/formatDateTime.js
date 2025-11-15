export function formatDateTime(isoDate) {
    const date = new Date(isoDate);

    // Formatar data
    const formattedDate = date.toLocaleDateString('pt-BR');

    // Formatar hora
    const formattedTime = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    return `${formattedDate} ${formattedTime}`;
}