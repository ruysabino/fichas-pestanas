# ✦ Fichas de Anamnese · Extensão de Pestanas

Sistema web para preenchimento e impressão de fichas de anamnese para **Extensão de Pestanas**.

---

## ✨ Funcionalidades

| Recurso | Detalhe |
|---|---|
| 👁️ Ficha completa de anamnese | Todos os campos do formulário de pré-atendimento |
| 💾 Armazenamento local | IndexedDB — dados nunca saem do dispositivo |
| 🔐 Autenticação segura | PBKDF2 (310k iterações) + AES-GCM |
| 🖨️ Impressão / PDF | Layout optimizado para A4 via browser |
| 📤 Backup cifrado | Exportar e restaurar ficheiro `.brb` com senha |
| 📜 Relatório RGPD | Exportação auditável (Art. 30.º do RGPD) |
| 📱 Responsivo | Funciona em tablet e telemóvel |
| ✈️ Offline | Funciona sem internet após primeiro carregamento |

---

## 📋 Campos da Ficha

- **Dados pessoais** — Nome, data de nascimento, telefone/WhatsApp, Instagram
- **Alergias** — Látex, acrilatos, colas, patches, reações prévias a extensões
- **Saúde ocular** — Doenças crónicas, colírio, cirurgia ocular, fotofobia, lentes de contacto
- **Saúde geral** — Tratamento dermatológico, gravidez/amamentação
- **Hábitos** — Maquiagem, esfregar olhos, natação
- **Histórico** — Extensões anteriores, duração, pestana desejada (Natural/Volumoso/Boneca/Gatinho)
- **Consentimento** — Declaração, autorização de imagem, assinatura digital

---

## 🚀 Como usar

### 1. Aceder ao site
Abra o link do GitHub Pages no browser (Chrome ou Edge recomendado).

### 2. Configuração inicial
Na primeira abertura, crie a conta de administrador e o nome do estúdio.

### 3. Nova ficha
Clique em **Nova Ficha**, preencha todos os campos e clique em **Guardar Ficha**.

### 4. Imprimir / PDF
Na listagem, clique em **Ver / Imprimir** e depois:
- Selecione **Guardar como PDF** como destino
- Formato: **A4 · Vertical**
- Active **"Gráficos de fundo"** para preservar o layout
- Clique **Guardar**

---

## 📁 Estrutura de ficheiros

```
fichas-pestanas/
├── index.html       ← Aplicação principal
├── style.css        ← Estilos (interface + impressão)
├── app.js           ← Lógica da aplicação
├── db.js            ← Camada IndexedDB
├── security.js      ← Autenticação e cifra AES-GCM
├── README.md        ← Este ficheiro
└── assets/
    └── favicon.svg  ← Ícone vectorial
```

---

## 🌐 Deploy no GitHub Pages

1. Vá a **Settings → Pages**
2. Source: **Deploy from branch → main → / (root)**
3. Clique **Save**
4. Aguarde 1–2 minutos

---

## 🔒 Privacidade · RGPD

- Nenhum dado é enviado para servidores externos
- Todo o processamento ocorre localmente no browser
- Os dados de saúde são tratados com base no consentimento explícito (Art. 9.º do RGPD)
- Backup cifrado com AES-GCM 256-bit

---

🛠️ HTML5 · CSS3 · JavaScript ES6+ · Sem frameworks · Sem dependências · Sem instalação
