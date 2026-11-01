/** 市場晨報：只讀公開晨報資料，寄送給安裝此程式的 Google 帳號。 */
var MORNING_URL = 'https://brian0927.github.io/market-morning/';
var MORNING_ZONE = 'Asia/Taipei';
// 留空寄給執行者自己；若使用另一個自己的帳號寄信，可在私人專案填入收件信箱。
var MORNING_RECIPIENT = '';

function installMorningDelivery() {
  var email = MORNING_RECIPIENT || Session.getEffectiveUser().getEmail();
  if (!email || email.indexOf('@') < 1) throw new Error('無法辨識你的 Google 帳號，請用個人 Gmail 帳號執行。');
  stopMorningDelivery();
  PropertiesService.getScriptProperties().setProperty('morningRecipient', email);
  ScriptApp.newTrigger('pollMorning').timeBased().everyMinutes(5).create();
  console.log('已啟用：每日台灣時間08:00後，網站更新完成再寄出。可先執行 sendTestEmail 測試。');
}

function stopMorningDelivery() {
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (trigger.getHandlerFunction() === 'pollMorning') ScriptApp.deleteTrigger(trigger);
  });
  PropertiesService.getScriptProperties().deleteProperty('morningRecipient');
  console.log('已停止本專案的晨報寄送。');
}

function readMorning_() {
  var response = UrlFetchApp.fetch(MORNING_URL + 'data/newsletter.json?t=' + Date.now(), {muteHttpExceptions: true});
  if (response.getResponseCode() !== 200) throw new Error('晨報資料暫時無法讀取，稍後自動重試。');
  var edition = JSON.parse(response.getContentText());
  if (edition.version !== 1 || !Array.isArray(edition.items) || edition.items.length !== 10 ||
      typeof edition.emailHtml !== 'string' || typeof edition.plainText !== 'string' ||
      typeof edition.subject !== 'string' || !Number.isInteger(edition.availableCount) || edition.availableCount < 0 || edition.availableCount > 10 ||
      !isFinite(Date.parse(edition.generatedAt)) || !/^\d{4}-\d{2}-\d{2}$/.test(edition.date) ||
      edition.publicUrl !== MORNING_URL + 'morning/') throw new Error('晨報資料格式不完整，暫不寄出。');
  return edition;
}

function sendTestEmail() {
  var email = MORNING_RECIPIENT || Session.getEffectiveUser().getEmail();
  if (!email) throw new Error('請登入你要收信的 Google 帳號。');
  var edition = readMorning_();
  if (MailApp.getRemainingDailyQuota() < 1) throw new Error('今日寄信額度已用完。');
  MailApp.sendEmail({to: email, subject: '[測試] ' + edition.subject, body: edition.plainText,
    htmlBody: edition.emailHtml, name: '市場晨讀'});
  console.log('測試信已提交 Gmail 寄送；請到手機確認收信與通知。這不代表已安裝每日觸發器。');
}

function pollMorning() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return;
  try {
    var now = new Date(), day = Utilities.formatDate(now, MORNING_ZONE, 'yyyy-MM-dd');
    var hour = Number(Utilities.formatDate(now, MORNING_ZONE, 'H'));
    var props = PropertiesService.getScriptProperties(), email = props.getProperty('morningRecipient');
    if (!email || hour < 8 || hour >= 13 || props.getProperty('morningSentDay') === day) return;
    if (hour >= 12) {
      if (props.getProperty('morningAlertDay') !== day) {
        if (MailApp.getRemainingDailyQuota() < 1) throw new Error('寄信額度不足。');
        MailApp.sendEmail({to:email,subject:'市場晨報更新延遲｜'+day,
          body:'今天中午前仍未成功寄出新版晨報，因此沒有把舊資料當作今日內容寄出。請查看網站與 Apps Script 執行紀錄。\n'+MORNING_URL+'morning/',name:'市場晨讀'});
        props.setProperty('morningAlertDay',day);
      }
      return;
    }
    var edition = readMorning_();
    var generated = new Date(edition.generatedAt);
    if (edition.date !== day || Utilities.formatDate(generated,MORNING_ZONE,'yyyy-MM-dd') !== day ||
        Number(Utilities.formatDate(generated,MORNING_ZONE,'H')) < 8 || generated.getTime() > now.getTime()+300000 || edition.availableCount < 1) return;
    if (MailApp.getRemainingDailyQuota() < 1) throw new Error('今日寄信額度已用完。');
    MailApp.sendEmail({to:email,subject:edition.subject,body:edition.plainText,htmlBody:edition.emailHtml,name:'市場晨讀'});
    props.setProperty('morningSentDay',day);
    props.setProperty('morningSentAt',now.toISOString());
    console.log('今日晨報已提交 Gmail 寄送。手機通知仍取決於 Gmail 與 iPhone 設定。');
  } finally { lock.releaseLock(); }
}
