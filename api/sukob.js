export default async function handler(req, res) {
  try {
    const r = await fetch("https://sukobfiyat.com/mobil.html");
    const html = await r.text();

    res.status(200).json({
      ok: true,
      htmlLength: html.length,
      hasAltin: html.includes("Has Altın"),
      yeniCeyrek: html.includes("Yeni Çeyrek"),
      eskiZiynet: html.includes("Eski Ziynet"),
      sample: html.slice(0, 10000)
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
}
