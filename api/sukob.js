
export default async function handler(req, res) {
  const anaUrl = "https://sukobfiyat.com/";
  const url = "https://sukobfiyat.com/api/prices?cache=" + Date.now();

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

  const headers = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/140.0.0.0 Mobile Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
    "Referer": anaUrl,
    "Origin": "https://sukobfiyat.com"
  };

  function parseEt(raw) {
    try {
      const data = JSON.parse(raw);
      if (Array.isArray(data)) return data;
    } catch {}

    const bas = raw.indexOf("[");
    const son = raw.lastIndexOf("]");

    if (bas !== -1 && son > bas) {
      try {
        const data = JSON.parse(raw.slice(bas, son + 1));
        if (Array.isArray(data)) return data;
      } catch {}
    }

    return null;
  }

  function bul(data, tip) {
    return data.find(x => x && x.type === tip) || null;
  }

  function veriGecerliMi(sonuc) {
    return gerekliTipler.every(tip => {
      const item = sonuc[tip];
      return item &&
        item.buyPrice != null &&
        item.sellPrice != null;
    });
  }

  for (let deneme = 1; deneme <= 4; deneme++) {
    try {
      // Önce ana sayfaya bağlan ve çerezleri al
      const anaSayfa = await fetch(anaUrl, {
        method: "GET",
        headers,
        cache: "no-store"
      });

      const setCookies = anaSayfa.headers.getSetCookie?.() || [];
      const cookie = setCookies
        .map(c => c.split(";")[0])
        .join("; ");

      // Ardından fiyat API'sine bağlan
      const response = await fetch(url, {
        method: "GET",
        headers: {
          ...headers,
          ...(cookie ? { "Cookie": cookie } : {})
        },
        cache: "no-store"
      });

      const raw = await response.text();

      if (!response.ok) {
        throw new Error("SUKOB HTTP " + response.status);
      }

      const data = parseEt(raw);

      if (!data) {
        throw new Error("SUKOB JSON okunamadı: " + raw.slice(0, 300));
      }

      const sonuc = {};
      for (const tip of gerekliTipler) {
        sonuc[tip] = bul(data, tip);
      }

      if (!veriGecerliMi(sonuc)) {
        console.error("SUKOB GELEN VERİ:", raw.slice(0, 2000));
        throw new Error("Eksik ürünler: " +
          gerekliTipler.filter(tip => {
            const item = sonuc[tip];
            return !item ||
              item.buyPrice == null ||
              item.sellPrice == null;
          }).join(", "));
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
