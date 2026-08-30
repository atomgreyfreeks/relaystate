# RELAYSTATE

**AIが下した判断は、その判断を必要とする次の一手に、本当に届いているのか。**
*When one AI decision creates an obligation for a later one, does that obligation actually arrive?*

2026年熊本地震の最初の72時間を、公的データを土台に**状態を持つ世界**として再構成し、
11の連続した判断を7体のLLMエージェントに担当させ、**4つのオーケストレーション方式 × 8シード = 32回**
完走させました。

方式によって適応力は大きく変わりました。しかし**32回すべてが、同じ一点で切れました。**

```bash
npm ci && npm run verify:numbers   # このREADMEの数字を全部その場で再計算します
```

このREADMEに書かれた数字はすべて、上のコマンドが追跡済みファイルから読み出して表示します。
手で打ち込んだ数字はひとつもありません。
*Every number below is printed by that one command, read from tracked files. None are typed by hand.*

---

## 0. 30秒 / In 30 seconds

| | |
|---|---|
| **観測したもの** | 状態が変化し続ける72時間のなかを走る、判断から判断への連鎖 |
| **見つけた連鎖の切断** | 発災3.5時間後（同日20:00頃）、八代の製紙工場への出動確認。**32/32が失敗。** エラーは出ず、記録も残る。作業だけが終わらない |
| **切断が方式に依存しないこと** | 適応力で84%差がついた4方式が、**この一点では全滅**。方式の優劣ではなく構造の問題 |
| **一条件だけ変えた結果** | 検証済みの判断を〈意思決定引継書〉に変換して渡す → **0/8 → 8/8**、2モデルとも初回成立、誤終結0 |
| **示していないこと** | [§6](#6-この結果が示さないこと--what-this-does-not-show) に全部書いてあります。範囲は狭いです |

---

## 1. 着想 — 連鎖はどこで切れるのか / Conception

> 「遠く離れた領域どうしは、見えない連鎖でつながっています。この連鎖は数式では解けません。」
> — 本ハッカソンのテーマより

私たちはこの「連鎖」を、**義務（obligation）の連鎖**として定義しました。

いま下した判断は、未来のどこかに「まだ終わっていない仕事」を置いていきます。
別の担当・別の組織・別の時刻の判断者が、それを引き取って閉じなければ、連鎖は完成しません。
そして義務は数値ではなく**意味**として運ばれます。「誰が・いつ・何を根拠に・何をもって終えるのか」。
だからこそ、意味を運べるLLMエージェントの世界でしか観測できません。

**では、意味は本当に運ばれているのか。** これが検証課題です。
記録に残っていることと、いま判断するAIの入力に届くことは、別のことです。

*We define the chain as a chain of obligations. A decision leaves unfinished work for a later
decision-maker, and that obligation travels as meaning — who, by when, on what evidence, closed
how. A log staying complete and the receiving model actually getting it are two different things.*

---

## 2. 設計 — 連鎖を観測できる世界 / Design

連鎖の切断を観測するには、**切断以外のすべてを固定**する必要があります。

| 固定したもの / Held fixed | 内容 |
|---|---|
| 世界 | 国土地理院の地形・標高、国交省の道路規制、JMA地震列、e-Stat人口、PLATEAU建物。414件のハッシュ連結イベント |
| 各AIの視界 | その時点までに公開された報告と、自分が過去に通した行動のみ。未来の報告・正解・他方式の状態は見えない |
| 判定 | 決定論的なルール検証コード。資源・宛先・数量・報告リンク・未知事項・引継状態がすべて通ったときだけ、モデル状態が変わる |
| モデル | `Qwen/Qwen3-32B-AWQ` rev `0499c3ac…`、temperature 0.2 / top_p 0.95（[plan JSON](docs/rescueworld/evidence/receipt-fork/receipt-fork-20260828-v1/receipt-fork-plan.json)にピン留め） |
| 再現 | ハッシュ連結リプレイ。全AI入出力を記録 |

| 変えたもの / Varied | 内容 |
|---|---|
| オーケストレーション方式 | 4種（固定分担 / 段階的重点化 / 証拠状態 / 証拠状態＋1回訂正） |
| シード | 8個（51201–51208） |

1判断あたり **7体のLLMエージェント** — 報告を読むScout 3体 → 根拠を照合するReviewer 3体 → 行動を決めるCoordinator 1体。
ランナーとルール検証器はコードであり、エージェントには数えていません。

```
32 完走キャンペーン · 352 採点済み判断 · 2,510 記録済みモデル呼び出し · 414 イベント · 11 連続判断
```

---

## 3. 連鎖の観測 — 3つの発見 / Observation

### 発見1 — 方式によって適応力は大きく変わる

72時間の終了時点に投影された「緊急未充足需要時間」。低いほど良い。固定分担を対照に、シードごとに対で比較。

| 方式 | 固定分担からの削減 | 8対のうち改善した数 |
|---|---:|---:|
| 段階的重点化 Guarded growth | **84%** | 8 / 8 |
| 証拠状態＋1回訂正 | 79% | 8 / 8 |
| 証拠状態 Evidence state | 75% | 8 / 8 |

方式は確かに効きます。ここまでは「よくできたマルチエージェント比較」です。

### 発見2 — しかし4方式すべてが、同じ一点で切れた

発災から3.5時間後、同日20:00頃。八代の製紙工場の緊急通報システムが復旧し、
**「すでに割り当て済みの部隊のうち、どれが製紙工場へ到達できるか」**を確認する判断が来ます。

この判断は、**同じ締切時刻に**下された直前の割当判断で名指しされた部隊しか、確認できません。
つまり判断4の出力が、判断5の入力に**正確に**届いている必要があります。

```
出動確認の試行:                    32
ルール検証器が通した数:             0
失敗を回避した方式:                 0     ← 84%差がついた4方式が、ここでは全滅
```

**これが本研究の中心的な観測です。** 適応力を84%改善する設計上の工夫は、
この切断に対して**何の効果もありませんでした**。エージェントを増やしても、配線を変えても、
証拠を厳しくしても直りません。切断はオーケストレーション方式の外側にあります。

そして最も厄介なのは、**何も壊れて見えないこと**です。
ルール検証器は誤った回答を正しく全部はじきました。だから**誤配は一度も起きていません**。
エラーログも空です。記録も完全に残っています。ただ、その仕事が永久に終わらないだけです。

実際にモデルが返した理由（[analysis JSON](docs/rescueworld/evidence/receipt-fork/receipt-fork-20260828-v1/receipt-fork-analysis.json) の生の値）:

```json
"short_reason": "No decision_receipts provided to act on."
```

前の判断は**記録には残っていました**。ただ、いま判断するモデルの手元には**無かった**。

### 発見3 — 一条件だけ変えると、初回で成立する

有効な先行割当が存在する8つの保存履歴を取り出し、**受け手の判断だけ**を2通り再実行しました。
配線もエージェント数もモデルも同じ。違いは1つだけです。

| | 空の引継欄 | 〈意思決定引継書〉 |
|---|---:|---:|
| Qwen3-32B | 0 / 8 | **8 / 8**（初回成立） |
| Qwen3.5-122B | 0 / 8 | **8 / 8**（初回成立） |
| 根拠のない「完了」 | — | **0件** |

引継書が固定するのは、会話でも要約でもなく、**条件付きの将来義務**です。

| 引継書の項目 | 例（判断5 → 判断6） |
|---|---|
| 何が決まったか | 宮崎の消防大隊1つを、八代の製紙工場へ割り当てる |
| 根拠は | その時点までに届いた、検証済み報告2件（ID指定） |
| 何が未確定か | 未確認の3項目を「不明」のまま保持する |
| 次の仕事は | 条件成立時に、この割当を確認または棄却する |
| どう閉じるか | CONFIRM / DECLINE / ESCALATE を必ず返す |

→ 実際に動く比較: `/relaystate-layer.html`（同一格子を、引継書なし／ありで2回走らせます）

---

## 4. 触って確かめる / Open and click

`npm run dev` のあと <http://127.0.0.1:5184> で開きます。

| ページ | 何が見えるか |
|---|---|
| `/rescueworld.html` | **72時間の世界。** 国土地理院の実地形の上を414イベントが流れ、11の判断を1つずつ開けます。`B` 全判断 / `T` 根拠 / `H` カメラ復帰 |
| `/relaystate-layer.html` | **機構の対比。** 同じ配線を引継書なし（上）／あり（下）で走らせ、左に「終わっていない作業」を積み上げます |
| `/decision-network.html` | **1つの提案の背後にある全作業。** 点はすべて記録済みのモデル呼び出し・ルール検証・状態変化です。見栄えのために足した点はありません |
| `/decision-network-ja.html` | 同じ網を日本語ラベルで、段階的重点化の走行から開きます |
| `/impact-view.html` | キャンペーン全体の結果と、引継書の成立結果 |
| `/decision-run-tree.html` | 記録された判断経路を木構造で |
| [プロセスマップ](docs/rescueworld/ORCHESTRATION-PROCESS-MAP.html) | 1つの判断が次の行動になるまで（初学者向け・サーバ不要） |
| [発表資料](docs/rescueworld/RELAYSTATE-PRESENTATION.html) | 提出スライド（サーバ不要） |

---

## 5. 環境構築と実行 / Setup and run

**必要環境:** Node.js 20 以降（20 / 22 で確認）。GPU・APIキー・ネットワーク接続は**不要**です。
記録済みの実行結果を読み直すだけで、すべての数字を再現できます。

```bash
git clone https://github.com/atomgreyfreeks/relaystate.git
cd relaystate
npm ci
```

| コマンド | 何をするか | 所要 |
|---|---|---|
| `npm run verify:numbers` | READMEの数字を追跡済みファイルから全部再計算して表示 | 数秒 |
| `npm run verify:evidence` | ファイルハッシュ・モデルID・リビジョン・採択件数を照合 | 数秒 |
| `npm run verify:data` | 世界データとリプレイの整合を検証 | 数十秒 |
| `npm run verify` | 上記すべて＋型検査＋ビルド＋同梱物検査 | 1–2分 |
| `npm run dev` | ビューアを <http://127.0.0.1:5184> で起動 | — |
| `npm run test:browser` | ビューアのスモークテスト | — |

冷たい状態から確認したい場合は、`npm ci && npm run verify` の1行で足ります。

---

## 6. 実行結果・生ログ・解析データ / Logs and analysis data

| ファイル | 中身 |
|---|---|
| `product/disaster-replay/runs/kumamoto-2026-full-incident/260728-72h/timeline.jsonl` | 414行のハッシュ連結イベント。1行1イベント、各行に `event_sha256` |
| `product/disaster-replay/runs/*/certificate.json` | 実行証明書（入力ハッシュ・最終状態ハッシュ） |
| `public/decision-network-data.json` | 32キャンペーン分の全作業。3,686ノード / 5,150エッジ、判断ごとの検証結果つき |
| `public/impact-view-data.json` | シード対ごとの成果（発見1の元データ） |
| `docs/rescueworld/evidence/receipt-fork/*/[…]-plan.json` | 引継書フォークの実行計画。モデルID・リビジョン・温度・シード・アーム・ジョブ順序をピン留め |
| `docs/rescueworld/evidence/receipt-fork/*/[…]-analysis.json` | ジョブ単位の結果。モデルが返した判断・違反コード・採択可否・呼び出し回数 |
| `experiment/results/production-analysis.json` | 先行する事前登録ベンチマークの結果（研究履歴として保存） |
| `product/disaster-replay/schemas/`, `.../tests/` | スキーマと検証テスト |

**含まれていないもの（明記します）:** モデルの**プロンプトと生の応答テキスト**は同梱していません。
同梱しているのは、ハッシュでピン留めされた実行計画と、ジョブ単位で構造化された判断結果・違反コードです。
公開した数字を1つ残らず数え直すには十分ですが、モデルの散文をそのまま読み返すには不十分です。

*Not included, stated plainly: raw prompt and completion text. Included: the hash-pinned run plan
and the per-job structured decision with violation codes — enough to recount every published
number, not enough to re-read the model's prose.*

---

## 7. この結果が示さないこと / What this does not show

論文が全編を通して述べている通り、結果は**狭い**です。

- 2つの判断は**同じ締切時刻**を共有しています。**経過時間をまたぐ記憶の検証ではありません。**
- 8回の実行は**同一内容の引継書**を使っています。1つの引き継ぎを8回反復した標本であり、独立した8事例ではありません。
- 対照群は**その事実にまったくアクセスできません**。したがって「書式が効いた」のか「答えを与えた」のかを分離できません。
- 2モデルとも**Qwen系統**です。系統をまたぐ再現ではありません。
- 発見1の84%は**この演習内のモデル化された作業量**の結果です。救われた命でも、実際の出動でもありません。
- モデル化された部隊・派遣・成果は演習上の構成物です。**人ではありません。**
- 永続化・並行する引継書・競合・再割当・実運用効果は**未検証**です。

次の実験（事実を揃えた対照群、能動的な棄却、時間をまたぐ永続化）は
[論文](docs/rescueworld/RESCUE-WORLD-PAPER-DRAFT.md) §12 に仕様として書いてあります。

RELAYSTATEは**既存の判断主体を置き換えません**。軌道計算・シミュレーション・指令権限はそのまま残し、
判断イベントの後ろに引継書の生成を1段足すだけの層です。

---

## 8. さらに読む / Read more

| 時間 | 読むもの |
|---|---|
| 2分 | [ONE-SHEET](docs/rescueworld/ONE-SHEET.md) — 何であるか、正確な数字、主張してはいけないこと |
| 10分 | [START-HERE](docs/rescueworld/START-HERE.md) — 全体の索引 |
| 30分 | [FULL-NARRATIVE](docs/rescueworld/FULL-NARRATIVE.md) — 経緯を平易に |
| 全部 | [論文ドラフト](docs/rescueworld/RESCUE-WORLD-PAPER-DRAFT.md) — 手法・結果・妥当性への脅威・主張の境界 |
| 32回の走行で何が起きたか | [CONTINUOUS-CAMPAIGN-FINDINGS](docs/rescueworld/CONTINUOUS-CAMPAIGN-FINDINGS.md) — 発見1の詳細 |

---

## 9. 構成 / Layout

```
rescueworld.html            72時間ビューア
public/                     その他のビューアと焼き込み済みデータ
src/rescueworld/            ビューア実装
scripts/                    検証コマンド
docs/rescueworld/           読み物・発表資料・証拠バンドル
docs/internal/              制作時の仕様書と原稿（読むのに必要ではありません）
product/disaster-replay/    封印済みリプレイデータ、スキーマ、証明書、検証器
experiment/                 先行する事前登録ベンチマーク（研究履歴）
```

## データと帰属 / Data and attribution

地形・道路規制・避難所・建物モデルは、国土地理院・国土交通省・Project PLATEAU・気象庁・e-Stat の
**実際の公開データ**です。記録内のAI判断は**すべて明示的にシミュレーションであり、そう表示されています**。
[`NOTICE.md`](NOTICE.md) および
[`product/disaster-replay/DATA-SOURCES.md`](product/disaster-replay/DATA-SOURCES.md) を参照してください。

このリポジトリを編集する人向けの作業ノートは [`AGENTS.md`](AGENTS.md) にあります。
