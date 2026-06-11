export default async function handler(req, res) {
  try {
    const r = await fetch("https://sukobfiyat.com/mobil.html");
    const html = await r.text();

    res.status(200).json({
      ok: true,
      status: r.status,
      text: html.slice(0, 3000)
    });
  } catch (e) {
    res.status(500).json({
      ok: false,
      error: e.message
    });
  }
}
