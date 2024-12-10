export function formatarData(dataIso) {
    const data = new Date(dataIso);

    // Formatar data
    const dataFormatada = data.toLocaleDateString('pt-BR');

    return `${dataFormatada}`;
}