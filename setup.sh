#!/bin/bash

echo "==================================="
echo "WebFlight Simulator Pro セットアップ"
echo "==================================="
echo ""

# Node.jsのバージョン確認
echo "Node.jsバージョンを確認中..."
node_version=$(node -v)
echo "Node.js: $node_version"
echo ""

# npmパッケージのインストール
echo "依存関係をインストール中..."
npm install
echo ""

echo "==================================="
echo "セットアップが完了しました！"
echo ""
echo "開発サーバーを起動するには:"
echo "  npm run dev"
echo ""
echo "ビルドするには:"
echo "  npm run build"
echo ""
echo "ビルドしたアプリを起動するには:"
echo "  npm start"
echo "==================================="
