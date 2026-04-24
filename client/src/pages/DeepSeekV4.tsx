const PAGE_URL = "/deepseek-v4-web-en.html";

export default function DeepSeekV4() {
  return (
    <div className="pt-24 lg:pt-28 bg-[var(--color-warm-gray)]">
      <div className="border-y border-[var(--color-ink)]/10 bg-white">
        <iframe
          src={PAGE_URL}
          title="DeepSeek V4 Web EN"
          className="w-full h-[calc(100vh-7.5rem)] min-h-[900px]"
        />
      </div>
    </div>
  );
}
