# PatchPilot

PatchPilot é um backend SaaS de monitoramento de APIs com detecção de incidentes e auto-heal automático.

O sistema monitora serviços, identifica falhas de disponibilidade, cria incidentes automaticamente, executa comandos de recuperação e expõe tudo em um dashboard visual com atualização periódica.

---

## Visão geral

O objetivo do PatchPilot é simular uma plataforma de observabilidade operacional com foco em:

- monitoramento de healthcheck
- gerenciamento de incidentes
- execução de auto-heal
- dashboard operacional
- testes automatizados
- arquitetura modular
- deploy em produção

Hoje o projeto já roda com:

- monitor automático
- incidentes persistidos em arquivo
- auto-heal manual e automático
- cooldown para evitar spam de execução
- dashboard visual estilo startup
- testes cobrindo fluxos principais

---

## Principais funcionalidades

### Monitoramento de projetos
Cada projeto pode ser cadastrado com:

- nome
- repositório
- URL de healthcheck
- comando de auto-heal

O sistema acompanha o status de cada serviço e marca como:

- `healthy`
- `alert`

### Incidentes automáticos
Quando um healthcheck falha, o sistema:

1. detecta a falha
2. cria um incidente automaticamente
3. persiste o incidente
4. expõe o estado no dashboard

### Auto-heal manual
É possível disparar auto-heal manualmente por endpoint, executando o comando configurado no projeto e registrando o resultado da execução.

### Auto-heal automático
O monitor automático verifica os projetos em loop e, ao detectar falha:

1. cria incidente se ainda não existir um aberto
2. tenta executar o comando de recuperação
3. salva stdout, stderr, erro e horário
4. aplica cooldown para evitar execuções repetidas em sequência

### Dashboard operacional
A interface web mostra:

- total de projetos
- APIs saudáveis
- APIs em alerta
- auto-heals registrados
- lista de projetos monitorados
- incidentes recentes
- distribuição healthy vs alert
- status executivo do ambiente

### Testes automatizados
O projeto possui testes cobrindo:

- health
- projects
- incidents
- dashboard
- auto-heal

---

## Stack utilizada

### Backend
- Node.js
- TypeScript
- Express

### Testes
- Jest
- ts-jest
- Supertest

### Frontend
- HTML
- CSS
- JavaScript

### Execução e desenvolvimento
- tsx
- Termux
- mobile-first workflow

### Deploy
- Render

---

## Arquitetura

O projeto segue uma arquitetura modular por domínio.

```text
PatchPilot
├── src
│   ├── app.ts
│   ├── server.ts
│   ├── lib
│   │   ├── db.ts
│   │   └── executor.ts
│   ├── data
│   │   ├── projects.json
│   │   └── incidents.json
│   ├── modules
│   │   ├── health
│   │   │   └── health.routes.ts
│   │   ├── projects
│   │   │   ├── projects.controller.ts
│   │   │   ├── projects.routes.ts
│   │   │   └── projects.schema.ts
│   │   ├── incidents
│   │   │   ├── incidents.controller.ts
│   │   │   ├── incidents.routes.ts
│   │   │   └── incidents.schema.ts
│   │   └── dashboard
│   │       ├── dashboard.controller.ts
│   │       └── dashboard.routes.ts
│   ├── services
│   │   └── autoheal.service.ts
│   └── public
│       ├── index.html
│       ├── styles.css
│       └── app.js
├── tests
│   ├── setup.ts
│   ├── health.test.ts
│   ├── projects.test.ts
│   ├── incidents.test.ts
│   ├── dashboard.test.ts
│   └── autoheal.test.ts
├── package.json
├── jest.config.cjs
└── README.md

Papel de cada camada
src/app.ts
Configura o Express, middlewares, arquivos estáticos e registra rotas.
src/server.ts
Inicializa o servidor HTTP e sobe o monitor automático.
src/lib/db.ts
Camada simples de persistência baseada em arquivo JSON para projetos e incidentes.
src/lib/executor.ts
Responsável por executar comandos de auto-heal usando child_process.exec.
src/services/autoheal.service.ts
Coração do monitor automático. Faz:
healthcheck periódico
abertura automática de incidente
tentativa de auto-heal
atualização de status
cooldown de execução
src/modules/projects
Gerencia o cadastro e listagem de projetos monitorados.
src/modules/incidents
Gerencia criação, consulta, resolução e disparo manual de auto-heal em incidentes.
src/modules/dashboard
Consolida as informações do sistema em um endpoint para o dashboard.
src/public
Frontend leve e direto consumindo /dashboard/overview e /projects.
tests
Cobertura automatizada dos fluxos principais do sistema.
Fluxo de funcionamento
1. Cadastro do projeto
Um projeto é criado com nome, health URL e comando opcional de recuperação.
2. Monitoramento automático
O serviço roda em loop verificando o healthcheck de todos os projetos cadastrados.
3. Falha detectada
Se um healthcheck falhar:
o projeto entra em alert
um incidente é criado se não houver outro aberto
4. Auto-heal
Se houver comando configurado:
o PatchPilot executa o comando
registra o resultado
evita repetição imediata via cooldown
5. Resolução
Se o healthcheck voltar a responder:
o incidente aberto é resolvido automaticamente
o projeto volta para healthy
6. Exibição no dashboard
O dashboard mostra o retrato atual do ambiente com visão resumida e detalhada.
Endpoints
Health
GET /health
Retorna status básico da API.
Projects
GET /projects
Lista todos os projetos cadastrados.
POST /projects
Cria um novo projeto.
Exemplo de body:
JSON
{
  "name": "api-auto",
  "repoUrl": "https://github.com/test/api-auto",
  "healthUrl": "http://127.0.0.1:3999/health",
  "command": "echo fix-applied"
}
Incidents
GET /incidents
Lista todos os incidentes.
GET /incidents/open
Lista apenas incidentes abertos.
POST /incidents
Cria um incidente manualmente.
Exemplo de body:
JSON
{
  "projectId": "123",
  "message": "API OFFLINE"
}
PATCH /incidents/:id/resolve
Resolve um incidente.
POST /incidents/:id/auto-heal
Executa auto-heal manual para o incidente informado.
Dashboard
GET /dashboard/overview
Retorna o resumo consolidado para a interface.
Inclui:
summary
projects
incidents
Como rodar localmente
1. Entrar no projeto
Bash
cd ~/projetos/patchpilot
2. Instalar dependências
Bash
npm install
3. Rodar em desenvolvimento
Bash
npm run dev
ou
Bash
npx tsx src/server.ts
4. Abrir no navegador
Plain text
http://127.0.0.1:3000
Como rodar os testes
Bash
npx jest --runInBand
Atualmente o projeto já possui suíte cobrindo:
health routes
projects routes
incidents routes
dashboard overview
auto-heal flow
Fluxo de teste manual do auto-heal
Criar projeto com falha proposital
Bash
curl -X POST http://127.0.0.1:3000/projects \
  -H "Content-Type: application/json" \
  -d '{"name":"api-auto","repoUrl":"https://github.com/test/api-auto","healthUrl":"http://127.0.0.1:3999/health","command":"echo fix-applied"}'
Verificar incidentes
Bash
curl http://127.0.0.1:3000/incidents
Verificar dashboard
Bash
curl http://127.0.0.1:3000/dashboard/overview
Se o monitor automático estiver ativo, o sistema deve:
criar incidente
executar auto-heal
registrar saída
entrar em cooldown
Deploy
O projeto foi preparado para deploy no Render.
Comportamento em produção
usa process.env.PORT
sobe com 0.0.0.0
roda monitor automático após iniciar servidor
Exemplo de start command
Bash
npx tsx src/server.ts
Status atual do projeto
Já implementado
backend modular
file db
monitor automático
auto-heal manual
auto-heal automático
cooldown
resolução automática de incidente
dashboard visual
testes automatizados
deploy no Render
workflow com Git + SSH no Termux
Em evolução
logs históricos mais ricos
estratégias reais de recuperação
autenticação
multi-usuário
persistência em banco relacional
observabilidade mais completa
Roadmap
Fase 1
base do backend
projetos e health
Fase 2
testes nível médio
incidents e dashboard alinhados
Fase 3
auto-heal real via execução de comandos
testes do fluxo de recuperação
Fase 4
monitor automático
criação automática de incidentes
cooldown sem multiplicação de loops
Fase 5
hiper UI profissional
dashboard visual estilo startup
Próximas fases possíveis
histórico de logs
autenticação
multi-tenant
integração com Telegram
engine de estratégia de recuperação
IA para sugerir comandos de remediação
Destaques técnicos
Este projeto demonstra na prática:
construção de API com TypeScript e Express
organização modular por domínio
persistência simples funcional
execução de comandos controlada
automação de recuperação
design de fluxo de incidentes
escrita de testes automatizados
deploy em nuvem
desenvolvimento mobile via Termux
Sobre o desenvolvimento
O PatchPilot foi desenvolvido com fluxo mobile-first usando:
Android
Termux
Node.js
GitHub
Render
Esse contexto reforça adaptação, consistência de entrega e capacidade de construir software funcional mesmo em ambiente restrito.
Autor
Renan Borges
GitHub: https://github.com/borgesrenan263-creator
LinkedIn: https://www.linkedin.com/in/renan-borges-790b33195
Email: borgesrenan263@gmail.com
Resumo final
PatchPilot é um projeto de backend com foco em monitoramento e remediação automática.
Mais do que um CRUD, ele demonstra:
arquitetura
testes
observabilidade
automação
execução real de recovery
deploy funcional
É um projeto pensado para portfólio forte de backend júnior com pegada de produto SaaS.
