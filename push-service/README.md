# 市場晨讀通知服務

公開晨報仍在 GitHub Pages。此服務只保存使用者明確允許的 Web Push 訂閱端點、管理token雜湊及寄送狀態於私人R2，不讀Gmail、不需AI金鑰。

`GET /api/config`只回傳VAPID公鑰。訂閱、停用與測試僅允許晨報網站Origin；停用和測試還需要裝置私有管理token。推播端點僅允許Apple、Google、Mozilla推播服務，避免任意伺服器請求。

`POST /api/dispatch`必須通過GitHub Actions OIDC驗證，限定Brian0927/market-morning、main分支及pages.yml。只讀固定公開晨報資料，只在台灣08:00–13:00間發送當日08:00後產生的版本。以R2條件寫入防止同裝置同日重複發送。推播不帶文章payload；Service Worker顯示固定晨報通知，點擊直接開公開晨報。

私鑰僅存Sites runtime secret `VAPID_PRIVATE_JWK`，不可放入原始碼。`VAPID_PUBLIC_KEY`可公開。R2不可對外列出或讀取。

此資料夾為已部署服務的可審閱副本，可從儲存庫根目錄執行 `node push-service/verify.mjs`。正式服務在獨立Sites專案部署，修改此副本不會自動更新雲端服務。

空payload推播遵循Web Push標準。測試以簽章驗證和模擬推播服務完成；真實手機到達與點擊跳轉需由使用者在iPhone授權後實測。服務接受不等於手機已顯示。暫時性發送失敗可再由授權工作流程重試，已成功裝置不重送；網路結果不明仍有少量重複／漏送風險。資料來源或GitHub排程失敗時不冒稱今日已更新。
