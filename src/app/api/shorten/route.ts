import { NextRequest, NextResponse } from "next/server";

/**
 * Encurta URL via TinyURL no servidor (evita CORS e limite de query string no browser).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const url = typeof body?.url === "string" ? body.url.trim() : "";
    if (!url) {
      return NextResponse.json({ error: "Missing url" }, { status: 400 });
    }

    const tinyUrl = `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`;
    const res = await fetch(tinyUrl);
    if (!res.ok) {
      return NextResponse.json(
        { error: "TinyURL request failed" },
        { status: 502 }
      );
    }
    const shortUrl = (await res.text()).trim();
    if (!shortUrl.startsWith("http")) {
      return NextResponse.json(
        { error: "Invalid TinyURL response" },
        { status: 502 }
      );
    }
    return NextResponse.json({ shortUrl });
  } catch {
    return NextResponse.json({ error: "Failed to shorten" }, { status: 502 });
  }
}
