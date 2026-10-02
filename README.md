# 羽球排場 Badminton Matchmaker

羽球團練用的排場系統：管理當日球員、組隊、安排場地、記錄對戰與收費。
**純前端專案**，沒有後端與帳號，所有資料存在瀏覽器的 `localStorage`。

## 功能

| 分頁 | 說明 |
| --- | --- |
| 球員管理 | 點選 4 位球員組成一組加入預備區；可依「場次少優先 / 程度 / 姓名」排序；綁定的搭檔會一起被選入並同隊；勾選時會警告「指定隊友沒一起選」與「誰和誰今天已同場幾次」 |
| 場地管理 | 在預備區點一組，再點空場地安排上場；比賽計時；結束比賽後寫入紀錄；可新增 / 移除場地 |
| 對戰紀錄 | 今日已完成的場次、時間、時長、來源（手動 / 預約） |
| 預約對戰 | 預先勾選 4 人建立組合（同樣有勾選警告），有人在場上或預備區時會提示衝突 |
| 收費管理 | 男生費用 / 女生費用 / 優惠折抵金額，個人可切換一般或優惠；給團主 / 現場繳費、應收已收未收統計 |
| 設定 | 外觀（系統 / 亮色 / 暗色）、批次匯入球員、JSON 備份與還原、清空對戰紀錄、刪除所有成員 |

自動分隊規則：四人中若有綁定搭檔則讓他們同隊；否則依程度排序以 1+4 對 2+3 平衡實力。

## PWA

- 可「加到主畫面」安裝，並且**離線可用**（所有頁面、程式與字型都會預先快取）
- Service Worker 原始碼在 `src/service-worker.ts`，由 `vite-plugin-pwa`（injectManifest）在 build 時注入檔案清單，輸出為 `service-worker.js`
- 輸出檔名刻意與舊版相同，舊版使用者打開網頁時瀏覽器會直接換成新版，並清除舊快取 `badminton-app-v1`
- 有新版部署時會自動更新，下次開啟即為新版

## 開發

需要 Node.js 20.19+ 或 22.12+。

```bash
npm install
npm run dev        # 本機開發 http://localhost:5173
npm run build      # 型別檢查 + 產出 dist/
npm run preview    # 預覽 build 結果
```

## 部署

`vite.config.ts` 設定 `base: './'`，build 出來的檔案可放在任何靜態主機或子路徑。

GitHub Pages（從 `main` 的 `/docs` 發佈）：

```bash
npm run build:pages   # 產出到 docs/，commit 後推上 main
```

## 專案結構

```
src/
  main.tsx              進入點（字型、樣式、StoreProvider）
  App.tsx               分頁切換與對話框
  store.tsx             全域狀態與所有操作（Context + useState，自動存 localStorage）
  types.ts              資料型別
  service-worker.ts     PWA 離線快取
  lib/
    logic.ts            分隊、狀態計算、批次匯入解析
    storage.ts          localStorage 讀寫與驗證
    seed.ts             第一次開啟的示範資料
    format.ts           時間 / 金額格式
  components/           Nav、預備組卡片、對話框、分段選擇器、圖示
  pages/                五個分頁
  styles/
    classical.css       設計系統 tokens 與元件 class
    app.css             版面樣式
```

## 資料

- localStorage key：`badminton-scheduler-v1`（與離線版 HTML 相同）
- 資料只存在當前裝置與瀏覽器；換裝置請用「設定 → 備份與還原」
