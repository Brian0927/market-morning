# 啟用每則新聞的詳細改寫

程式已對六類新聞中的每一則啟動相同流程：擷取公開內文 → 合併重複新聞 → 以繁體中文改寫 → 驗證 → 儲存到閱讀窗。沒有「只改寫前幾則」的限制。抓不到足夠內文的來源仍會明示缺漏，無法保證所有外部網站都提供可讀內容。

## 第一次設定

1. 開啟 [OpenAI API 平台](https://platform.openai.com/)，登入自己的帳號。
2. 在平台的 **Billing** 確認可用 API 額度／付款設定。確認用量與預算提醒；網站不代替你付款、不代為加值，也不保證預算提醒會自動停止扣款。
3. 前往 [API keys](https://platform.openai.com/api-keys)，在自己的專案建立一把 Secret key。複製並安全保存；不要放到程式碼、README、Issues 或聊天。
4. 開啟本儲存庫的 [Actions secrets 設定](https://github.com/Brian0927/market-morning/settings/secrets/actions)。也可由 **Settings → Secrets and variables → Actions** 進入。
5. 在 **Secrets** 分頁選 **New repository secret**。Name 填 `OPENAI_API_KEY`，Secret 貼上剛建立的金鑰，選 **Add secret**。
6. 開啟 [Publish Market Morning](https://github.com/Brian0927/market-morning/actions/workflows/pages.yml)，選 **Run workflow → main → Run workflow**。
7. 等該次工作完成後，查看 **Summary → Detailed news rewrites**。`ready` 是已完成篇數；`insufficient-source` 是來源內容不足；`awaiting-setup` 是尚未讀到金鑰；`unavailable` 是服務／額度／驗證問題。
8. 開啟 [閱讀網站](https://brian0927.github.io/market-morning/news/)，點新聞卡片；已成功改寫的文章會標示「詳細改寫版」。

儲存金鑰的網頁需要你登入 GitHub；讀者不需要登入。金鑰只傳給 GitHub 建置工作中的新聞改寫步驟，不會放進公開頁面或瀏覽器程式。

## 文章如何呈現

- 預覽顯示改寫後的短導讀。
- 展開後顯示2至4節連貫段落，依來源內容交代事件、背景、重要數字、各方說法與尚未確認的資訊。
- 字數依原始資料量調整，通常約350至650個中文字；短文不硬湊字數，也不逐段重建原文。
- 英文報導以繁體中文整理。日期、幣別、金額與預測的身分必須保留。
- 文末保留原始報導連結。無法讀取的網站、登入／付費限制、只有標題或短RSS摘要的資料，不會憑空補成完整報導。
- 原先編輯整理的文章保留，人工內容優先，不會被每日AI覆寫。

## 每天如何執行

原本排程不變：每天 UTC 00:00，即台灣時間08:00開始。建置完成後才會更新網站，GitHub 排程可能延遲。

每次新提交、手動執行或每日排程都會嘗試改寫所有新文章。相同新聞跨分類只處理一次；相同來源內容與改寫規則符合時，從上次公開資料重用成功結果，降低重複呼叫。來源改文會重新處理。這不會發送手機通知或電子郵件。

## 模型、費用與故障

預設模型為 `gpt-4.1-mini`。需要更換時，可在同一設定頁的 **Variables** 新增 `OPENAI_MODEL`，Value 使用你帳號可用、支援 Responses API 與 Structured Outputs 的模型名稱。不需把模型名稱設成 Secret。

API 依所選模型與實際輸入／輸出量計費；本專案沒有額外啟用自動付費或加值。單次送入內文最多10,000字元、回覆最多2,400 tokens，並行最多兩則，失敗最多嘗試兩次；這些是單次處理限制，**不是整體費用上限**。請從平台確認當前價格與用量。

遇到金鑰權限或額度／速率限制後，本次執行停止發起更多新改寫；新聞頁照常發布可用摘要與正確狀態，保留可重用的改寫。新增／修正金鑰或額度後，可再手動執行。

移除 `OPENAI_API_KEY` 可停止後續API呼叫；已公開的改寫可繼續重用，不會自動刪除。若金鑰曾外洩，請在 OpenAI 平台撤銷，再建立新金鑰替換 Secret。

## 驗證範圍

`node verify-rewrite.mjs` 使用模擬回應驗證格式、重複呼叫、快取失效、缺少金鑰、資料不足、驗證失敗、逐字複製攔截與原始內文不外洩。它不等於已完成真實 API 呼叫；設定金鑰後需查看首次工作摘要確認實際成功率。自動格式檢查不保證事實絕對正確，重要決策仍應對照原始來源。

官方文件：[API quickstart](https://developers.openai.com/api/docs/quickstart)、[Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses)、[GPT-4.1 mini](https://developers.openai.com/api/docs/models/gpt-4.1-mini)。
