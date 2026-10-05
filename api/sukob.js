export default async function handler(req, res) {
  try {
    const response = await fetch("https://sukobfiyat.com/api/prices", {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json"
      },
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(
        `SUKOB HTTP ${response.status} - ${response.statusText}`
      );
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("SUKOB geçersiz veri döndürdü");
    }

    const find = (name) => data.find(x => x.type === name) || null;

    const out = {
      hasAltin: find("HAS"),
      ayar22: find("22 Ayar Bilezik"),
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
    console.error("SUKOB API HATASI:", e);

    res.status(500).json({
      error: "SUKOB verisi alınamadı",
      detail: e.message
    });
  }
}
