export default async function handler(req, res) {
  try {
    const r = await fetch("https://finans.truncgil.com/today.json");
    const data = await r.json();

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).json(data);
  } catch (e) {
    try {
      const r2 = await fetch("https://api.genelpara.com/json/");
      const data2 = await r2.json();

      res.setHeader("Access-Control-Allow-Origin", "*");
      res.status(200).json(data2);
    } catch (err) {
      res.status(500).json({ error: "Veri alınamadı" });
    }
  }
}
