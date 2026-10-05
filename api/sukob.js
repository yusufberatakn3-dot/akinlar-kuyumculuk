export default async function handler(req, res) {
  try {
    const url = "https://sukobfiyat.com/api/prices";

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache"
      },
      cache: "no-store",
      signal: controller.signal
    });

    clearTimeout(timeout);

    const contentType = response.headers.get("content-type") || "";
    const raw = await response.text();

    if (!response.ok) {
      console.error("SUKOB HTTP HATASI:", {
        status: response.status,
        statusText: response.statusText,
        contentType,
        body: raw.substring(0, 1000)
      });

      return res.status(502).json({
        error: "SUKOB API hata döndürdü",
        status: response.status,
        statusText: response.statusText,
        contentType,
        detail: raw.substring(0, 1000)
      });
    }

    let data;

    try {
      data = JSON.parse(raw);
    } catch (jsonError) {
      console.error("SUKOB JSON HATASI:", raw.substring(0, 1000));

      return res.status(502).json({
        error: "SUKOB geçerli JSON döndürmedi",
        contentType,
        detail: raw.substring(0, 1000)
      });
    }

    if (!Array.isArray(data)) {
      return res.status(502).json({
        error: "SUKOB beklenmeyen veri döndürdü",
        receivedType: typeof data
      });
    }

    const find = (name) =>
      data.find(x => x && x.type === name) || null;

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

    console.log("SUKOB BAŞARILI:", {
      adet: data.length,
      has: !!out.hasAltin,
      ayar22: !!out.ayar22,
      dolar: !!out.dolar,
      euro: !!out.euro
    });

    return res.status(200).json(out);

  } catch (e) {
    console.error("SUKOB BAĞLANTI HATASI:", e);

    return res.status(502).json({
      error: "SUKOB bağlantısı başarısız",
      name: e?.name || "UnknownError",
      detail: e?.message || String(e)
    });
  }
}
