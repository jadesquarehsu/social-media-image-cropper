# Social Media Image Cropper (社群圖片裁切工具)

專為電商與社群經營者設計的圖片處理工具，提供精確的裁切尺寸與自動化輔助功能。

## 🌟 主要功能 (Key Features)

### 🛒 電商優化 (Shopline / Web)
- **Shopline 800x800 Format**:
  - **Auto Background**: 智慧偵測背景色並自動填充，避免突兀白邊。
  - **Contain Mode**: 完整顯示商品圖片，不進行裁切。
  - **Accessory Guides**: 
    - 🔴 **標準框**: 640x745px
    - 🟢 **配件框**: 640x700px (新增)
- **Web Formats**: 支援多種常見網頁尺寸 (2560x, 970x, etc)。

### 📱 社群媒體 (Social Media)
- **IG**: 4:5 (1080x1350), Story (1080x1920)
- **FB**: 1:1 (1200x1200), 4:3 (1200x900)
- **自訂格式**: 設定任意寬高，即時預覽。

### ⚡️ 批次與浮水印 (Batch & Watermark)
- **批次同步縮放**: 一次調整所有圖片大小，省時省力。
- **浮水印工具**: 支援圖片浮水印，可自訂透明度、位置與縮放比例。
- **無密碼登入**: 直接使用的便利介面。

## 🛠️ 如何使用 (Quick Start)

1. **安裝依賴**:
   ```bash
   pip3 install -r requirements.txt
   ```

2. **啟動應用程式**:
   ```bash
   python3 app.py
   ```

3. **開啟瀏覽器**:
   前往 `http://localhost:8080` 開始使用。

## 📂 專案結構

- `app.py`: Flask 後端伺服器 (極簡架構)。
- `static/app.js`: 核心邏輯 (Canvas 繪圖、事件處理、狀態管理)。
- `templates/index.html`: 前端介面與樣式連結。
- `requirements.txt`: Python 相依套件列表。

## 🚀 部署資訊

此專案已配置為可部署至 **Zeabur** 或 **GitHub Pages** (若是純靜態)。
目前使用 Flask + Gunicorn 架構部署。

## 📝 未來維護

若需要修改專案，請告訴 AI 助手：
> "請幫我修改 `Social Media Image` 專案..."
> "或者參考資料夾中的 `README.md`..."
