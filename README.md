# PatchPilot

PatchPilot é um projeto backend-first de monitoramento e auto-heal para APIs. A proposta é observar múltiplos serviços, detectar falhas, registrar incidentes, tentar recuperação automática e expor o estado operacional em um dashboard visual.

O projeto foi construído como demonstração prática de backend moderno com TypeScript, Express, PostgreSQL, testes automatizados e foco em arquitetura modular.

---

## Visão do produto

O PatchPilot foi pensado como a base de um SaaS técnico. Em vez de ser apenas um painel visual, ele já possui lógica de monitoramento, classificação de falhas, registro de incidentes, tentativas de auto-heal e visualização operacional.

Hoje o sistema já permite:

- cadastrar múltiplas APIs para monitoramento
- medir integridade e latência
- detectar falhas como API offline e connection refused
- registrar incidentes automaticamente
- tentar ações de auto-heal
- exibir tudo em um dashboard com severidade, status e recuperação
- validar partes importantes por testes automatizados

---

## Stack utilizada

### Backend
- Node.js
- TypeScript
- Express

### Banco de dados
- PostgreSQL

### Observabilidade e monitoramento
- Health checks periódicos
- Registro de incidentes
- Registro de tentativas de auto-heal

### Frontend do dashboard
- HTML
- CSS
- JavaScript vanilla

### Testes
- Jest
- Supertest

---

## Estrutura do projeto

```text
src/
├── app.ts
├── server.ts
├── lib/
│   ├── db.ts
│   └── env.ts
├── modules/
│   ├── dashboard/
│   ├── health/
│   ├── incidents/
│   ├── projects/
│   └── status/
├── services/
│   ├── autoheal-log.service.ts
│   ├── autoheal.service.ts
│   ├── health.service.ts
│   ├── metrics.service.ts
│   └── monitor.service.ts
├── public/
│   ├── app.js
│   ├── index.html
│   └── styles.css
└── types/
    └── node-fetch.d.ts

tests/
├── dashboard.test.ts
├── health.test.ts
└── projects.test.ts
Explicação da arquitetura
app.ts
Define a aplicação Express, middlewares e rotas. É o ponto central da API sem assumir diretamente o ciclo de execução do monitor.
server.ts
Responsável por subir o servidor HTTP e iniciar o monitor periódico quando o ambiente não está em modo de teste.
lib/db.ts
Centraliza a conexão com PostgreSQL via Pool, permitindo reutilização simples em controllers e services.
lib/env.ts
Agrupa leitura das variáveis de ambiente.
modules/
Cada módulo concentra sua responsabilidade:
health: rota simples de verificação da própria API
projects: cadastro e listagem de APIs monitoradas
incidents: leitura e gestão de incidentes
status: visão operacional resumida
dashboard: endpoint agregado para o frontend do painel
services/
Camada de regras do sistema:
health.service.ts: executa probe e classifica falhas
monitor.service.ts: roda o ciclo de monitoramento
autoheal.service.ts: decide e executa tentativa de recuperação
autoheal-log.service.ts: registra histórico de auto-heal
metrics.service.ts: salva métricas das verificações
public/
Frontend do dashboard, responsável pela visualização do estado do sistema:
cards de resumo
gráfico circular
projetos monitorados
tabela operacional
alertas visuais
status de recuperação
Principais funcionalidades
1. Monitoramento contínuo
O sistema percorre os projetos cadastrados e executa health checks periódicos. Cada verificação mede latência, avalia o código HTTP e registra métricas.
2. Classificação de falhas
O motor de health diferencia cenários como:
healthy
connection_refused
unreachable
timeout
http_404
http_500
http_502_503_504
auth/config errors
Isso permite que o sistema trate problemas de forma mais inteligente.
3. Registro de incidentes
Sempre que um serviço falha, o PatchPilot abre um incidente correspondente. Quando o serviço volta ao normal, o incidente pode ser resolvido automaticamente.
4. Auto-heal
Ao detectar falha, o sistema tenta executar estratégias de recuperação. Atualmente já existe estrutura para:
comando customizado por projeto
fallback por tipo de falha
log da tentativa
recheck após a tentativa
5. Dashboard operacional
O painel mostra:
total de projetos
APIs saudáveis
APIs em alerta
total de auto-heals registrados
gráfico healthy vs alert
cards individuais por projeto
severidade visual
falha humanizada
tempo desde a última verificação
último auto-heal executado
tabela operacional
6. Testes
O projeto já possui testes básicos cobrindo:
health endpoint
routes de projects
dashboard overview
Os testes foram desacoplados do banco real com mocks, o que melhora previsibilidade e estabilidade.
Fluxo resumido do monitor
O projeto é cadastrado com nome, repositório, URL de health e comando opcional de auto-heal.
O monitor executa probes periódicos.
Se a API responde normalmente:
registra métrica
resolve incidente aberto, se existir
Se a API falha:
registra métrica
classifica a falha
cria incidente
tenta auto-heal
faz recheck
O dashboard reflete o estado atual de cada projeto.
Endpoints principais
Health
Http
Copiar código
GET /health
Exemplo de uso:
Bash
Copiar código
curl http://127.0.0.1:3000/health
Projects
Http
Copiar código
GET /projects
POST /projects
Exemplo de criação:
Bash
Copiar código
curl -X POST http://127.0.0.1:3000/projects \
-H "Content-Type: application/json" \
-d '{
  "name": "api-teste",
  "repoUrl": "https://github.com/test/api",
  "healthcheckUrl": "http://127.0.0.1:3000/health"
}'
Dashboard
Http
Copiar código
GET /dashboard/overview
Exemplo:
Bash
Copiar código
curl http://127.0.0.1:3000/dashboard/overview
Como rodar localmente
1. Instalar dependências
Bash
Copiar código
npm install
2. Criar arquivo .env
Exemplo:
Environment
Copiar código
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://SEU_USUARIO@localhost:5432/patchpilot?schema=public
3. Rodar o servidor
Bash
Copiar código
npm run dev
4. Abrir o dashboard
Plain text
Copiar código
http://127.0.0.1:3000/
Como rodar testes
Typecheck
Bash
Copiar código
npm run typecheck
Testes
Bash
Copiar código
npm test
Testes específicos
Bash
Copiar código
npm test -- tests/projects.test.ts tests/dashboard.test.ts
O que os testes atuais validam
health.test.ts
Garante que a rota /health responde corretamente.
projects.test.ts
Valida listagem de projetos e rejeição de payload inválido.
dashboard.test.ts
Valida retorno do overview do dashboard com summary e projects.
Esses testes já representam uma base sólida de segurança para evoluir o projeto.
Diferenciais técnicos do projeto
Este projeto não é apenas um CRUD com dashboard. Ele já demonstra várias competências reais de backend:
separação entre módulos, serviços e infraestrutura
monitoramento ativo
classificação de falhas
tentativa de recuperação
dashboard com leitura operacional
testes desacoplados de banco real
foco em comportamento do sistema e não só em interface
Estado atual do projeto
No estágio atual, o PatchPilot já possui:
backend funcional em TypeScript
integração com PostgreSQL
monitoramento de múltiplas APIs
incidentes automáticos
tentativas de auto-heal
dashboard visual funcional
testes básicos passando para health, projects e dashboard com mock
Roadmap de evolução
Próximos passos pensados para o projeto:
Curto prazo
expandir testes para nível médio
melhorar logs de auto-heal
padronizar métricas e severidade
melhorar UX da tabela operacional em mobile
Médio prazo
auto-heal real com comandos seguros
recheck mais inteligente
histórico temporal de incidentes
filtros por status e severidade
Longo prazo
autenticação e multi-tenant
deploy em nuvem
alertas externos (email, WhatsApp, Discord)
billing por projeto monitorado
papel de operador / administrador
dashboard com histórico e gráficos temporais
Objetivo profissional do projeto
O PatchPilot foi desenvolvido como projeto de portfólio para demonstrar capacidade prática em:
backend com Node.js e TypeScript
arquitetura modular
integração com banco relacional
monitoramento de serviços
automação de remediação
construção de produto técnico com visão SaaS
testes automatizados
Autor
Renan Borges
GitHub: https://github.com/borgesrenan263-creator⁠�
LinkedIn: https://www.linkedin.com/in/renan-borges-790b33195⁠�
Email: borgesrenan263@gmail.com
Observação final
O PatchPilot representa uma base de produto técnico com foco em confiabilidade operacional. Mesmo em estágio inicial, já evidencia raciocínio de backend real, observabilidade, automação e testes — áreas que costumam diferenciar projetos comuns de projetos que realmente chamam atenção em processos seletivos. EOF
