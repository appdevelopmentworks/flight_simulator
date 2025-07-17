@echo off
echo ===================================
echo WebFlight Simulator Pro セットアップ
echo ===================================
echo.

echo Node.jsバージョンを確認中...
node -v
echo.

echo 依存関係をインストール中...
npm install
echo.

echo ===================================
echo セットアップが完了しました！
echo.
echo 開発サーバーを起動するには:
echo   npm run dev
echo.
echo ビルドするには:
echo   npm run build
echo.
echo ビルドしたアプリを起動するには:
echo   npm start
echo ===================================
pause
