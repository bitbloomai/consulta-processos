# Backend - Chat de Consulta Processual

## 📖 Descrição

Este é o backend para um serviço de chat online, projetado para ser integrado ao site de um escritório de advocacia. A aplicação permite que os usuários consultem informações públicas de processos judiciais de forma rápida e conversacional.

O sistema utiliza a **API Pública do DataJud**, uma iniciativa do Conselho Nacional de Justiça (CNJ) que centraliza os metadados dos processos judiciais dos tribunais brasileiros, garantindo acesso padronizado e transparente às informações.

## ✨ Funcionalidades

- **Interface de Chat:** Recebe e processa mensagens contendo o número do processo a ser consultado.
- **Consulta ao DataJud:** Conecta-se à API do DataJud para buscar os dados públicos do processo.
- **Extração de Dados:** Analisa a resposta da API e extrai as informações mais relevantes (classe, assunto, últimos andamentos, etc.).
- **Resposta ao Usuário:** Formata os dados e os envia de volta para a interface do chat no frontend.
- **Segurança:** Valida o formato do número do processo e gerencia o uso da chave da API de forma segura.

## 🛠️ Tecnologias Utilizadas

* **Linguagem:** `[Ex: Node.js, Python, Java]`
* **Framework:** `[Ex: Express.js, Flask, Spring Boot]`
* **Gerenciador de Pacotes:** `[Ex: NPM, Pip, Maven]`
* **Cliente HTTP:** `[Ex: Axios, Requests, OkHttp]`

## ⚙️ Pré-requisitos

Antes de começar, certifique-se de que você tem o seguinte instalado em sua máquina de desenvolvimento:
* `[Linguagem e versão, ex: Node.js >= 18.0]`
* `[Gerenciador de pacotes, ex: npm >= 9.0]`
* Um editor de código de sua preferência (ex: VS Code).

## 🚀 Instalação e Execução

Siga os passos abaixo para configurar e rodar o projeto localmente.

1.  **Clone o repositório:**
    ```bash
    git clone [URL_DO_SEU_REPOSITORIO]
    cd [NOME_DA_PASTA_DO_PROJETO]
    ```

2.  **Instale as dependências:**
    ```bash
    # Exemplo para Node.js/npm
    npm install
    ```

3.  **Configuração do Ambiente:**
    Crie um arquivo `.env` na raiz do projeto, copiando o exemplo de `.env.example`. Este arquivo armazenará suas variáveis de ambiente.
    ```bash
    cp .env.example .env
    ```
    Abra o arquivo `.env` e preencha as variáveis necessárias.

4.  **Execute o projeto em modo de desenvolvimento:**
    ```bash
    # Exemplo para Node.js/npm
    npm run dev
    ```

5.  O servidor estará rodando em `http://localhost:[SUA_PORTA]`.

## 🔑 Configuração da API DataJud

Para que o sistema possa consultar os processos, é necessário configurar o acesso à API do DataJud.

1.  **Chave da API (API Key):**
    A API do DataJud requer uma chave de autorização para cada requisição. O CNJ disponibiliza uma chave pública que pode ser encontrada na documentação oficial.

    No seu arquivo `.env`, adicione a chave:
    ```env
    # .env
    DATAJUD_API_KEY="cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw=="
    ```
    > **Atenção:** Por segurança e gestão do CNJ, esta chave pode ser alterada. Consulte a [documentação do DataJud-Wiki](https://datajud-wiki.cnj.jus.br/api-publica) para obter a chave mais recente se a consulta falhar.

2.  **Endpoint do Tribunal:**
    Cada tribunal possui um endpoint (URL) específico. O backend precisa identificar o tribunal a partir do número do processo para direcionar a consulta corretamente. A lógica para extrair a sigla do tribunal do número do processo (padrão CNJ) deve ser implementada na aplicação.

    Exemplos de endpoints:
    -   **TJSP:** `https://api-publica.datajud.cnj.jus.br/api_publica_tjsp/_search`
    -   **TJMG:** `https://api-publica.datajud.cnj.jus.br/api_publica_tjmg/_search`
    -   **TRF1:** `https://api-publica.datajud.cnj.jus.br/api_publica_trf1/_search`

    A lista completa pode ser encontrada em: [Endpoints DataJud](https://datajud-wiki.cnj.jus.br/api-publica/endpoints/).

## ↔️ Endpoints da API

Esta aplicação fornece os seguintes endpoints para serem consumidos pelo frontend do chat.

### `POST /api/consulta-processo`

Recebe o número de um processo judicial e retorna os dados públicos correspondentes.

**Request Body:**

```json
{
  "numeroProcesso": "NNNNNNN-DD.AAAA.J.TR.OOOO"
}
```

**Exemplo de Requisição (usando cURL):**

```bash
curl -X POST http://localhost:3000/api/consulta-processo \
-H "Content-Type: application/json" \
-d '{
  "numeroProcesso": "0012345-67.2024.8.26.0001"
}'
```

**Exemplo de Resposta de Sucesso (Status 200):**

```json
{
  "sucesso": true,
  "dados": {
    "numeroProcesso": "0012345-67.2024.8.26.0001",
    "classe": "Procedimento Comum Cível",
    "assunto": "Acidente de Trânsito",
    "dataDistribuicao": "2024-03-15T10:30:00Z",
    "orgaoJulgador": "1ª Vara Cível do Foro Regional I - Santana",
    "tribunal": "TJSP",
    "movimentos": [
      {
        "data": "2024-06-20T14:00:00Z",
        "descricao": "Conclusos para Despacho"
      },
      {
        "data": "2024-05-10T11:25:00Z",
        "descricao": "Juntada de Petição"
      }
    ]
  }
}
```

**Exemplo de Resposta de Erro (Status 404 - Não Encontrado):**
```json
{
  "sucesso": false,
  "mensagem": "Processo não encontrado ou informações não disponíveis publicamente."
}
```

## 👨‍💻 Lógica da Consulta no DataJud

A API do DataJud utiliza uma sintaxe de consulta baseada no Elasticsearch. Para buscar por um número de processo, o backend deve:

1.  Extrair a sigla do tribunal do número do processo (ex: `8.26` -> `TJSP`).
2.  Montar a URL do endpoint correta.
3.  Enviar uma requisição `POST` com a `Authorization: APIKey [SUA_CHAVE]` no cabeçalho.
4.  Enviar um corpo (body) no formato JSON, especificando a consulta:

    ```json
    {
      "query": {
        "match": {
          "numeroProcesso": "00123456720248260001"
        }
      }
    }
    ```
    > **Importante:** O número do processo na query deve ser enviado **sem pontos ou hifens**.

## 🤝 Contribuições

Contribuições são bem-vindas! Se você tem sugestões para melhorar este projeto, por favor, abra uma *issue* ou envie um *pull request*.

1.  Faça um *fork* do projeto.
2.  Crie uma nova *branch* (`git checkout -b feature/sua-feature`).
3.  Faça o *commit* de suas mudanças (`git commit -m 'Adiciona nova feature'`).
4.  Faça o *push* para a *branch* (`git push origin feature/sua-feature`).
5.  Abra um *Pull Request*.

## 📄 Licença

Este projeto está sob a licença [MIT](https://choosealicense.com/licenses/mit/).

---
Feito com ❤️ por [Seu Nome/Nome da Empresa]