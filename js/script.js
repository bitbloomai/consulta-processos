// Importa a lista de tribunais do arquivo de dados.
import { tribunais } from './tribunais.js';

// --- CONFIGURAÇÕES ---
const config = {
    whatsappNumbers: {
        civel: '5511999999991',
        criminal: '5511999999992',
        previdenciario: '5511999999993'
    },
    datajudApiKey: 'APIKey cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw=='
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

function renderTextInput(placeholder, onSubmit) {
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
        // Para o select, o texto está na opção selecionada
        if (event.target.tagName === 'SELECT') {
            userMessage = event.target.options[event.target.selectedIndex].text;
        } else { // Para botões, o texto está no próprio botão
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
                renderTextInput('Digite o número do processo...', (processNumber) => {
                    handleUserAction('text', processNumber);
                });
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
                addMessage('Posso ajudar com algo mais?', 'bot');
                currentChatState = ChatState.INITIAL;
                 renderOptions([
                    { text: 'Falar com Advogado', value: 'talk_to_lawyer' },
                    { text: 'Consultar Outro Processo', value: 'check_process' }
                ]);
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
    const apiUrl = `https://api-publica.datajud.cnj.jus.br/api_publica_${courtAcronym}/_search`;
    const requestBody = { "query": { "match": { "numeroProcesso": processNumber } } };
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Authorization': config.datajudApiKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });
    if (!response.ok) throw new Error(`Falha na comunicação com a API.`);
    const result = await response.json();
    if (result.hits.total.value === 0) throw new Error('Nenhum processo encontrado.');
    return result.hits.hits[0]._source;
}

function displayProcessData(data) {
    const courtText = document.querySelector(`option[value="${userProcessData.court}"]`)?.textContent || userProcessData.court.toUpperCase();
    const movements = (data.movimentos || []).slice(0, 3).map(mov => 
        `\n- ${new Date(mov.dataHora).toLocaleDateString('pt-BR')}: ${mov.movimentoNacional?.descricao || mov.descricao}`
    ).join('');
    
    const resultText = `Consulta realizada com sucesso!\n\nProcesso: ${data.numeroProcesso}\nTribunal: ${courtText}\nClasse: ${data.classe?.nome || 'N/A'}\n\nÚltimas Movimentações:${movements || ' Nenhuma encontrada.'}`;
    addMessage(resultText, 'bot');
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

// Garante que o script rode após o carregamento do HTML
document.addEventListener('DOMContentLoaded', initialize);
