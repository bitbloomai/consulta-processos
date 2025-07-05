// script.js (VERSÃO ATUALIZADA COM TRADUTOR INTELIGENTE)

// Importa a lista de tribunais do arquivo de dados.
import { tribunais } from './tribunais.js';

// --- CLASSE INTELIGENTE PARA TRADUZIR DADOS DO PROCESSO ---
class ProcessoJudicialInterpreter {
    constructor(dadosBrutos) {
        this.dados = dadosBrutos;
        if (!this.dados) {
            throw new Error("Não foi possível iniciar o interpretador sem dados do processo.");
        }
    }

    _traduzirMovimento(movimento) {
        let descricaoBase = movimento.nome || "";
        let detalhes = [];

        if (movimento.complementosTabelados && movimento.complementosTabelados.length > 0) {
            movimento.complementosTabelados.forEach(comp => {
                detalhes.push(comp.nome);
            });
        }
        
        let descricaoCompleta = `${descricaoBase}: ${detalhes.join(', ')}`.trim();
        if (detalhes.length === 0 || descricaoBase === "") {
            descricaoCompleta = descricaoBase;
        }

        const traducoes = {
            "Conclusão: para despacho": "Processo enviado ao juiz para uma decisão simples ou para dar o próximo passo.",
            "Conclusão: para julgamento": "Processo enviado ao juiz para uma análise profunda e julgamento.",
            "Conclusão: para sentença": "Processo com o juiz para a decisão final do caso.",
            "Conclusão": "Processo enviado ao juiz para análise.",
            "Juntada de Petição": "Um novo documento/pedido foi adicionado ao processo por uma das partes.",
            "Juntada de Documento": "Novos documentos (provas, comprovantes, etc.) foram adicionados ao processo.",
            "Expedição de documento: Mandado": "Uma ordem judicial (Mandado) foi emitida para ser cumprida por um oficial de justiça.",
            "Expedição de documento: Certidão": "Um documento que certifica um fato (ex: passagem de tempo) foi emitido.",
            "Expedição de documento": "Um documento oficial (como uma intimação ou ofício) foi criado e será enviado.",
            "Audiência Designada": "Uma audiência foi marcada. As partes serão convocadas para comparecer.",
            "Disponibilização no Diário da Justiça Eletrônico": "Uma decisão ou despacho foi publicado no Diário Oficial online.",
            "Decurso de Prazo": "O prazo para uma das partes se manifestar no processo terminou.",
            "Mandado: entregue ao destinatário": "O oficial de justiça confirmou a entrega da ordem judicial.",
            "Mandado: não entregue ao destinatário": "O oficial de justiça não conseguiu entregar a ordem judicial ao destinatário.",
            "Mero expediente": "Ato do juiz sem decisão, apenas para dar andamento ao processo.",
            "Petição": "Uma das partes apresentou um novo pedido ou documento no processo.",
            "Distribuição": "O processo foi criado e distribuído para a vara e o juiz responsáveis pelo caso.",
            "Trânsito em Julgado": "Decisão finalizada. O processo chegou ao fim e não há mais possibilidade de recursos.",
            "Baixa Definitiva": "O processo foi oficialmente encerrado e arquivado."
        };

        for (const termo in traducoes) {
            if (descricaoCompleta.includes(termo)) {
                return traducoes[termo];
            }
        }
        return descricaoCompleta.charAt(0).toUpperCase() + descricaoCompleta.slice(1);
    }

    _formatarData(dataString) {
        if (!dataString) return 'Data não informada';
        return new Date(dataString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    }
    
    _formatarValor(valor) {
        if (valor === undefined || valor === null) return 'Não informado';
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
    }

    gerarRelatorioCompleto() {
        // Título sem negrito
        let relatorio = "🔎 Resumo do seu Processo\n\n";

        // Seções de dados sem negrito
        relatorio += `Número: ${this.dados.numeroProcesso}\n`;
        relatorio += `Tribunal: ${this.dados.tribunal || 'N/A'}\n`;
        relatorio += `Localização: ${this.dados.orgaoJulgador?.nome || 'Não informado'}\n`;
        relatorio += `Tipo de Ação: ${this.dados.classe?.nome || 'Não informado'}\n`;
        
        const assuntoPrincipal = this.dados.assuntos && this.dados.assuntos.length > 0
            ? this.dados.assuntos[0].nome
            : 'Não informado';
        relatorio += `Assunto Principal: ${assuntoPrincipal}\n`;
        relatorio += `Data de Início: ${this._formatarData(this.dados.dataAjuizamento)}\n\n`;
        
        // Seções "Valor da Causa" e "Partes Envolvidas" foram removidas.

        // Seção de andamentos sem negrito
        relatorio += "⚖️ Últimos Andamentos\n";
        const movimentos = this.dados.movimentos || [];
        movimentos.sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora));

        if (movimentos.length > 0) {
            const ultimosMovimentos = movimentos.slice(0, 4);
            ultimosMovimentos.forEach(mov => {
                const dataFormatada = this._formatarData(mov.dataHora);
                const descricaoTraduzida = this._traduzirMovimento(mov);
                // Movimentos sem negrito
                relatorio += `Em ${dataFormatada}:\n${descricaoTraduzida}\n\n`;
            });
        } else {
            relatorio += "Nenhum andamento encontrado para este processo.\n";
        }
        
        // Frase final sobre consultar advogado foi removida.

        return relatorio.trim(); // .trim() para remover qualquer espaço extra no final
    }
}

// --- CONFIGURAÇÕES ---
const config = {
    whatsappNumbers: {
        civel: '5511999999991',
        criminal: '5511999999992',
        previdenciario: '5511999999993'
    }
};

// --- ELEMENTOS DO DOM ---
const elements = {
    chatLauncher: document.getElementById('chat-launcher'),
    chatModal: document.getElementById('chat-modal'),
    closeModalButton: document.getElementById('close-modal-button'),
    chatMessages: document.getElementById('chat-messages'),
    chatInputContainer: document.getElementById('chat-input-container'),
};

// --- ESTADO DO CHAT ---
const ChatState = {
    INITIAL: 'INITIAL',
    ASKING_AREA: 'ASKING_AREA',
    ASKING_PROCESS_NUMBER: 'ASKING_PROCESS_NUMBER',
    ASKING_COURT: 'ASKING_COURT'
};
let currentChatState = ChatState.INITIAL;
let userProcessData = {};

// --- FUNÇÕES DO CHAT ---

function addMessage(text, sender) {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${sender}-bubble`;
    bubble.textContent = text;
    elements.chatMessages.appendChild(bubble);
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

function renderOptions(options) {
    elements.chatInputContainer.innerHTML = '';
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'chat-options-container';

    options.forEach(opt => {
        const button = document.createElement('button');
        button.className = 'chat-option-button';
        button.textContent = opt.text;
        button.onclick = (event) => handleUserAction('option', opt.value, event);
        optionsContainer.appendChild(button);
    });
    elements.chatInputContainer.appendChild(optionsContainer);
}

function renderTextInput(placeholder) {
    elements.chatInputContainer.innerHTML = `
        <form class="chat-input-form">
            <input type="text" class="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500" placeholder="${placeholder}" required>
            <button type="submit" class="bg-teal-600 text-white p-2 rounded-lg hover:bg-teal-700 transition">
                <i class="ph ph-paper-plane-right text-2xl"></i>
            </button>
        </form>
    `;
    elements.chatInputContainer.querySelector('form').addEventListener('submit', (e) => {
        e.preventDefault();
        const input = e.target.querySelector('input');
        if (input.value.trim()) {
            handleUserAction('text', input.value.trim());
        }
    });
}

function startConversation() {
    currentChatState = ChatState.INITIAL;
    userProcessData = {};
    elements.chatMessages.innerHTML = '';
    
    setTimeout(() => addMessage('Olá! Sou o assistente virtual do escritório.', 'bot'), 500);
    setTimeout(() => addMessage('Como posso te ajudar hoje?', 'bot'), 1200);
    setTimeout(() => {
        renderOptions([
            { text: 'Falar com Advogado', value: 'talk_to_lawyer' },
            { text: 'Consultar Processo', value: 'check_process' }
        ]);
    }, 2000);
}

async function handleUserAction(type, value, event = null) {
    let userMessage = value;
    if (type === 'option' && event) {
        if (event.target.tagName === 'SELECT') {
            userMessage = event.target.options[event.target.selectedIndex].text;
        } else {
            userMessage = event.target.textContent;
        }
    }
    addMessage(userMessage, 'user');
    
    elements.chatInputContainer.innerHTML = '<p class="text-sm text-gray-400 text-center">Assistente digitando...</p>';
    await new Promise(res => setTimeout(res, 1000));

    switch (currentChatState) {
        case ChatState.INITIAL:
            if (value === 'talk_to_lawyer') {
                currentChatState = ChatState.ASKING_AREA;
                addMessage('Excelente! Para qual área você precisa de atendimento?', 'bot');
                renderOptions([
                    { text: 'Cível', value: 'civel' },
                    { text: 'Criminal', value: 'criminal' },
                    { text: 'Previdenciário', value: 'previdenciario' }
                ]);
            } else if (value === 'check_process') {
                currentChatState = ChatState.ASKING_PROCESS_NUMBER;
                addMessage('Para consultar seu processo, por favor, digite o número dele (formato CNJ).', 'bot');
                renderTextInput('Digite o número do processo...');
            }
            break;

        case ChatState.ASKING_AREA:
            const number = config.whatsappNumbers[value];
            if (number) {
                const message = encodeURIComponent(`Olá! Gostaria de falar com um advogado da área ${value}.`);
                window.open(`https://wa.me/${number}?text=${message}`, '_blank');
                addMessage('Você será redirecionado para o WhatsApp. Se precisar de algo mais, é só chamar!', 'bot');
                setTimeout(startConversation, 3000);
            }
            break;
        
        case ChatState.ASKING_PROCESS_NUMBER:
            userProcessData.number = value.replace(/\D/g, '');
            currentChatState = ChatState.ASKING_COURT;
            addMessage('Obrigado. Agora, por favor, selecione o tribunal correspondente.', 'bot');
            renderCourtSelect();
            break;

        case ChatState.ASKING_COURT:
            userProcessData.court = value;
            addMessage('Consultando... Por favor, aguarde um momento.', 'bot');
            
            try {
                const data = await fetchProcessData(userProcessData.number, userProcessData.court);
                displayProcessData(data);
            } catch (error) {
                addMessage(`Desculpe, ocorreu um erro: ${error.message}`, 'bot');
            } finally {
                setTimeout(() => {
                    addMessage('Posso ajudar com algo mais?', 'bot');
                    currentChatState = ChatState.INITIAL;
                    renderOptions([
                        { text: 'Falar com Advogado', value: 'talk_to_lawyer' },
                        { text: 'Consultar Outro Processo', value: 'check_process' }
                    ]);
                }, 2000);
            }
            break;
    }
}

function renderCourtSelect() {
    elements.chatInputContainer.innerHTML = '';
    const select = document.createElement('select');
    select.className = "w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500";
    select.innerHTML = '<option value="">Selecione o tribunal...</option>';
    tribunais.forEach(group => {
        const optgroup = document.createElement('optgroup');
        optgroup.label = group.label;
        group.options.forEach(option => {
            const opt = document.createElement('option');
            opt.value = option.value;
            opt.textContent = option.text;
            optgroup.appendChild(opt);
        });
        select.appendChild(optgroup);
    });
    select.onchange = (e) => {
        if(e.target.value) handleUserAction('option', e.target.value, e);
    };
    elements.chatInputContainer.appendChild(select);
}

async function fetchProcessData(processNumber, courtAcronym) {
    const apiUrl = `https://consultporcess-backend.glitch.me/api/consulta-processo`;
    const requestBody = {
        numeroProcesso: processNumber,
        courtAcronym: courtAcronym
    };

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });

    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.message || `Erro no servidor (status: ${response.status})`);
    }

    if (!result.hits || result.hits.total.value === 0) {
        throw new Error('Nenhum processo encontrado com este número no tribunal selecionado.');
    }
    return result.hits.hits[0]._source;
}

// --- FUNÇÃO ATUALIZADA PARA EXIBIR OS DADOS TRADUZIDOS ---
function displayProcessData(data) {
    try {
        const interpretador = new ProcessoJudicialInterpreter(data);
        const relatorioFormatado = interpretador.gerarRelatorioCompleto();
        addMessage(relatorioFormatado, 'bot');
    } catch (error) {
        console.error("Erro ao interpretar os dados do processo:", error);
        addMessage("Não foi possível formatar os dados do processo recebido. Por favor, contate o suporte.", 'bot');
    }
}

function initialize() {
    elements.chatLauncher.addEventListener('click', () => {
        elements.chatModal.classList.remove('modal-hidden');
        elements.chatModal.classList.add('modal-visible');
        startConversation();
    });
    elements.closeModalButton.addEventListener('click', () => {
        elements.chatModal.classList.add('modal-hidden');
        elements.chatModal.classList.remove('modal-visible');
    });
}

document.addEventListener('DOMContentLoaded', initialize);