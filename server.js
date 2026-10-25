const http = require("http"), fs = require("fs"), path = require("path");
const KEY = process.env.ANTHROPIC_API_KEY, PORT = process.env.PORT || 3000;
const MODELS = {
  default: process.env.FAI_MODEL || "claude-sonnet-5-5",
  complex: process.env.FAI_DEEP_MODEL || "claude-opus-5-5"
};
const hits = new Map();
function limited(ip) {
  const now = Date.now(), a = (hits.get(ip) || []).filter(t => now - t < 60000);
  a.push(now); hits.set(ip, a); return a.length > 20; // 20 requests/min per visitor
}
function send(res, code, obj) {
  res.writeHead(code, { "Content-Type": "application/json" });
  res.end(JSON.stringify(obj));
}
const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && (req.url === "/" || req.url.startsWith("/?"))) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(fs.readFileSync(path.join(__dirname, "public", "index.html")));
  }
  if (req.method === "POST" && req.url === "/api/chat") {
    if (!KEY) return send(res, 500, { error: "Server is missing ANTHROPIC_API_KEY" });
    const ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0];
    if (limited(ip)) return send(res, 429, { error: "rate_limited" });
    let body = "";
    for await (const c of req) { body += c; if (body.length > 15e6) return send(res, 413, { error: "too_large" }); }
    try {
      const { messages, tier, image } = JSON.parse(body);
      if (!Array.isArray(messages) || !messages.length) return send(res, 400, { error: "bad_request" });
      const msgs = messages.slice(-30).map(m => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: String(m.content).slice(0, 30000)
      }));
      if (image && image.data && /^image\/(png|jpeg|gif|webp)$/.test(image.type)) {
        const l = msgs[msgs.length - 1];
        l.content = [
          { type: "image", source: { type: "base64", media_type: image.type, data: image.data } },
          { type: "text", text: l.content }
        ];
      }
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": KEY, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: MODELS[tier === "complex" ? "complex" : "default"], max_tokens: 2000, messages: msgs })
      });
      const j = await r.json();
      if (!r.ok) return send(res, r.status, { error: (j.error && j.error.message) || "api_error" });
      send(res, 200, { text: (j.content || []).filter(b => b.type === "text").map(b => b.text).join("") });
    } catch (e) { send(res, 500, { error: "server_error" }); }
    return;
  }
  res.writeHead(404); res.end("Not found");
});
server.listen(PORT, () => console.log("Fai running on port " + PORT));
