# 🤖 Fricab Xpress - Asistente Virtual para Telegram

Este es un bot de Telegram construido con Node.js que actúa como asistente virtual y vendedor para **Fricab Xpress**, una empresa de abastecimiento en Riberalta. Utiliza la inteligencia artificial de OpenAI (GPT-3.5-turbo) para ofrecer respuestas amigables, guiar a los clientes y brindar información precisa sobre el catálogo de productos.

## ✨ Características

* **Integración nativa:** Comunicación fluida con Telegram mediante la librería `node-telegram-bot-api`.
* **Cerebro de IA:** Respuestas generadas por OpenAI a través de peticiones HTTP con `axios`.
* **Comportamiento de ventas avanzado:** El prompt del sistema está diseñado para evitar el "vaciado de datos" (data dumping), priorizando la interacción y consultando las necesidades del cliente.
* **Experiencia de Usuario (UX):** Implementación de retrasos asíncronos (`sleep`) y simulación de escritura (`typing`) para una interacción más natural y humana.
* **Seguridad:** Manejo seguro de credenciales mediante variables de entorno (`dotenv`).

## 🛠️ Requisitos Previos

Antes de ejecutar este proyecto, asegúrate de tener instalado y configurado lo siguiente:
* [Node.js](https://nodejs.org/) (Versión 18 o superior).
* Un **Token de Telegram**, obtenido a través de [@BotFather](https://t.me/botfather).
* Una **API Key de OpenAI**, obtenida desde [platform.openai.com](https://platform.openai.com/).

## 🚀 Instalación y Configuración

1. **Clonar el repositorio:**
   Si estás usando PowerShell o cualquier otra terminal, ejecuta:
   ```bash
   git clone [https://github.com/TU_USUARIO_DE_GITHUB/chattelegram.git](https://github.com/TU_USUARIO_DE_GITHUB/chattelegram.git)
   cd chattelegram