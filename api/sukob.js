export default async function handler(req, res) {
  try {
    const r = await fetch("https://sukobfiyat.com/api/prices?cache=" + Date.now());
    const data = await r.json();

    const find = (name) => data.find(x => x.type === name);

    const out = {
      hasAltin: find("HAS"),
      ayar22: find("22 Ayar"),
      yeniCeyrek: find("Yeni Çeyrek"),
      yeniYarim: find("Yeni Yarım"),
      yeniTam: find("Yeni Ziynet"),
      eskiCeyrek: find("Eski Çeyrek"),
      eskiYarim: find("Eski Yarım"),
      eskiTam: find("Eski Ziynet"),
      dolar: find("USD"),
      euro: find("EUR")
    };

    res.status(200).json(out);
  } catch (e) {
    res.status(500).json({
      error: "SUKOB verisi alınamadı",
      detail: e.message
    });
  }
}
