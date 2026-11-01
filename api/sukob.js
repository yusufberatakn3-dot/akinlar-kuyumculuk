
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
    "Accept-Language": "tr-TR,tr;q=0.9",
    "Referer": anaUrl,
    "Origin": "https://sukobfiyat.com"
  };

  let sonHata = "Bilinmeyen hata";
  let sonDurum = null;
  let sonCevap = "";

  for (let deneme = 1; deneme <= 4; deneme++) {
    try {
      const anaSayfa = await fetch(anaUrl, {
        headers,
        signal: AbortSignal.timeout(10000),
        cache: "no-store"
      });

      const cookies =
        anaSayfa.headers.getSetCookie?.() || [];

      const cookie = cookies
        .map(c => c.split(";")[0])
        .join("; ");

      const response = await fetch(url, {
        headers: {
          ...headers,
          ...(cookie ? { Cookie: cookie } : {})
        },
        signal: AbortSignal.timeout(15000),
        cache: "no-store"
      });

      sonDurum = response.status;
      sonCevap = await response.text();

      if (!response.ok) {
        throw new Error("SUKOB HTTP " + response.status);
      }

      let data;

      try {
        data = JSON.parse(sonCevap);
      } catch {
        throw new Error("JSON okunamadı");
      }

      if (!Array.isArray(data)) {
        throw new Error("Gelen veri dizi formatında değil");
      }

      if (
        data.length === 1 &&
        String(data[0]?.type || "").includes("Lutfen")
      ) {
        throw new Error(
          "SUKOB yenileme uyarısı döndürüyor. Gerçek fiyat verisi yok."
        );
      }

      const sonuc = {};

      for (const tip of gerekliTipler) {
        sonuc[tip] =
          data.find(x => x?.type === tip) || null;
      }

      const eksikler = gerekliTipler.filter(tip => {
        const item = sonuc[tip];

        return !item ||
          item.buyPrice == null ||
          item.sellPrice == null;
      });

      if (eksikler.length) {
        throw new Error(
          "Eksik ürünler: " + eksikler.join(", ")
        );
      }

      return res.status(200).json({
        success: true,
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
      sonHata = e?.message || String(e);

      console.error("SUKOB DENEME:", deneme, sonHata);

      if (deneme < 4) {
        await bekle(1500 * deneme);
      }
    }
  }

  return res.status(502).json({
    success: false,
    error: sonHata,
    upstreamStatus: sonDurum,
    upstreamResponse: sonCevap.slice(0, 1000),
    retry: true
  });
}
