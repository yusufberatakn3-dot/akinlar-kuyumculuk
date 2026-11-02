
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  const anaUrl = "https://sukobfiyat.com/";
  const mobilUrl = "https://sukobfiyat.com/mobil.html";

  // Şu an çalışan adres: son güvenli geri dönüş
  const bilinenAdres = "/api/mainprice/";

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

  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/140.0.0.0 Mobile Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "tr-TR,tr;q=0.9",
    "Referer": mobilUrl,
    "Origin": "https://sukobfiyat.com"
  };

  let sonHata = "Bilinmeyen hata";
  let sonDurum = null;
  let sonCevap = "";
  let kullanilanAdres = "";

  // Sayfa ve JavaScript dosyalarından API adreslerini keşfet
  async function adresleriKesfet() {
    const bulunanlar = [];

    function ekle(adres) {
      if (!adres) return;

      try {
        const temiz = adres
          .replace(/&amp;/g, "&")
          .replace(/\\\//g, "/")
          .trim();

        const tam = new URL(temiz, mobilUrl);

        // Yalnızca SUKOB'un kendi alan adını kabul et
        if (tam.origin !== "https://sukobfiyat.com") return;

        if (
          !/\/api\//i.test(tam.pathname) ||
          !/(price|fiyat)/i.test(tam.pathname)
        ) return;

        const yol = tam.pathname;

        if (!bulunanlar.includes(yol)) {
          bulunanlar.push(yol);
        }
      } catch {}
    }

    function tara(kod) {
      if (!kod) return;

      const desenler = [
        /["'`](https?:\/\/sukobfiyat\.com\/api\/[^"'`\s]+)["'`]/gi,
        /["'`]((?:\/|\.\/)?api\/[A-Za-z0-9_./-]*(?:price|fiyat)[A-Za-z0-9_./-]*\/?)["'`]/gi
      ];

      for (const desen of desenler) {
        let eslesme;

        while ((eslesme = desen.exec(kod)) !== null) {
          ekle(eslesme[1]);
        }
      }
    }

    try {
      const sayfa = await fetch(mobilUrl, {
        headers,
        signal: AbortSignal.timeout(10000),
        cache: "no-store"
      });

      if (!sayfa.ok) {
        throw new Error("Mobil sayfa HTTP " + sayfa.status);
      }

      const html = await sayfa.text();
      tara(html);

      // Sayfadaki harici JavaScript dosyalarını da incele
      const scriptDeseni =
        /<script[^>]+src=["']([^"']+)["']/gi;

      const scriptler = [];
      let eslesme;

      while ((eslesme = scriptDeseni.exec(html)) !== null) {
        try {
          const scriptUrl = new URL(eslesme[1], mobilUrl);

          if (
            scriptUrl.origin === "https://sukobfiyat.com" &&
            !scriptler.includes(scriptUrl.href)
          ) {
            scriptler.push(scriptUrl.href);
          }
        } catch {}
      }

      // Çok fazla dosya indirmemek için ilk 12 dosya
      for (const scriptUrl of scriptler.slice(0, 12)) {
        try {
          const cevap = await fetch(scriptUrl, {
            headers,
            signal: AbortSignal.timeout(7000),
            cache: "no-store"
          });

          if (cevap.ok) {
            tara(await cevap.text());
          }
        } catch {}
      }

    } catch (e) {
      console.error("SUKOB kaynak keşfi:", e.message);
    }

    return bulunanlar;
  }

  // Ana sayfa çerezlerini al
  async function cookieAl() {
    try {
      const cevap = await fetch(anaUrl, {
        headers,
        signal: AbortSignal.timeout(8000),
        cache: "no-store"
      });

      const cookies =
        cevap.headers.getSetCookie?.() || [];

      return cookies
        .map(c => c.split(";")[0])
        .join("; ");
    } catch {
      return "";
    }
  }

  // Bir API adresini test et ve fiyatları doğrula
  async function fiyatlariKontrolEt(yol, cookie) {
    const tamUrl = new URL(yol, anaUrl);
    tamUrl.searchParams.set("cache", Date.now().toString());

    const response = await fetch(tamUrl.href, {
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
      throw new Error("JSON formatı okunamadı");
    }

    if (!Array.isArray(data)) {
      throw new Error("Fiyat verisi dizi formatında değil");
    }

    const uyari = data.find(item =>
      String(item?.type || "")
        .toLocaleLowerCase("tr-TR")
        .includes("lütfen")
    );

    if (uyari) {
      throw new Error("SUKOB yenileme uyarısı döndürdü");
    }

    const sonuc = {};

    for (const tip of gerekliTipler) {
      sonuc[tip] = data.find(item =>
        String(item?.type || "").trim() === tip
      ) || null;
    }

    const eksikler = gerekliTipler.filter(tip => {
      const item = sonuc[tip];

      return (
        !item ||
        !Number.isFinite(Number(item.buyPrice)) ||
        !Number.isFinite(Number(item.sellPrice)) ||
        Number(item.buyPrice) <= 0 ||
        Number(item.sellPrice) <= 0
      );
    });

    if (eksikler.length) {
      throw new Error(
        "Eksik veya geçersiz fiyatlar: " +
        eksikler.join(", ")
      );
    }

    kullanilanAdres = tamUrl.pathname;

    return {
      success: true,
      source: kullanilanAdres,
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
    };
  }

  try {
    const cookie = await cookieAl();

    // Önce SUKOB sayfasından keşfedilen adresleri dene
    const kesfedilenler = await adresleriKesfet();

    // Şu an çalışan adresi de mutlaka yedekte tut
    const adaylar = [
      ...kesfedilenler,
      bilinenAdres
    ];

    // Aynı adresi iki kez deneme
    const benzersizAdaylar = [...new Set(adaylar)];

    for (const aday of benzersizAdaylar) {
      try {
        const sonuc = await fiyatlariKontrolEt(aday, cookie);

        console.log("SUKOB çalışan kaynak:", aday);

        return res.status(200).json(sonuc);

      } catch (e) {
        sonHata = e?.message || String(e);

        console.error(
          "SUKOB kaynak başarısız:",
          aday,
          sonHata
        );
      }
    }

  } catch (e) {
    sonHata = e?.message || String(e);
  }

  return res.status(502).json({
    success: false,
    error: sonHata,
    upstreamStatus: sonDurum,
    upstreamResponse: sonCevap.slice(0, 1200),
    retry: true,
    source: kullanilanAdres || null
  });
}
