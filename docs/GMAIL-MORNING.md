# Gmail 電子報與 iPhone 晨報閱讀

公開入口：[每日十則晨報](https://brian0927.github.io/market-morning/morning/) · [電子報版](https://brian0927.github.io/market-morning/morning/email.html) · [逐步啟用頁](https://brian0927.github.io/market-morning/setup/)

## 十則內容

1. 台股概況：加權指數、台積電、鴻海、台達電，附實際資料時間。
2. 美股概況：S&P 500、NASDAQ、費城半導體，附美東資料時間。
3. 至10. 國內科技／公司與國際科技／商業新聞各四則，交錯排列。

目前是來源摘要與已存在的編輯整理，不需AI金鑰。新聞優先近24小時；週末等資料較少時，允許延伸至72小時並明示超過24小時。無足夠科技新聞時，改列同地區可讀的市場／商業新聞，標籤也隨之改變。沒有可讀內容時保留缺漏，不以標題假寫文章。這是依時效、可讀性與主題篩選，並非人工逐日查證所有報導。

晨報頁及電子報使用同一份 `data/newsletter.json`，不公開收件信箱、寄送紀錄或憑證。點新聞可展開既有閱讀窗；有可用詳細改寫就顯示，未設定AI則使用來源摘要。

## 每天的流程

```text
08:00 台灣時間：GitHub Actions 開始抓新聞與行情
→ 產生十則晨報、電子報HTML與公開資料
→ 測試成功並發布到 GitHub Pages
→ 你的 Google Apps Script 每5分鐘檢查一次
→ 當日08:00後新版已公開，且今天尚未寄送：送出一封HTML電子報
→ iPhone Gmail依自己的通知設定提醒
```

08:00是預定開始更新時間，不是保證到信時間。GitHub、Google與郵件傳輸都可能延遲；AI詳細改寫若另行啟用，也會增加建置時間。讀者不須登入，不需要電腦開機或開著ChatGPT。這個寄送器與舊ChatGPT/Sites提醒分開，不會更動其他排程。

中午前持續等待當日新版。若中午仍未成功寄出，會嘗試寄一次延遲提醒，不把舊內容當今日晨報。寄信服務自身失敗時，提醒也可能失敗，應查看Google Apps Script執行紀錄。

## 第一次啟用（電腦較方便）

1. 用要收信的Gmail帳號開啟 [Google Apps Script](https://script.google.com/)，建立新專案，命名「市場晨報」。
2. 在 [逐步啟用頁](https://brian0927.github.io/market-morning/setup/)按「複製寄送程式」，貼入專案的 `Code.gs`，取代預設範例，儲存。
3. 選上方函式 `sendTestEmail`，按「執行」。在自己的Google帳號檢查並完成授權。
4. 程式使用 `MailApp`，只要求寄信，不讀取收件匣。其他需要辨識使用者、讀取這個公開網站、管理此專案的定時觸發器。若Google安全頁或組織政策攔截，先停下確認，不要交出密碼或繞過安全警告。
5. 去Gmail確認測試信。
6. 回Apps Script，選 `installMorningDelivery` 執行。
7. 左側「觸發條件」（時鐘）確認 `pollMorning` 每5分鐘執行。沒有此觸發器就沒有啟用每日寄送。

只寄給安裝者自己的信箱，地址由Google帳號辨識，無需寫進公開GitHub。若希望用另一個自己的Gmail作為寄件者，請在那個帳號安裝，並在**私人Apps Script專案**把 `MORNING_RECIPIENT` 填成要收信的地址，不要將地址改進公開儲存庫。

可選：將儲存庫 `delivery/appsscript.json` 的內容用於專案資訊清單，明列需要的權限；基本安裝只貼 `Code.gs` 即可，排程判斷本身已固定使用 `Asia/Taipei`。

## iPhone 操作

1. Gmail App登入收件帳號。
2. iPhone「設定 → 通知 → Gmail」開啟允許通知、鎖定畫面、橫幅與聲音。不同iOS版本可能在「設定 → App → Gmail → 通知」。
3. Gmail「選單 → 設定 → 電子郵件通知」為該帳號選通知層級。初次測試先用所有新郵件。
4. 若被分到促銷或垃圾郵件，移至主要收件匣／標示非垃圾郵件。確認專注模式及通知摘要不會延後Gmail。
5. 再執行 `sendTestEmail`，檢查鎖定畫面是否真正通知。自己寄給自己的信可能被Gmail抑制通知；必要時改用另一個自己的Gmail寄入收件帳號，或使用主畫面閱讀入口。收到電子郵件不代表iOS已發送通知。

[Google官方iOS通知說明](https://support.google.com/mail/answer/1075549?hl=zh-Hant&co=GENIE.Platform%3DiOS)

### 主畫面或捷徑入口

- 最簡單：Safari開啟公開晨報 → 分享 → 加入主畫面 → 命名「市場晨報」。
- 捷徑版：新增捷徑 →「URL」填 `https://brian0927.github.io/market-morning/morning/` →「打開URL」→命名並加入主畫面／小工具。點擊後直接開啟閱讀，不需登入。

每日提醒由Gmail到信負責；這裡不另加會在鎖定時強行開啟Safari的自動化，也不把一般捷徑通知誤稱為可直接開網址的推播按鈕。

## 需要你提供什麼

- 收件Gmail地址（本次已在對話確認，未寫入公開程式）。
- 已確認的每日時間：台灣08:00開始，含週末；更新完成後寄送。
- 首次啟用後，回報：測試信是否收到、iPhone通知是否跳出、Google觸發條件是否出現。

**不需要提供Google密碼、驗證碼、應用程式密碼或AI API金鑰。** Google授權由使用者自己完成。若需變更收件信箱或時間，可在自己的私人Apps Script中調整，或再提出需求。

## 暫停與故障排查

- 停止：在Apps Script執行 `stopMorningDelivery`，只刪除本專案的 `pollMorning` 觸發器，網站更新照常。
- 重開：執行 `installMorningDelivery`；重複執行不會安裝多個同名觸發器。
- 只有測試信、無每日信：確認有安裝觸發器；測試本身不會安裝排程。
- 有更新但無信：查Apps Script「執行項目」、當日寄信額度、Google帳號授權與程式來源。
- 看見舊日期：查看GitHub Actions是否成功；程式只在當日08:00後生成的新資料公開後寄送。
- 郵件成功但無通知：檢查Gmail分頁、iPhone通知／專注模式，並注意自寄自收的通知限制。
- 重複防護使用鎖與日期紀錄；若寄信成功後紀錄寫入意外失敗，仍不能保證分散式系統絕對只寄一次。

## 維護與測試

`newsletter.mjs` 選出十則並輸出HTML／文字版本；`delivery/Code.gs`負責Google雲端寄送；`delivery/publish-setup.mjs`產生公開操作頁；`ui/app.js`呈現晨報卡片與展開閱讀。

`node verify-newsletter.mjs`測試十則配置、分類、去重、時效、資料不足、HTML跳脫、跨日、舊晨報不寄、同日去重、額度失敗及停止功能。測試用模擬服務，**不代表你的Google排程已啟用，也不代表手機已收到通知**。

官方參考：[MailApp](https://developers.google.com/apps-script/reference/mail/mail-app)、[ClockTriggerBuilder](https://developers.google.com/apps-script/reference/script/clock-trigger-builder)。
