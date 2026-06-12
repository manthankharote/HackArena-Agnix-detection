const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

let initStatus = 'Not started';
let lastError = null;
let qrCode = null;
let isReady = false;
let messageQueue = [];

// Initialize WhatsApp Client with LocalAuth so session is saved
const puppeteerArgs = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage'
];

// Avoid single-process and other unstable flags on Windows to prevent "Navigating frame was detached" error
if (process.platform !== 'win32') {
    puppeteerArgs.push(
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process'
    );
}

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        args: puppeteerArgs,
    }
});

client.on('qr', (qr) => {
    initStatus = 'qr_ready';
    qrCode = qr;
    console.log('[SYSTEM] WhatsApp QR Code generated. Please scan to authenticate:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('[SYSTEM] WhatsApp Client is ready!');
    isReady = true;
    initStatus = 'ready';
    qrCode = null;
    console.log('[WHATSAPP] ✅ Client ready! Queue will be flushed in next 5s cycle.');
});

client.on('authenticated', () => {
    initStatus = 'authenticated';
    console.log('[SYSTEM] WhatsApp Client authenticated successfully.');
});

client.on('auth_failure', msg => {
    console.error('[ERROR] WhatsApp Authentication failure:', msg);
    isReady = false;
    initStatus = 'auth_failure';
    lastError = msg;
});

client.on('disconnected', (reason) => {
    console.log('[SYSTEM] WhatsApp Client disconnected:', reason);
    isReady = false;
    initStatus = 'disconnected';
});

// Initialize client immediately with error handling
console.log('[SYSTEM] Initializing WhatsApp Client...');
initStatus = 'initializing';
client.initialize().catch(err => {
    console.error('[ERROR] Failed to initialize WhatsApp Client:', err);
    initStatus = 'failed';
    lastError = err.message || err;
});

setInterval(async () => {
    if (!isReady || messageQueue.length === 0) {
        if (!isReady && messageQueue.length > 0) {
            console.log(`[WHATSAPP QUEUE] Client not ready. ${messageQueue.length} message(s) waiting...`);
        }
        return;
    }
    console.log(`[WHATSAPP QUEUE] Processing ${messageQueue.length} queued message(s)...`);
    const toSend = [...messageQueue];
    messageQueue = [];
    for (const item of toSend) {
        try {
            let cleaned = item.phoneNumber.replace(/\D/g, '');
            if (cleaned.length === 10) {
                cleaned = '91' + cleaned;
            }
            const formatted = cleaned.includes('@c.us') ? cleaned : `${cleaned}@c.us`;
            await client.sendMessage(formatted, item.message);
            console.log(`[WHATSAPP QUEUE] ✅ Sent to ${item.phoneNumber}`);
        } catch (err) {
            console.error(`[WHATSAPP QUEUE] ❌ Failed to send to ${item.phoneNumber}:`, err.message);
        }
    }
}, 5000);

/**
 * Checks if the WhatsApp client is authenticated and ready to send messages
 * @returns {boolean}
 */
const isWhatsAppReady = () => {
    return isReady;
};

/**
 * Sends a WhatsApp message to a specific phone number
 * @param {string} phoneNumber - The phone number (e.g. "91XXXXXXXXXX")
 * @param {string} message - The message payload
 */
const sendWhatsAppAlert = async (phoneNumber, message) => {
    if (!phoneNumber) {
        console.warn('[WHATSAPP] ⚠ No phone number provided, skipping.');
        return;
    }
    messageQueue.push({ phoneNumber, message });
    console.log(`[WHATSAPP] Message queued for ${phoneNumber}. Queue size: ${messageQueue.length}`);

    if (isReady) {
        try {
            let cleaned = phoneNumber.replace(/\D/g, '');
            if (cleaned.length === 10) {
                cleaned = '91' + cleaned;
            }
            const formatted = cleaned.includes('@c.us') ? cleaned : `${cleaned}@c.us`;
            await client.sendMessage(formatted, message);
            messageQueue.pop();
            console.log(`[WHATSAPP] ✅ Sent immediately to ${phoneNumber}`);
        } catch (error) {
            console.error(`[WHATSAPP] ❌ Immediate send failed, will retry via queue: ${error.message}`);
        }
    } else {
        console.log(`[WHATSAPP] Client not ready — message queued, will send when ready.`);
    }
};

const resetWhatsApp = async () => {
    try {
        console.log('[SYSTEM] Resetting WhatsApp Client...');
        initStatus = 'resetting';
        isReady = false;
        qrCode = null;
        
        try {
            await client.destroy();
        } catch (destroyErr) {
            console.warn('[WHATSAPP] Warning during client destroy:', destroyErr.message);
        }

        const fs = require('fs');
        const path = require('path');
        const sessionDir = path.join(__dirname, '../.wwebjs_auth');
        if (fs.existsSync(sessionDir)) {
            fs.rmSync(sessionDir, { recursive: true, force: true });
            console.log('[SYSTEM] WhatsApp session folder deleted.');
        }

        // Re-initialize client
        initStatus = 'initializing';
        client.initialize().catch(err => {
            console.error('[ERROR] Failed to re-initialize WhatsApp Client:', err);
            initStatus = 'failed';
            lastError = err.message || err;
        });

        return { success: true, message: 'WhatsApp session cleared and client is re-initializing.' };
    } catch (error) {
        console.error('[ERROR] Reset WhatsApp failed:', error);
        initStatus = 'failed';
        lastError = error.message;
        return { success: false, error: error.message };
    }
};

const getQueueLength = () => {
    return messageQueue.length;
};

const getWhatsAppStatus = () => {
    return {
        isReady,
        initStatus,
        qrCode,
        lastError,
        queueLength: messageQueue.length
    };
};

module.exports = {
    isWhatsAppReady,
    sendWhatsAppAlert,
    getQueueLength,
    getWhatsAppStatus,
    resetWhatsApp
};
