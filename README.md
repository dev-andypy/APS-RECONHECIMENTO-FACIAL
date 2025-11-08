# APS Reconhecimento Facial

## Descrição
Este projeto implementa um **Sistema de Reconhecimento Facial** para controle de acesso biométrico. O objetivo principal é permitir o cadastro e verificação de acesso de usuários com base em diferentes níveis de segurança. Ele foi desenvolvido para ser utilizado pelo **Ministério do Meio Ambiente**.

## Funcionalidades Principais
- **Cadastro de Rosto**: Os usuários podem cadastrar seus perfis biométricos faciais incluindo nome e nível de acesso.
- **Verificação de Acesso**: O sistema verifica o rosto do usuário e concede ou nega acesso baseado no cadastro biométrico.
- **Logs de Acesso**: Registra logs de acessos bem-sucedidos e negados em um banco de dados.

## Tecnologias Utilizadas
- **Frontend**: React com TypeScript
- **Reconhecimento Facial**: Biblioteca [face-api.js](https://github.com/justadudewhohacks/face-api.js) para detecção e descrição facial.
- **Banco de Dados**: Supabase (para autenticação e armazenamento de dados biométricos).
- **Estilização**: Tailwind CSS.

## Fluxo de Funcionamento

### 1. **Cadastro de Rosto**
- Os usuários acessam a página de cadastro.
- Um feed de vídeo da webcam é exibido, e o rosto do usuário é detectado.
- Após a detecção, um descritor facial (vetor único que representa o rosto) é gerado e armazenado no banco de dados junto com os dados do usuário:
  1. Nome do Usuário.
  2. Nível de Acesso (1, 2 ou 3).

### 2. **Verificação de Rosto**
- O sistema ativa a câmera do usuário e utiliza o `face-api.js` para gerar o descritor facial.
- O descritor gerado é comparado com os descritores previamente cadastrados usando a **distância euclidiana**:
  - **Correspondência (Distância < 0.6)**: Acesso concedido.
  - **Não Correspondência**: Acesso negado.
- Logs da tentativa de acesso são registrados no banco de dados.

### 3. **Níveis de Acesso**
- O sistema utiliza diferentes níveis de segurança:
  - **Nível 1**: Acesso Geral.
  - **Nível 2**: Acesso restrito (exemplo: Diretoria).
  - **Nível 3**: Acesso exclusivo para alto escalão (exemplo: Ministro).

## Estrutura do Projeto

### Componentes Principais
- **FaceCamera Component**:
  - Utilizado para capturar o rosto do usuário via webcam.
  - Detecta, desenha landmarks (pontos do rosto) e obtém o descritor facial.
- **Register Page**:
  - Interface de cadastro facial.
  - Permite capturar o rosto e definir dados do usuário (nome e nível de acesso).
- **Verify Page**:
  - Interface de verificação facial.
  - Valida o rosto capturado com os dados armazenados no banco de dados.

### Banco de Dados
#### Tabela `face_registrations`
| Campo               | Tipo             | Descrição                           |
|---------------------|------------------|-------------------------------------|
| `user_id`           | **UUID**         | Identificação única do usuário.     |
| `name`              | **String**       | Nome do usuário.                    |
| `access_level`      | **Integer**      | Nível de acesso (1, 2 ou 3).        |
| `face_descriptor`   | **Array[Float]** | Vetor do descritor facial.          |

#### Tabela `access_logs`
| Campo               | Tipo             | Descrição                           |
|---------------------|------------------|-------------------------------------|
| `user_id`           | **UUID**         | Identificação única do usuário.     |
| `access_level`      | **Integer**      | Nível de acesso (1, 2 ou 3).        |
| `access_granted`    | **Boolean**      | O acesso foi concedido ou negado.   |
| `timestamp`         | **Timestamp**    | Hora em que ocorreu a tentativa.    |

## Executando o Projeto
### Pré-requisitos
- Node.js instalado.
- Conta e projeto no [Supabase](https://supabase.com/).
- Modelos da biblioteca `face-api.js` pré-carregados.

### Passos
1. **Clone o repositório**:
    ```bash
    git clone https://github.com/LeonardoFreire43/APS-RECONHECIMENTO-FACIAL.git
    cd APS-RECONHECIMENTO-FACIAL
    ```
2. **Instale as dependências**:
    ```bash
    npm install
    ```
3. **Configure as variáveis de ambiente do Supabase**:
   Crie um arquivo `.env` com as seguintes variáveis:
    ```
    REACT_APP_SUPABASE_URL=<sua-url-do-supabase>
    REACT_APP_SUPABASE_KEY=<sua-api-key-do-supabase>
    ```
4. **Inicie o projeto**:
    ```bash
    npm start
    ```

### Importante
Certifique-se de permitir o acesso à câmera no navegador e que os modelos do `face-api.js` estão acessíveis em:
```
https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model
```

## Contribuição
Contribuições são bem-vindas! Para solicitar mudanças, abra um PR ou issue neste repositório.

## Licença
Este projeto está licenciado sob a licença MIT.

#
