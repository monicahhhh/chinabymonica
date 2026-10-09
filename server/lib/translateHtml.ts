const CHUNK_SIZE = 450;

type LangPair = { source: string; target: string };

function langPair(direction: "zh-to-en" | "en-to-zh"): LangPair {
  return direction === "zh-to-en"
    ? { source: "zh-CN", target: "en" }
    : { source: "en", target: "zh-CN" };
}

async function translateViaGoogle(
  text: string,
  source: string,
  target: string,
): Promise<string> {
  const url = new URL("https://translate.googleapis.com/translate_a/single");
  url.searchParams.set("client", "gtx");
  url.searchParams.set("sl", source);
  url.searchParams.set("tl", target);
  url.searchParams.set("dt", "t");
  url.searchParams.set("q", text);

  const response = await fetch(url.toString(), {
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) {
    throw new Error(`Google translate ${response.status}`);
  }

  const data = (await response.json()) as unknown;
  if (!Array.isArray(data) || !Array.isArray(data[0])) {
    throw new Error("Google translate unexpected response");
  }

  return (data[0] as Array<[string] | undefined>)
    .map((row) => (Array.isArray(row) ? row[0] : ""))
    .join("");
}

async function translateViaMyMemory(
  text: string,
  source: string,
  target: string,
): Promise<string> {
  const sl = source.startsWith("zh") ? "zh-CN" : source;
  const tl = target.startsWith("zh") ? "zh-CN" : target;
  const url = new URL("https://api.mymemory.translated.net/get");
  url.searchParams.set("q", text);
  url.searchParams.set("langpair", `${sl}|${tl}`);

  const response = await fetch(url.toString(), {
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    throw new Error(`MyMemory translate ${response.status}`);
  }

  const data = (await response.json()) as {
    responseData?: { translatedText?: string };
    responseStatus?: number;
  };
  const translated = data.responseData?.translatedText;
  if (!translated || (data.responseStatus && data.responseStatus !== 200)) {
    throw new Error("MyMemory translate unexpected response");
  }
  return translated;
}

async function translatePlainText(
  text: string,
  source: string,
  target: string,
): Promise<string> {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += CHUNK_SIZE) {
    chunks.push(text.slice(i, i + CHUNK_SIZE));
  }

  const translatedParts: string[] = [];
  for (const chunk of chunks) {
    try {
      translatedParts.push(await translateViaGoogle(chunk, source, target));
    } catch (googleErr) {
      console.warn(
        "[translate] Google fallback failed, trying MyMemory:",
        googleErr instanceof Error ? googleErr.message : googleErr,
      );
      translatedParts.push(await translateViaMyMemory(chunk, source, target));
    }
  }

  return translatedParts.join("");
}

/**
 * Translate HTML while preserving tags/attributes.
 * Used when the configured LLM gateway is unavailable.
 */
export async function translateHtmlFallback(
  html: string,
  direction: "zh-to-en" | "en-to-zh",
): Promise<string> {
  const { source, target } = langPair(direction);
  const parts = html.split(/(<[^>]+>)/g);

  const out: string[] = [];
  for (const part of parts) {
    if (!part) continue;
    if (part.startsWith("<") && part.endsWith(">")) {
      out.push(part);
      continue;
    }
    if (!/\S/.test(part)) {
      out.push(part);
      continue;
    }
    out.push(await translatePlainText(part, source, target));
  }

  return out.join("");
}
