export default async function handler(req, res) {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate"
  );

  try {
    const response = await fetch(
      "https://akinlar-kuyumculuk-default-rtdb.firebaseio.com/reklam/current.json",
      { cache: "no-store" }
    );

    if (!response.ok) {
      return res.status(502).json({
        error: "Firebase reklam verisi alınamadı",
        status: response.status
      });
    }

    const reklam = await response.json();

    return res.status(200).json(reklam);

  } catch (error) {
    console.error("REKLAM API HATASI:", error);

    return res.status(502).json({
      error: "Reklam verisi alınamadı"
    });
  }
}
