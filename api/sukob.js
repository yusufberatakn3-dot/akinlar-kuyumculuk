export default async function handler(req, res) {
  try {
    const r = await fetch("https://sukobfiyat.com/mobil.html");
    const html = await r.text();

    const i = html.indexOf("getJSON");
    const parca = i > -1 ? html.slice(i - 500, i + 1500) : "getJSON bulunamadı";

    res.status(200).json({
      ok: true,
      status: r.status,
      getJSONIndex: i,
      parca
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
}
