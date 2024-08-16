const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const fetch = require("node-fetch");

// Format harga ke IDR
const formatPrice = (price) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
  }).format(price);

const client = new Client({
  authStrategy: new LocalAuth(),
});

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
  console.log("QR Code received, please scan it.");
});

client.on("authenticated", () => {
  console.log("Authenticated successfully");
});

client.on("message", async (msg) => {
  if (!msg.body.startsWith("/p ")) return;

  const crypto = msg.body.slice(3).trim().toLowerCase();
  if (!crypto) {
    msg.reply("Please provide a cryptocurrency code after /p. Example: /p btc");
    return;
  }

  try {
    const data = await fetchCryptoData();
    const cryptoData = data.find((item) => item.pair.startsWith(crypto));

    if (cryptoData) {
      const formattedPrice = formatPrice(parseFloat(cryptoData.latestPrice));
      msg.reply(generateMessage(cryptoData, formattedPrice));
    } else {
      msg.reply(
        `No data found for cryptocurrency code "${crypto}". Please ensure the code is correct.`
      );
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    msg.reply("Failed to fetch data. Please try again later.");
  }
});

const fetchCryptoData = async () => {
  const response = await fetch(
    "https://api.pintu.co.id/v2/trade/price-changes"
  );
  if (!response.ok) throw new Error("Network response was not ok");
  const { payload } = await response.json();
  return payload;
};

const generateMessage = (cryptoData, formattedPrice) =>
  `
*Pair*: ${cryptoData.pair.toUpperCase()}
*Latest Price*: ${formattedPrice}
*Day Change*: ${cryptoData.day}%
*Week Change*: ${cryptoData.week}%
*Month Change*: ${cryptoData.month}%
*Year Change*: ${cryptoData.year}%
`.trim();

client.initialize();
