export default async function handler(req, res) {
  try {
    const r = await fetch("https://finans.truncgil.com/today.json", {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const data = await r.json();

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: "Veri alınamadı", detail: String(e) });
  }
}
