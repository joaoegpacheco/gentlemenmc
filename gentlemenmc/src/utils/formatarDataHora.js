export function formatarDataHora(dataIso) {
    const data = new Date(dataIso);

    // Formatar data
    const dataFormatada = data.toLocaleDateString('pt-BR');

    // Formatar hora
    const horaFormatada = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    return `${dataFormatada} ${horaFormatada}`;
}