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

  const cryptos = msg.body.slice(3).trim().toLowerCase().split(" ");
  if (cryptos.length === 0) {
    msg.reply("Please provide one or more cryptocurrency codes after /p.");
    return;
  }

  try {
    const data = await fetchCryptoData();
    const messages = cryptos.map((crypto) => {
      const cryptoData = data.find((item) => item.pair.startsWith(crypto));
      return cryptoData
        ? formatCryptoMessage(cryptoData)
        : `No data found for cryptocurrency code "${crypto}".`;
    });

    msg.reply(messages.join("\n\n"));
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

const formatCryptoMessage = (cryptoData) => {
  const formattedPrice = formatPrice(parseFloat(cryptoData.latestPrice));
  return `
*Pair*: ${cryptoData.pair.toUpperCase()}
*Latest Price*: ${formattedPrice}
*Day Change*: ${cryptoData.day}%
*Week Change*: ${cryptoData.week}%
*Month Change*: ${cryptoData.month}%
*Year Change*: ${cryptoData.year}%
`.trim();
};

client.initialize();
