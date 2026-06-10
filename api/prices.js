export default async function handler(req, res) {
  try {
    const response = await fetch("https://finans.truncgil.com/today.json");

    const text = await response.text();
    const son = text.lastIndexOf("}");
const temiz = son > -1 ? text.slice(0, son + 1) : text;

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "application/json");

    res.status(200).send(temiz);

  } catch (error) {
    res.status(500).json({
      error: "Veri alınamadı",
      detail: error.toString()
    });
  }
}
