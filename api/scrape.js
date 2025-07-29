import playwright from "playwright-aws-lambda";

export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "缺少參數 url" });
  }

  try {
    const browser = await playwright.launchChromium({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(url, { waitUntil: "networkidle" });
    await page.waitForTimeout(8000);

    // 抓取正文文字
    const elements = await page.$$("div[dir='auto']");
    let texts = [];
    for (let el of elements) {
      const txt = await el.innerText();
      if (
        txt.trim() &&
        !["讚", "留言", "分享", "追蹤", "聊天室"].some((k) => txt.includes(k))
      ) {
        texts.push(txt.trim());
      }
    }

    await browser.close();

    if (!texts.length) {
      return res.json({ message: "❌ 沒有找到貼文正文" });
    }

    return res.json({
      url,
      content: [...new Set(texts)].join("\n"),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "擷取失敗", details: err.message });
  }
}
