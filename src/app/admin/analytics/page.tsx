import type { Metadata } from 'next';
import { fetchStats, type StatsData } from '@/lib/statsQueries';
import { soccerIssues, CATEGORY_META } from '@/data/soccerIssues';
import DailyTrendChart from '@/components/DailyTrendChart';
import { getRecoveryInfo } from '@/lib/adminAuth';
import { isAuthed, login, logout, resetPassword } from './actions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'アクセス解析 | プレーテーマ辞典',
  robots: { index: false, follow: false },
};

// 項目ID → 表示タイトル / カテゴリの対応表（ダッシュボードで読みやすく表示するため）
const ISSUE_TITLE = new Map(soccerIssues.map((i) => [i.id, i.displayTitle]));
const ISSUE_CATEGORY = new Map(soccerIssues.map((i) => [i.id, i.category]));

// ─── 小さな表示部品 ──────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 mt-6 first:mt-0">
      {children}
    </p>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm px-5 py-4 mb-4">
      {children}
    </div>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-3 py-3 text-center">
      <p className="text-[10px] text-gray-400 font-bold mb-1">{label}</p>
      <p className="text-xl font-black text-gray-900 tabular-nums leading-none">{value}</p>
      {sub && <p className="text-[10px] text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function BarList({
  items,
  max,
  color = '#16A34A',
  format = (k: string) => k || '(なし)',
}: {
  items: { key: string; count: number }[];
  max?: number;
  color?: string;
  format?: (key: string) => string;
}) {
  if (items.length === 0) return <p className="text-xs text-gray-400">まだデータがありません</p>;
  const m = max ?? Math.max(...items.map((i) => i.count), 1);
  return (
    <div className="space-y-2">
      {items.map((it) => (
        <div key={it.key}>
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-xs font-bold text-gray-700 truncate max-w-[70%]">{format(it.key)}</span>
            <span className="text-xs font-black tabular-nums text-gray-500">{it.count.toLocaleString()}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div className="h-1.5 rounded-full" style={{ width: `${(it.count / m) * 100}%`, backgroundColor: color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function countryFlag(cc: string): string {
  if (!/^[A-Z]{2}$/.test(cc)) return '🌐';
  return String.fromCodePoint(...[...cc].map((c) => 127397 + c.charCodeAt(0)));
}

function categoryLabel(cat: string): string {
  const meta = CATEGORY_META[cat as keyof typeof CATEGORY_META];
  return meta ? `${meta.emoji} ${meta.short}` : cat || '(不明)';
}

function issueLabel(id: string): string {
  const title = ISSUE_TITLE.get(id);
  if (!title) return id || '(不明)';
  const cat = ISSUE_CATEGORY.get(id);
  const emoji = cat ? CATEGORY_META[cat as keyof typeof CATEGORY_META]?.emoji : undefined;
  return emoji ? `${emoji} ${title}` : title;
}

// ─── Web Vitals ──────────────────────────────────────────

const VITALS_META: Record<string, { label: string; good: number; fmt: (v: number) => string }> = {
  LCP: { label: 'LCP（表示速度）', good: 2500, fmt: (v) => `${(v / 1000).toFixed(2)}s` },
  INP: { label: 'INP（操作反応）', good: 200, fmt: (v) => `${Math.round(v)}ms` },
  CLS: { label: 'CLS（ズレ）', good: 100, fmt: (v) => (v / 1000).toFixed(3) }, // 1000倍で保存
  FCP: { label: 'FCP', good: 1800, fmt: (v) => `${(v / 1000).toFixed(2)}s` },
  TTFB: { label: 'TTFB', good: 800, fmt: (v) => `${Math.round(v)}ms` },
};

// ─── 認証ビュー ──────────────────────────────────────────

function LoginView({ error }: { error: boolean }) {
  return (
    <div className="flex flex-col flex-1 bg-[#F8FAFC] items-center justify-center px-5">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 w-full max-w-[320px] text-center">
        <div className="text-3xl mb-2">📊</div>
        <h1 className="text-lg font-black text-gray-900 mb-1">アクセス解析</h1>
        <p className="text-xs text-gray-400 mb-5">管理者パスワードを入力してください</p>
        <form action={login}>
          <input
            type="password"
            name="password"
            autoFocus
            className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-base text-gray-900 focus:border-green-400 focus:outline-none transition-colors mb-3"
            placeholder="パスワード"
          />
          {error && <p className="text-xs text-rose-500 font-bold mb-3">パスワードが違います</p>}
          <button
            type="submit"
            className="w-full bg-gray-900 text-white font-bold py-3 rounded-2xl text-sm active:scale-[0.98] transition-all"
          >
            ログイン
          </button>
        </form>
        <a href="/admin/analytics?view=reset" className="block text-xs text-gray-400 font-bold mt-4 underline">
          パスワードをお忘れですか？
        </a>
      </div>
    </div>
  );
}

const RESET_ERROR_MESSAGES: Record<string, string> = {
  auth: 'メールアドレスまたは答えが正しくありません',
  weak: '新しいパスワードは8文字以上にしてください',
  mismatch: '確認用パスワードが一致しません',
};

function ResetView({
  error,
  success,
  question,
}: {
  error?: string;
  success: boolean;
  question: string | null;
}) {
  const errorMessage = error ? RESET_ERROR_MESSAGES[error] : null;
  const inputClass =
    'w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-base text-gray-900 focus:border-green-400 focus:outline-none transition-colors mb-3';
  const labelClass = 'block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-widest';
  return (
    <div className="flex flex-col flex-1 bg-[#F8FAFC] items-center justify-center px-5">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 w-full max-w-[320px] text-center">
        <div className="text-3xl mb-2">🔑</div>
        <h1 className="text-lg font-black text-gray-900 mb-1">パスワードの再設定</h1>
        {success ? (
          <>
            <p className="text-xs text-green-600 font-bold mt-4 mb-4">パスワードを変更しました。ログインしてください。</p>
            <a
              href="/admin/analytics"
              className="block w-full bg-gray-900 text-white font-bold py-3 rounded-2xl text-sm active:scale-[0.98] transition-all"
            >
              ログイン画面へ
            </a>
          </>
        ) : !question ? (
          <p className="text-xs text-gray-400 mt-4 leading-relaxed">
            再設定用の情報がまだ設定されていません。管理者にご確認ください。
          </p>
        ) : (
          <form action={resetPassword} className="text-left">
            <p className="text-xs text-gray-400 mb-5 leading-relaxed">
              登録済みのメールアドレスと秘密の質問への答えを入力してください。
            </p>
            <label className={labelClass}>メールアドレス</label>
            <input type="email" name="email" autoFocus className={inputClass} placeholder="you@example.com" />
            <p className="text-xs font-bold text-gray-700 mb-1.5 leading-relaxed">{question}</p>
            <input type="text" name="answer" className={inputClass} placeholder="答え" />
            <label className={labelClass}>新しいパスワード（8文字以上）</label>
            <input type="password" name="newPassword" className={inputClass} placeholder="新しいパスワード" />
            <label className={labelClass}>新しいパスワード（確認）</label>
            <input type="password" name="confirm" className={inputClass} placeholder="もう一度入力" />
            {errorMessage && <p className="text-xs text-rose-500 font-bold mb-3">{errorMessage}</p>}
            <button
              type="submit"
              className="w-full bg-gray-900 text-white font-bold py-3 rounded-2xl text-sm active:scale-[0.98] transition-all"
            >
              パスワードを変更
            </button>
          </form>
        )}
        <a href="/admin/analytics" className="block text-xs text-gray-400 font-bold mt-4 underline">
          ログイン画面に戻る
        </a>
      </div>
    </div>
  );
}

const EVENT_LABELS: Record<string, string> = {
  category_select: 'カテゴリ選択',
  issue_expand: '項目を展開',
  cta_click: 'ボタンクリック',
};

// ─── ページ本体 ──────────────────────────────────────────

export default async function AnalyticsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; view?: string; reset?: string }>;
}) {
  const sp = await searchParams;

  if (sp.view === 'reset') {
    const info = await getRecoveryInfo();
    return <ResetView error={sp.error} success={sp.reset === 'success'} question={info?.question ?? null} />;
  }

  if (!(await isAuthed())) {
    return <LoginView error={sp.error === '1'} />;
  }

  const stats: StatsData = await fetchStats();

  return (
    <div className="flex flex-col flex-1 bg-[#F8FAFC] px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-black text-gray-900">📊 アクセス解析</h1>
          <p className="text-[10px] text-gray-400">プレーテーマ辞典・直近30日（日本時間）・生データは90日保持</p>
        </div>
        <form action={logout}>
          <button type="submit" className="text-xs text-gray-400 font-bold py-2 px-3">
            ログアウト
          </button>
        </form>
      </div>

      {/* GA4 導線 */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm px-5 py-4 mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black text-gray-900 mb-1">📈 セッション・リアルタイム・流入経路は GA4 で</p>
          <p className="text-[10px] text-gray-400 leading-relaxed">
            滞在時間や直帰率、今まさに見ている人数、検索・広告からの流入詳細は、こちらではなく Google アナリティクス（GA4）を確認してください。
          </p>
        </div>
        <a
          href="https://analytics.google.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 bg-gray-900 text-white text-xs font-bold py-2.5 px-4 rounded-2xl whitespace-nowrap active:scale-[0.98] transition-all"
        >
          GA4を開く ↗
        </a>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <Kpi label="今日の訪問者" value={stats.today.visitors.toLocaleString()} />
        <Kpi label="今日のPV" value={stats.today.pageviews.toLocaleString()} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Kpi label="訪問者(30日)" value={stats.last30.visitors.toLocaleString()} sub="日次ユニーク計" />
        <Kpi label="PV(30日)" value={stats.last30.pageviews.toLocaleString()} />
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2">
        <Kpi label="カテゴリ選択" value={stats.last30.categorySelects.toLocaleString()} sub="30日" />
        <Kpi label="項目を展開" value={stats.last30.issueExpands.toLocaleString()} sub="30日" />
      </div>

      <SectionLabel>日次推移</SectionLabel>
      <Card>
        {stats.daily.length > 0 ? (
          <DailyTrendChart data={stats.daily} />
        ) : (
          <p className="text-xs text-gray-400">まだデータがありません</p>
        )}
      </Card>

      <SectionLabel>よく読まれたプレーテーマ（30日）</SectionLabel>
      <Card>
        <BarList items={stats.issues} color="#16A34A" format={issueLabel} />
      </Card>

      <SectionLabel>よく選ばれたカテゴリ（30日）</SectionLabel>
      <Card>
        <BarList items={stats.categories} color="#0D9488" format={categoryLabel} />
      </Card>

      <SectionLabel>ページ別ビュー</SectionLabel>
      <Card>
        <BarList items={stats.topPages} color="#16A34A" />
      </Card>

      <SectionLabel>参照元（外部サイト）</SectionLabel>
      <Card>
        <BarList items={stats.referrers} color="#0D9488" />
      </Card>

      <SectionLabel>イベント集計（30日）</SectionLabel>
      <Card>
        <BarList items={stats.events} color="#7C3AED" format={(k) => EVENT_LABELS[k] ?? k} />
      </Card>

      <SectionLabel>環境</SectionLabel>
      <div className="grid grid-cols-2 gap-3 mb-1">
        <Card>
          <p className="text-[10px] font-black text-gray-400 mb-2">デバイス</p>
          <BarList items={stats.devices} color="#EA580C" />
        </Card>
        <Card>
          <p className="text-[10px] font-black text-gray-400 mb-2">ブラウザ</p>
          <BarList items={stats.browsers} color="#DC2626" />
        </Card>
      </div>
      <Card>
        <p className="text-[10px] font-black text-gray-400 mb-2">国・地域</p>
        <BarList items={stats.countries} format={(k) => `${countryFlag(k)} ${k}`} />
      </Card>

      <SectionLabel>表示速度（Web Vitals・7日間のp75）</SectionLabel>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {(['LCP', 'INP', 'CLS'] as const).map((m) => {
          const row = stats.vitals.find((v) => v.metric === m);
          const meta = VITALS_META[m];
          const isGood = row ? row.p75 <= meta.good : null;
          return (
            <div key={m} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-3 py-3 text-center">
              <p className="text-[10px] text-gray-400 font-bold mb-1">{meta.label}</p>
              <p className="text-lg font-black tabular-nums leading-none" style={{ color: row ? (isGood ? '#15803D' : '#B45309') : '#CBD5E1' }}>
                {row ? meta.fmt(row.p75) : '—'}
              </p>
              {row && <p className="text-[9px] text-gray-300 mt-1">{row.samples}件</p>}
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-gray-300 text-center pb-4">
        Cookie不使用・IP非保存の自前計測 / 生イベント90日保持・日次集計は恒久保持
      </p>
    </div>
  );
}
