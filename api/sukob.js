export default async function handler(req, res) {
  const url = "https://sukobfiyat.com/api/prices";

  const gerekliTipler = [
    "HAS",
    "22 Ayar Bilezik",
    "Yeni Çeyrek",
    "Yeni Yarım",
    "Yeni Ziynet",
    "Eski Çeyrek",
    "Eski Yarım",
    "Eski Ziynet",
    "USD",
    "EUR"
  ];

  const bekle = ms =>
    new Promise(resolve => setTimeout(resolve, ms));

  function parseEt(raw) {
    try {
      const data = JSON.parse(raw);
      if (Array.isArray(data)) return data;
    } catch {}

    const bas = raw.indexOf("[");
    const son = raw.lastIndexOf("]");

    if (bas !== -1 && son > bas) {
      try {
        const data = JSON.parse(
          raw.slice(bas, son + 1)
        );

        if (Array.isArray(data)) return data;
      } catch {}
    }

    return null;
  }

  function bul(data, tip) {
    return data.find(
      x => x && x.type === tip
    ) || null;
  }

  function veriGecerliMi(sonuc) {
    return gerekliTipler.every(tip => {
      const item = sonuc[tip];

      return item &&
        item.buyPrice !== undefined &&
        item.sellPrice !== undefined &&
        item.buyPrice !== null &&
        item.sellPrice !== null;
    });
  }

  for (let deneme = 1; deneme <= 4; deneme++) {
    try {
      const response = await fetch(url, {
        method: "GET",

        headers: {
          "User-Agent":
            "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/140.0.0.0 Mobile Safari/537.36",

          "Accept":
            "application/json, text/plain, */*",

          "Accept-Language":
            "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",

          "Referer":
            "https://sukobfiyat.com/",

          "Origin":
            "https://sukobfiyat.com"
        },

        cache: "no-store"
      });

      const raw = await response.text();

      if (!response.ok) {
        throw new Error(
          "SUKOB HTTP " + response.status
        );
      }

      const data = parseEt(raw);

      if (!data) {
        throw new Error(
          "SUKOB JSON okunamadı"
        );
      }

      const sonuc = {
        HAS: bul(data, "HAS"),

        "22 Ayar Bilezik":
          bul(data, "22 Ayar Bilezik"),

        "Yeni Çeyrek":
          bul(data, "Yeni Çeyrek"),

        "Yeni Yarım":
          bul(data, "Yeni Yarım"),

        "Yeni Ziynet":
          bul(data, "Yeni Ziynet"),

        "Eski Çeyrek":
          bul(data, "Eski Çeyrek"),

        "Eski Yarım":
          bul(data, "Eski Yarım"),

        "Eski Ziynet":
          bul(data, "Eski Ziynet"),

        USD:
          bul(data, "USD"),

        EUR:
          bul(data, "EUR")
      };

      if (!veriGecerliMi(sonuc)) {
        throw new Error(
          "SUKOB eksik fiyat gönderdi"
        );
      }

      return res.status(200).json({
        hasAltin: sonuc.HAS,
        ayar22: sonuc["22 Ayar Bilezik"],
        yeniCeyrek: sonuc["Yeni Çeyrek"],
        yeniYarim: sonuc["Yeni Yarım"],
        yeniTam: sonuc["Yeni Ziynet"],
        eskiCeyrek: sonuc["Eski Çeyrek"],
        eskiYarim: sonuc["Eski Yarım"],
        eskiTam: sonuc["Eski Ziynet"],
        dolar: sonuc.USD,
        euro: sonuc.EUR
      });

    } catch (e) {

      console.error(
        "SUKOB deneme " + deneme + " başarısız:",
        e?.message || e
      );

      if (deneme < 4) {
        await bekle(1500 * deneme);
      }
    }
  }

  return res.status(502).json({
    error: "SUKOB'a bağlanılamadı",
    retry: true
  });
}
