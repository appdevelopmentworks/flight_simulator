# WebFlight Simulator Pro

ブラウザで動作する本格的なフライトシミュレーターです。

## 特徴

- 🛩️ リアルな航空力学シミュレーション
- 🎮 キーボード・ゲームパッド対応
- 🌤️ 動的な天候システム
- 📊 詳細なコックピット計器
- 🗺️ リアルタイムミニマップ
- 🎥 複数のカメラビュー

## 必要要件

- Node.js 18.0以上
- モダンブラウザ（Chrome, Firefox, Safari, Edge）
- WebGL 2.0対応GPU

## インストール方法

```bash
# リポジトリをクローン
git clone [repository-url]
cd Flight_SimulatorClaude

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev
```

ブラウザで `http://localhost:3000` を開いてください。

## 技術スタック

- **Next.js 15**: App Router対応のReactフレームワーク
- **React 19**: 最新のReact
- **Three.js / React Three Fiber**: 3Dグラフィックス
- **TypeScript**: 型安全な開発
- **Tailwind CSS**: スタイリング
- **Zustand**: 状態管理

## 操作方法

### 基本操作
- **↑/↓**: ピッチ（機首上げ下げ）
- **←/→**: ロール（左右傾き）
- **A/D**: ヨー（機首左右）
- **W/S**: スロットル増減
- **X**: スロットルアイドル
- **Z**: スロットル全開

### システム
- **F/G**: フラップ上げ/下げ
- **L**: ランディングギア
- **B**: ブレーキ
- **P**: オートパイロット

### カメラ
- **1**: コックピット視点
- **2**: 外部視点
- **3**: タワー視点
- **4**: フリーカメラ

### その他
- **ESC**: ポーズ
- **M**: マップ表示切替
- **H**: ヘルプ表示

## ビルド方法

```bash
# プロダクションビルド
npm run build

# ビルドしたアプリを起動
npm start
```

## ライセンス

MIT License

## 開発者

WebFlight Simulator Pro Development Team

---

⚠️ **注意**: このシミュレーターは教育・エンターテインメント目的であり、実際の飛行訓練には使用できません。
