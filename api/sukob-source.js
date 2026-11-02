
export default async function handler(req, res) {
  try {
    const response = await fetch(
      "https://sukobfiyat.com/mobil.html",
      { cache: "no-store" }
    );

    const html = await response.text();

    const scripts = [
      ...html.matchAll(
        /<script[^>]+src=["']([^"']+)["']/gi
      )
    ].map(x => x[1]);

    const inline = [
      ...html.matchAll(
        /<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi
      )
    ].map(x => x[1]);

    const matches = [];

    for (const src of scripts.slice(0, 10)) {
      try {
        const url = new URL(src, response.url);
        const r = await fetch(url, { cache: "no-store" });
        const js = await r.text();

        const pattern =
          /.{0,100}(?:fetch\(|socket|WebSocket|api\/|prices|setInterval|XMLHttpRequest).{0,180}/gi;

        const found = js.match(pattern) || [];

        matches.push({
          file: url.href,
          status: r.status,
          matches: found.slice(0, 20)
        });
      } catch (e) {
        matches.push({ file: src, error: String(e) });
      }
    }

    return res.status(200).json({
      success: true,
      pageStatus: response.status,
      scripts,
      inline,
      matches
    });

  } catch (e) {
    return res.status(500).json({
      success: false,
      error: String(e)
    });
  }
}
