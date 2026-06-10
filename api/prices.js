export default async function handler(req, res) {
  try {
    const response = await fetch("https://finans.truncgil.com/today.json");

    const text = await response.text();

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "application/json");

    res.status(200).send(text);

  } catch (error) {
    res.status(500).json({
      error: "Veri alınamadı",
      detail: error.toString()
    });
  }
}
