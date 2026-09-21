# Afrinex Monorepo

> The modern toolkit for integrating Kenyan payments (M-Pesa and KCB) and building Conversational AI Financial Assistants.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

---

## 🌍 The Afrinex Mission

Building financial technology in Kenya has often meant dealing with fragmented APIs, inconsistent documentation, and complex integration flows. The **Afrinex** ecosystem exists to solve this problem by abstracting away the complexity of integrating with Safaricom Daraja (M-Pesa) and KCB Buni.

But we didn't stop at just building an SDK. We integrated the latest in Large Language Models (LLMs) and Graph architectures (LangGraph) to bring **Conversational Finance** to life, allowing users to interact with their accounts using natural language.

---

## 📦 Packages in this Repository

This repository is a monorepo containing the following packages. Click on the package names to read their comprehensive documentation and integration guides.

### 1. [afrinex (SDK)](./packages/afrinex-sdk/README.md)
The core unified SDK. It wraps both Daraja and Buni behind a single, consistent interface.
- **Key Features**: Dynamic provider registry, unified DTOs, standard webhook parser, strongly-typed errors.
- **Perfect for**: Traditional Node.js applications that need reliable, clean M-Pesa or KCB integration.

### 2. [@afrinex/agent (AI Agent)](./packages/afrinex-agent/README.md)
An add-on package that provides a LangGraph-powered AI Agent. 
- **Key Features**: Understands natural language to perform financial transactions, stateful memory, and built-in Human-In-The-Loop (HITL) safety boundaries to prevent unauthorized large transfers.
- **Perfect for**: Building AI chatbots, Telegram bots, or WhatsApp bots that can securely manage mobile money and bank accounts.

---

## 🛠️ Repository Structure

```text
afrinex/
├── packages/
│   ├── afrinex-sdk/      # The core unified payments SDK
│   └── afrinex-agent/    # The LangGraph-powered AI conversational agent
├── package.json          # Root configuration for monorepo
└── README.md             # This file
```

---

## 🚀 Getting Started for Developers

If you want to use the packages in your project, install them directly from npm:

```bash
npm install afrinex @afrinex/agent
```

If you want to **clone, fork, or contribute** to this monorepo, follow these steps:

### 1. Clone the repository
```bash
git clone https://github.com/Red-misst/afrinex.git
cd afrinex
```

### 2. Install dependencies
This project uses workspace management (npm/yarn/pnpm workspaces). Run the install command at the root level.
```bash
npm install
```

### 3. Build all packages
```bash
npm run build --workspaces
```

### 4. Running Tests
Each package has its own test suite powered by `vitest`.
```bash
npm run test --workspaces
```

*(Note: To run integration tests successfully, you will need to set up a `.env` file in each package with your respective Daraja/Buni sandbox credentials).*

---

## 🤝 Contributing

We welcome contributions! Whether you want to add a new provider (like Airtel Money or Equity Bank) to the SDK, or build a new Tool for the AI Agent, your pull requests are welcome. 

Please refer to the specific **Guide for Contributors & Forking** section in each package's README for detailed instructions on how to extend the codebase:
- [SDK Contributor Guide](./packages/afrinex-sdk/README.md#%EF%B8%8F-guide-for-contributors--forking)
- [Agent Contributor Guide](./packages/afrinex-agent/README.md#%EF%B8%8F-guide-for-contributors--forking)

---

## 📜 License

MIT © [Isaac Muigai](https://github.com/Red-misst)
