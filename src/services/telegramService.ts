const BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
const CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID;

if (!BOT_TOKEN || !CHAT_ID) {
  console.error('Telegram bot token or chat ID is not defined in environment variables.');
  // You might want to throw an error here or handle it in a way that doesn't break the app
}


interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export const sendMessage = async (formData: FormData): Promise<boolean> => {
  const { name, email, subject, message } = formData;
  const text = `
    Một lời nhắn mới ở pofolio:
    -----------------------------------
    Họ và tên: ${name}
    Email: ${email}
    Chủ đề: ${subject}
    -----------------------------------
    Lời nhắn:
    ${message}
  `;

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: text,
        parse_mode: 'Markdown',
      }),
    });

    const data = await response.json();
    return data.ok;
  } catch (error) {
    console.error('Error sending message to Telegram:', error);
    return false;
  }
};
