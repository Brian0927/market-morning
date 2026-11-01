# 手機晨報推播

公開晨報：[閱讀](https://brian0927.github.io/market-morning/morning/) · [手機通知設定](https://brian0927.github.io/market-morning/push/)

## iPhone：只需完成一次

1. 使用Safari開啟晨報或通知設定頁。
2. 分享 → 加入主畫面，命名「市場晨讀」。
3. 從主畫面圖示開啟，按「啟用通知」，在iOS提示選允許。
4. 按「測試通知」，確認通知真的顯示，再點通知，應直接進入十則晨報。

需iOS16.4以上。舊的主畫面書籤可能需要重新加入，才能套用新的Web App模式。若已拒絕通知，從iPhone「設定 → 通知 → 市場晨讀」調整；也檢查專注模式及通知摘要。不要只在ChatGPT內嵌瀏覽器點啟用，請用Safari加入主畫面後再操作。

「服務已接受」不等於手機已收到，手機到達、畫面呈現與點擊跳轉需要在實際裝置確認。測試通知每分鐘最多一次；手機系統與推播供應商可能延遲。

## 每天如何運作

GitHub Actions每天台灣時間08:00開始更新新聞，通過驗證並完成Pages發布後，取得限時GitHub OIDC身分憑證，呼叫通知服務。服務驗證指定儲存庫、main分支及pages.yml後，才會讀取固定公開網址的當日晨報，發送給已主動允許的裝置。預定08:00開始，不保證08:00整到達。

只有台灣08:00–13:00之間、當日08:00後生成且已有內容的版本才會觸發每日通知。下午一般介面更新不會額外打擾。來源尚未更新會重試；上午更新失敗或排程未執行時不把舊文冒稱新文。每部裝置按日期去重，失效訂閱會清除。GitHub排程、網站、推播供應商、網路與iPhone設定都可能造成延遲或漏收。

通知標題為「市場晨讀」，點擊直接開啟 `/market-morning/morning/`；若此網站視窗已開啟，則切換並導向晨報。Service Worker沒有攔截新聞讀取或快取舊晨報。GitHub Pages與手機都不會持有發送私鑰。

## 不需要的設定

不需Gmail、Google Apps Script、OpenAI API金鑰、Apple付費開發者帳號或讓電腦開機。此功能不會發送電子郵件。之前的Gmail工具仍保留供日後選用，未安裝Apps Script就不會自動寄信。

## 隱私與停用

通知服務：`https://brian-market-push.brianhsieh0927.chatgpt.site`。GitHub Pages不能保存私有訂閱，故使用獨立雲端服務與私人R2。只保存推播端點、裝置管理token的雜湊及必要寄送狀態，不需要姓名、信箱或密碼，也沒有公開訂閱清單介面。

可隨時在晨報按「關閉通知」，刪除這部裝置的雲端訂閱並解除瀏覽器訂閱。即使雲端暫時失敗，裝置完成解除後也會停止接收；失效端點在下一次服務檢查清除。每日去重狀態只含不可逆雜湊識別，不含原始端點。清除網站資料會失去裝置管理狀態，必要時由iOS設定先停用通知，再重新加入／啟用。

## 維護

- `push.config.json`：通知服務的公開網址，不放私鑰。
- `ui/push.js`：裝置狀態、主畫面提示、啟用、測試與停止。
- `ui/sw.js`：推播顯示與點擊直達晨報。
- `push-assets.mjs`：產生manifest、180/192/512圖示及發布Service Worker。
- `push-instructions.mjs`：手機設定頁。
- `dispatch-push.mjs`：GitHub OIDC驗證後呼叫通知服務。
- `verify-push.mjs`：PWA、通知內容、scope與跳轉測試。
- `verify-live-push.mjs`：唯讀／拒絕路徑檢查，不訂閱任何裝置。

通知服務的原始碼另附於儲存庫 `push-service/` 供審閱；它在Sites部署，不是GitHub Pages能執行的程式。修改此副本不會自動發布後端。其部署身分在獨立本機專案的`.openai/hosting.json`，勿把原本私人Sites改成公開。

VAPID私鑰只放通知服務的runtime secret，不能加入GitHub。換私鑰會影響現有訂閱，需規劃重新訂閱。GitHub發送權限使用短效OIDC，不需新增永久GitHub Secret。

官方依據：[Apple WebKit](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)、[GitHub OIDC](https://docs.github.com/en/actions/reference/security/oidc)、[VAPID RFC8292](https://datatracker.ietf.org/doc/html/rfc8292)。
