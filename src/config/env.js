require('dotenv').config();

module.exports = {
    telegram: {
        token: process.env.TELEGRAM_TOKEN
    },
    openai: {
        apiKey: process.env.OPENAI_API_KEY
    },
    supabase: {
        url: process.env.SUPABASE_URL,
        key: process.env.SUPABASE_KEY
    },
    server: {
        port: process.env.PORT || 3000
    }
};