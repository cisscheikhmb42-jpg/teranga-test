// Route serveur : sert la capture d'écran d'un bug publié dans un rapport.
// L'image est lue dans Google Drive par le script ; le navigateur ne voit
// que cette adresse-ci, jamais une adresse Google.
import { codeValide } from "@/lib/rapport";
import { lireDuScript } from "@/lib/script";

export async function GET(request: Request) {
  const parametres = new URL(request.url).searchParams;
  const code = (parametres.get("code") ?? "").toUpperCase();
  const numero = parametres.get("n") ?? "";

  if (!codeValide(code) || !/^\d{1,4}$/.test(numero)) {
    return new Response("Capture introuvable", { status: 404 });
  }

  try {
    const reponse = await lireDuScript({ action: "capture", code, numero });
    const type = typeof reponse.type === "string" ? reponse.type : "";
    if (!reponse.ok || typeof reponse.data !== "string" || !type.startsWith("image/")) {
      return new Response("Capture introuvable", { status: 404 });
    }
    return new Response(Buffer.from(reponse.data, "base64"), {
      headers: {
        "Content-Type": type,
        "Cache-Control": "private, max-age=3600",
        "X-Robots-Tag": "noindex",
      },
    });
  } catch (erreur) {
    console.error("Capture :", erreur);
    return new Response("Capture indisponible", { status: 502 });
  }
}
