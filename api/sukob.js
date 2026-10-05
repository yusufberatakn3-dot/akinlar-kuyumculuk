export default async function handler(req, res) {
  try {
    const response = await fetch("https://sukobfiyat.com/api/prices", {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/140.0.0.0 Mobile Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
        "Referer": "https://sukobfiyat.com/",
        "Origin": "https://sukobfiyat.com"
      },
      cache: "no-store"
    });

    const raw = await response.text();

    console.log("SUKOB DURUM:", response.status);
    console.log("SUKOB CEVAP:", raw.substring(0, 500));

    if (!response.ok) {
      return res.status(502).json({
        error: "SUKOB erişim hatası",
        status: response.status,
        detail: raw.substring(0, 1000)
      });
    }

    let data;

    try {
      data = JSON.parse(raw);
    } catch {
      return res.status(502).json({
        error: "SUKOB JSON okunamadı",
        detail: raw.substring(0, 1000)
      });
    }

    if (!Array.isArray(data)) {
      return res.status(502).json({
        error: "SUKOB veri formatı beklenmedik",
        receivedType: typeof data
      });
    }

    const bul = (tip) =>
      data.find(x => x && x.type === tip) || null;

    const sonuc = {
      hasAltin: bul("HAS"),
      ayar22: bul("22 Ayar Bilezik"),
      yeniCeyrek: bul("Yeni Çeyrek"),
      yeniYarim: bul("Yeni Yarım"),
      yeniTam: bul("Yeni Ziynet"),
      eskiCeyrek: bul("Eski Çeyrek"),
      eskiYarim: bul("Eski Yarım"),
      eskiTam: bul("Eski Ziynet"),
      dolar: bul("USD"),
      euro: bul("EUR")
    };

    return res.status(200).json(sonuc);

  } catch (e) {
    console.error("SUKOB HATA:", e);

    return res.status(502).json({
      error: "SUKOB bağlantı hatası",
      detail: e?.message || String(e)
    });
  }
}
