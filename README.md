# Market Morning｜市場晨讀

繁體中文市場新聞與投資學習網站，可直接在 GitHub 編輯、透過 GitHub Pages 公開閱讀。

**閱讀網站：[brian0927.github.io/market-morning](https://brian0927.github.io/market-morning/)**

**編輯原始碼：[Brian0927/market-morning](https://github.com/Brian0927/market-morning)**

**十則晨報：[公開閱讀](https://brian0927.github.io/market-morning/morning/) · [Gmail版預覽](https://brian0927.github.io/market-morning/morning/email.html) · [手機與寄送設定](https://brian0927.github.io/market-morning/setup/)**

**目前使用方式：加入iPhone主畫面並啟用網站推播。** [通知設定頁](https://brian0927.github.io/market-morning/push/) · [完整說明](docs/WEB-PUSH.md)。點通知直接進入公開晨報，不需ChatGPT、Gmail、Apps Script或AI金鑰；每日08:00開始更新，發布完成後通知。

**自選股與方塊：**首頁、市場、公司頁可各自新增股票方塊，設定大小、順序、折線／K棒與期間。按星號關注，或從「自選股」清單加入目前頁面。使用真實開高低收與成交量，紅漲綠跌，支援日線及5分鐘分時資料。[操作與資料說明](docs/WIDGETS.md)。設定保存在這部裝置，可匯出／匯入，不會公開個人關注名單。

每日十則包含台股、美股各一則與國內／國際新聞各四則。Gmail雲端寄送不需AI金鑰，但首次需使用者在自己的Google Apps Script授權並安裝排程；單純發布本儲存庫不會自動寄信。詳見 [Gmail與iPhone完整教學](docs/GMAIL-MORNING.md)。

公開版採純靜態頁面，不需要讀者登入，也不使用私人 Sites 的 API、R2 或存取憑證。沿用原先的市場晨讀排版與教學，新增 GitHub Actions 自動抓取新聞並發布。

> 教育與研究用途，沒有代下單功能。研究名單保留 2026-10-21 快照，並非即時行情或今天的買賣建議。帳戶金額為練習範例，不需要全額投入。

## 如何閱讀與修改

GitHub 儲存庫首頁是程式碼與 README；真正的閱讀網站是上方 `brian0927.github.io/market-morning/`。

1. 在 GitHub 點開要修改的檔案。
2. 點鉛筆 **Edit this file**。
3. 修改後選 **Commit changes**，儲存到 `main`。
4. 到 **Actions → Publish Market Morning** 看執行結果。
5. 等成功後重新整理閱讀網站。通常需數分鐘，並非儲存即立刻生效。

| 想改什麼 | 編輯哪個檔案 |
| --- | --- |
| 網站標題、新聞關鍵字、公開網址 | [`site.config.json`](site.config.json) |
| 股票觀察名單、參考價、理由、日期 | [`research.json`](research.json) |
| 投資入門章節 | [`guide.json`](guide.json) |
| 自己撰寫的精華卡片 | [`editorial.json`](editorial.json) |
| 個別新聞的詳細整理 | [`article-notes.json`](article-notes.json) |
| 每則新聞AI改寫流程與驗證 | [`rewrite.mjs`](rewrite.mjs) |
| 十則晨報與電子報HTML | [`newsletter.mjs`](newsletter.mjs) |
| Google雲端每日寄送器 | [`delivery/Code.gs`](delivery/Code.gs) |
| 手機與寄送設定頁 | [`delivery/publish-setup.mjs`](delivery/publish-setup.mjs) |
| 公開版頁面與導覽 | [`ui/render.mjs`](ui/render.mjs) |
| 圓角卡片、配色、動畫、手機排版 | [`ui/style.css`](ui/style.css) |
| 分類、搜尋、閱讀窗、圖表與計算器 | [`ui/app.js`](ui/app.js) |
| 內文擷取與股價來源 | [`collectors.mjs`](collectors.mjs) |
| 公開版抓取與輸出邏輯 | [`build-pages.mjs`](build-pages.mjs) |
| 發布條件、每日時間 | [`.github/workflows/pages.yml`](.github/workflows/pages.yml) |

JSON 字串需用雙引號，不要留多餘逗號。格式錯誤時 Actions 會失敗，上次成功發布的頁面仍會保留。

## 新版介面

首頁移除介紹大標與模擬帳戶，只呈現新聞、趨勢、公司行情與歷史收盤走勢。深綠、米白與鼠尾草綠維持原有色系，使用不規則圓角卡片。

導覽是六個獨立頁面：總覽、晨報、新聞、市場、公司、資料庫；不再是首頁的段落跳轉。資料庫保留原有12篇學習筆記、兩張圖解、部位計算器、完整研究與書籤。

卡片可用滑鼠或鍵盤開啟中央閱讀窗，支援 Escape 關閉、返回原焦點、搜尋與減少動態效果的系統設定。手機自動調整卡片與閱讀窗寬度。

每則新聞都經過詳細改寫流程，不再限制只擷取每類前六則。`article-notes.json` 的人工內容優先；其他新聞在取得足夠公開內文且設定 `OPENAI_API_KEY` 後，使用AI產生繁體中文導讀與2至4節可直接閱讀的整理文章。原文內文不放入公開輸出；不逐字轉載、不逐段重建原文。相同來源內容會重用成功改寫，跨分類新聞合併處理。

**啟用步驟請看 [AI新聞設定教學](docs/AI-NEWS-SETUP.md)。** 未設定金鑰、來源只有標題／短摘要、擷取失敗或AI服務失敗時，閱讀窗會明示狀態，保留來源連結，不補寫不存在的內容。建置摘要與 `data/rewrite-status.json` 會列出實際完成篇數。

市場頁使用來源實際回傳的每日收盤資料，顯示時間與延遲狀態；來源失敗保留有日期的備援，無資料不補畫。Yahoo Finance 並非保證可用的正式合約行情來源，格式、頻率與可用性可能變動。

## 目前功能

- 六類新聞：台灣、全球商業、總經／能源、科技、公司追蹤、金融／消費。
- 每日新聞標題精選，或維護者撰寫的精華。
- 條件式觀察名單：0050、00878、台積電、鴻海、台達電，附策略理由、失效條件與來源。
- 殖利率、PE、EPS、ROE、三張財報、K線、均線、成交量等入門教學。
- 部位風險計算器，考慮預估來回成本與可用現金限制。

研究名單與上方市場快照是建置時嵌入的資料；每日新聞抓取不會重算進出場價。教學圖不是即時行情圖。

## 每日新聞如何更新

工作流程在下列情況執行：

- `main` 收到新提交。
- 每日 UTC 00:00，也就是台灣時間 08:00。
- 在 Actions 頁手動按 **Run workflow**。

流程是「測試 → 抓取每則新聞 → 詳細改寫／讀取成功快取 → 生成靜態頁面與 JSON → 驗證 → 發布 Pages」。基本新聞頁不需個人 token；AI詳細改寫需要以 GitHub Repository Secret 設定 `OPENAI_API_KEY`，可能產生API用量費用。金鑰僅在建置工作使用，不提供給公開讀者。

來源為 Google News RSS、Yahoo股市與BBC Business。Google News聚合連結不一定能取得新聞本體；無法取得時如實標示，不繞過登入或付費限制。讀者按「重新讀取」只重載已發布資料，**不會從瀏覽器抓取外部 RSS 或啟動 Actions**。

來源失敗時，建置程式嘗試讀回上次公開網站該分類 JSON，保留原時間並標示備援；沒有舊資料則顯示未取得，不補猜新聞。

GitHub 定時工作可能延遲或被跳過；公開儲存庫長期無活動也可能被停用排程。08:00 是預定開始時間，非保證完成時間。詳見 [GitHub 排程說明](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)。

## 精華的兩種模式

### 自動標題精選

`editorial.json` 的 `items` 為空陣列時，從各分類挑選至多五則不重複新聞標題，附發布時間與來源。這是閱讀入口，**不是AI摘要、全文分析或已核實的交易建議**。

### 自己撰寫精華

在 `editorial.json` 填入：

```json
{
  "date": "2026-11-01T08:00:00+08:00",
  "title": "今天的市場重點",
  "items": [
    {
      "title": "第一個重點",
      "text": "已確認的事實、可能影響與不確定之處。",
      "url": "https://www.twse.com.tw/"
    }
  ]
}
```

`items` 非空時，優先顯示此人工版本與你填入的日期。恢復自動精選時，把 `items` 改回 `[]`。每日新聞更新不會重寫人工精華。

## 技術結構

```text
research.json + guide.json + worker/market.mjs
                ↓ build.mjs
          dist/server/index.js（產生頁面）
                ↓ build-pages.mjs + RSS + editorial.json
              _site/
              ├─ index.html
              └─ data/
                 ├─ brief.json
                 ├─ taiwan.json
                 ├─ global.json
                 ├─ macro.json
                 ├─ tech.json
                 ├─ company.json
                 └─ finance.json
                ↓ GitHub Actions / Pages
              公開閱讀網站
```

只發布 `_site/`，Worker 寫入端點不會部署成公開 API。資料路徑使用相對網址，因此可在 `/market-morning/` 子路徑運作。

## 本機開發與測試

需要 Node.js 22.13.0 以上，核心程式不需安裝額外 npm 套件。

```bash
git clone https://github.com/Brian0927/market-morning.git
cd market-morning
node build-pages.mjs
node verify-pages.mjs
```

`_site/` 為公開版輸出，可用任何靜態 HTTP server 開啟；直接雙擊 HTML 可能被瀏覽器阻擋 JSON 讀取。

離線驗證與原始 Worker 測試：

```bash
node build-pages.mjs --offline
node verify-pages.mjs
node verify.mjs
```

離線模式不抓新聞，空分類是預期結果。Pages 測試檢查相對路徑、瀏覽器程式語法、六類資料與精華 JSON，並確認沒有使用私人 API。Worker 測試驗證頁面與精華寫入／讀回。這不等於所有外部 RSS、手機尺寸與通知都經過端到端驗證。

若有 npm，可使用 `npm run build:pages` 與 `npm run test:pages`，不需先 `npm install`。

`node preview.mjs` 仍是舊 Worker 唯讀預覽，不是 `_site/` 靜態預覽。`dist/`、`_site/` 都是建置輸出，不提交到 Git。

## GitHub Pages 設定

**Settings → Pages → Build and deployment → Source** 選 **GitHub Actions**。

流程使用官方 `configure-pages`、`upload-pages-artifact`、`deploy-pages`，權限為 `contents: read`、`pages: write`、`id-token: write`。不需把個人密碼、私人 Sites token 或 R2 憑證放進 GitHub。參考 [官方 Pages 工作流程](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。

改儲存庫名稱或更換帳號時，要一併更新 `site.config.json` 的 `publicUrl` 與本 README 的閱讀連結。

## 原本 Sites 與手機通知

原本私人 Sites 是獨立部署；本次不會公開它的寫入 API。舊程式與說明保留在 repo，詳見 [`docs/SITES-LEGACY.md`](docs/SITES-LEGACY.md) 與 [`UPDATE-WORKFLOW.md`](UPDATE-WORKFLOW.md)。

GitHub Actions 更新網站，和先前 ChatGPT／Sites 的晨讀通知是不同排程。此工作流程沒有寄信、手機 Web Push、簡訊或 AI 查核摘要；先前通知也不會自動因 repo 公開而改寫目的網址。

## 常見問題

**更新失敗？** 到 Actions 查看紅色執行記錄，先確認 JSON 格式，再檢查 Pages 設定與來源連線；可按 Run workflow 重跑。

**仍看到舊資料？** 比較資料時間與 Actions 最後成功時間；可能尚未發布、使用來源備援或瀏覽器快取。

**股票價格不是今天？** `research.json` 是手動研究，必須更新日期、價位與理由後提交。

**別人能改網站嗎？** 別人可閱讀網頁與原始碼；直接提交權限由 GitHub 管理，網站沒有匿名寫入介面。

## 限制與維護注意

- RSS 是輕量欄位解析，來源格式變動可能需要修正。
- 文章發布時間、抓取時間與網站生成時間不同，標題不等於全文。
- 沒有即時股價、全市場掃描、回測或自動交易。
- 研究價格、ETF除權息、稅與費率需要按實際情況確認。
- 股數計算器使用估計成本，跳空可能超過預算風險。
- 新聞與商標權利屬各權利人，repo 尚未指定開源授權。
