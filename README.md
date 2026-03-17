# 🚀 PatchPilot

Sistema de monitoramento de APIs com auto-heal inteligente, focado em detectar falhas, reagir automaticamente e fornecer visibilidade operacional em tempo real.

---

## 🧠 Visão Geral

O PatchPilot simula um sistema moderno de observabilidade inspirado em ferramentas como:

- Datadog
- New Relic
- UptimeRobot

Diferencial principal:

Auto-heal automático baseado em falhas detectadas.

---

## ⚙️ Funcionalidades

### Monitoramento
- Healthcheck automático
- Verificação contínua de APIs
- Medição de latência

### Incidentes
- Detecção de falhas
- Classificação HEALTHY / ALERT
- Histórico de eventos

### Auto-Heal
- Execução automática de comandos
- Controle de tentativas
- Sistema de cooldown
- Bloqueio após limite

### Dashboard
- Visão geral em tempo real
- Tabela operacional
- Lista de incidentes
- Gráfico de status

### Notificações
- Integração com Telegram
- Alertas automáticos

---

## 🏗️ Estrutura do Projeto

patchpilot/

src/
  app.ts
  server.ts

  routes/
    health.ts
    projects.ts
    incidents.ts
    dashboard.ts

  services/
    monitor.ts
    autoheal.ts
    telegram.ts

  lib/
    db.ts

  public/
    index.html

tests/
  health.test.ts
  projects.test.ts
  dashboard.test.ts

package.json
tsconfig.json
README.md

---

## 🔄 Fluxo do Sistema

1. API é monitorada
2. Falha detectada
3. Incidente registrado
4. Auto-heal executado
5. Tentativas controladas
6. Possível bloqueio
7. Notificação enviada
8. Dashboard atualizado

---

## 🚀 Como Rodar

cd ~/projetos
git clone SEU_REPO
cd patchpilot
npm install
npx tsx src/server.ts

---

## 🌐 Acesso

http://127.0.0.1:3000

---

## 🧪 Testes

npm test

---

## 📡 Endpoints

GET /health

GET /projects
POST /projects
GET /projects/status
POST /projects/:id/unlock

GET /incidents

GET /dashboard/overview

---

## 📊 Exemplo de Projeto

{
  "name": "api-test",
  "repoUrl": "https://github.com/test/api",
  "healthUrl": "http://127.0.0.1:3000/health",
  "command": "echo restart-service"
}

---

## 🧠 Tecnologias

- Node.js
- TypeScript
- Express
- Jest
- Supertest
- HTML / CSS

---

## 🔐 Lógica de Auto-Heal

- Limite de tentativas
- Cooldown entre execuções
- Bloqueio automático
- Registro completo de ações

---

## 📈 Status

- Backend funcional
- Monitoramento ativo
- Auto-heal funcionando
- Dashboard completo
- Telegram integrado
- Testes básicos implementados

---

## 💡 Evoluções Futuras

- Autenticação (JWT)
- Multi-usuário (SaaS)
- Deploy em nuvem
- Persistência avançada
- Métricas de uptime
- WebSocket tempo real

---

## 👨‍💻 Autor

Renan Borges

GitHub:
https://github.com/borgesrenan263-creator

LinkedIn:
https://www.linkedin.com/in/renan-borges-790b33195

---

## 🎯 Objetivo

Projeto criado para demonstrar:

- Backend real
- Arquitetura de sistemas
- Monitoramento e observabilidade
- Automação inteligente

---

## 🧠 Diferencial

Este projeto demonstra:

- lógica de produção
- resiliência
- automação real
- pensamento de sistema

---

PatchPilot = monitoramento + ação automática

