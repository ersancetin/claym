import type { ReactNode } from "react";
import { AlertTriangle, Calculator, CalendarRange, Clock, FileText, Info, Scale, Sigma } from "lucide-react";
import { wageAt, type CalculationResult, type CompensationRow } from "@/lib/actuarial-engine";
import type { ActuarialInputs } from "@/components/ParameterPanel";
import { TRH2010 } from "@/data/trh2010";
import { MIN_WAGES, LATEST_MIN_WAGE } from "@/data/min-wages";
import { PRECEDENTS } from "@/data/precedents";
import { METHOD_NOTES } from "@/data/methodology";
import { useCountUp, useMounted } from "@/lib/motion";
import { cn, d, tl, years } from "@/lib/utils";

const card = "rounded-3xl bg-white border border-line shadow-sm";

/* ---------- Boş durum ---------- */

export function EmptyState({ busy }: { busy: boolean }) {
    const steps = [
        { icon: FileText, title: "Bilgileri girin", text: "Cinsiyet, tarihler ve oranlar." },
        { icon: Calculator, title: "Hesapla'ya basın", text: "Tüm kalemler tek seferde hesaplanır." },
        { icon: CalendarRange, title: "Sonucu inceleyin", text: "Dönem analizi, tablolar, PDF rapor." },
    ];
    return (
        <section className={cn(card, "relative overflow-hidden p-6 sm:p-10 animate-rise [animation-delay:280ms]")}>
            <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand-soft blur-2xl" />
            <div className="relative">
                <div className={cn("flex h-14 w-14 items-center justify-center rounded-2xl bg-ink text-white shadow-lg", busy && "animate-pulse")}>
                    <Calculator className="h-6 w-6" />
                </div>
                <h2 className="mt-5 font-serif text-2xl sm:text-3xl font-semibold">
                    {busy ? "Hesaplanıyor…" : "Hesaplamaya hazır"}
                </h2>
                <p className="mt-2 max-w-[52ch] text-[15px] leading-relaxed text-muted">
                    Dosya bilgilerini doldurup <span className="font-medium text-ink">Hesapla</span> butonuna bastığınızda toplam tazminat,
                    kalem kalem dağılım ve dönem tabloları burada görünür.
                </p>
                <ol className="mt-8 grid gap-3 sm:grid-cols-3">
                    {steps.map((s, i) => (
                        <li key={s.title} className="flex gap-3 rounded-2xl bg-paper p-4 ring-1 ring-line sm:flex-col">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-brand ring-1 ring-line">
                                <s.icon className="h-4 w-4" />
                            </span>
                            <span>
                                <span className="block text-sm font-semibold">{i + 1}. {s.title}</span>
                                <span className="block text-[13px] text-muted mt-0.5">{s.text}</span>
                            </span>
                        </li>
                    ))}
                </ol>
                {busy && (
                    <div className="mt-8 space-y-3" aria-hidden="true">
                        <div className="h-4 w-1/3 rounded-full bg-paper overflow-hidden"><div className="h-full w-full animate-shimmer bg-gradient-to-r from-paper via-line to-paper" /></div>
                        <div className="h-3 w-full rounded-full bg-paper overflow-hidden"><div className="h-full w-full animate-shimmer bg-gradient-to-r from-paper via-line to-paper" /></div>
                    </div>
                )}
            </div>
        </section>
    );
}

/* ---------- Tazminat özeti ---------- */

function Amount({ value, delay = 0, className }: { value: number; delay?: number; className?: string }) {
    const v = useCountUp(value, 1300, delay);
    return <span className={className}>{tl(v)}</span>;
}

export function Summary({ r }: { r: CalculationResult }) {
    const mounted = useMounted(120);
    const parts = [
        { key: "temp", label: "Geçici iş göremezlik", value: r.tempTotal, color: "bg-temp", note: r.minorWarning },
        { key: "care", label: "Geçici bakıcı gideri", value: r.caretakerTotal, color: "bg-care" },
        { key: "known", label: "Sürekli iş göremezlik, bilinen dönem", value: r.permTotal, color: "bg-known" },
        { key: "active", label: "Sürekli iş göremezlik, bilinmeyen aktif dönem", value: r.futureActiveTotal, color: "bg-active" },
        { key: "passive", label: "Sürekli iş göremezlik, bilinmeyen pasif dönem", value: r.futurePassiveTotal, color: "bg-passive" },
    ];
    const total = r.grandTotal;

    return (
        <section aria-labelledby="summary-title" className={cn(card, "relative overflow-hidden p-5 sm:p-8 animate-rise")}>
            <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-soft/80 blur-2xl" />
            <div className="relative">
                <h2 id="summary-title" className="text-sm font-medium text-muted">Toplam maddi tazminat</h2>
                <p className="num font-serif text-[2.1rem] sm:text-5xl lg:text-[3.4rem] font-semibold leading-tight mt-1 tracking-tight break-words">
                    <Amount value={total} /> <span className="text-xl sm:text-3xl text-muted font-medium">TL</span>
                </p>

                <div className="mt-6 flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-paper" aria-hidden="true">
                    {total > 0 &&
                        parts.filter((p) => p.value > 0).map((p, i) => (
                            <div
                                key={p.key}
                                className={cn(p.color, "h-full first:rounded-l-full last:rounded-r-full transition-[width] duration-[1100ms] ease-out")}
                                style={{ width: mounted ? `${(p.value / total) * 100}%` : "0%", transitionDelay: `${i * 90}ms` }}
                            />
                        ))}
                </div>

                <dl className="mt-5 divide-y divide-line">
                    {parts.map((p, i) => (
                        <div key={p.key} className="py-3.5 animate-rise" style={{ animationDelay: `${150 + i * 70}ms` }}>
                            <div className="flex items-start justify-between gap-4">
                                <dt className="flex items-start gap-2.5 text-[14px] sm:text-[15px] leading-snug">
                                    <span className={cn(p.color, "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full")} />
                                    {p.label}
                                </dt>
                                <dd className="num text-right whitespace-nowrap font-semibold text-[14px] sm:text-[15px]">
                                    <Amount value={p.value} delay={150 + i * 70} /> TL
                                    <span className="block text-xs font-normal text-muted">
                                        {total > 0 ? `%${((p.value / total) * 100).toLocaleString("tr-TR", { maximumFractionDigits: 1 })}` : "%0"}
                                    </span>
                                </dd>
                            </div>
                            {p.key === "known" && r.agiNote && (
                                <p className="mt-2 ml-5 flex gap-2 rounded-xl bg-sky-50 border border-sky-200 p-3 text-[13px] leading-snug text-sky-900">
                                    <Info className="h-4 w-4 shrink-0 mt-px" />
                                    {r.agiNote}
                                </p>
                            )}
                            {p.note && (
                                <p className="mt-2 ml-5 flex gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-[13px] leading-snug text-amber-900">
                                    <AlertTriangle className="h-4 w-4 shrink-0 mt-px" />
                                    {p.note}
                                </p>
                            )}
                        </div>
                    ))}
                </dl>
            </div>
        </section>
    );
}

/* ---------- Yaş ve bakiye ömür ---------- */

function MetricValue({ value, delay }: { value: number; delay: number }) {
    const v = useCountUp(value, 1000, delay);
    return <>{v.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</>;
}

export function Metrics({ r }: { r: CalculationResult }) {
    const items = [
        { label: "Kaza tarihindeki yaş", value: r.exactAge, unit: "yaş" },
        { label: "Bakiye ömür (TRH-2010)", value: r.lifeExpectancy, unit: "yıl" },
        { label: "Beklenen ömür sonu", value: r.deathAge, unit: "yaş", sub: d(r.deathDate) },
    ];
    return (
        <div className="grid gap-3 sm:grid-cols-3">
            {items.map((m, i) => (
                <div
                    key={m.label}
                    className={cn(card, "flex items-center justify-between gap-3 p-4 sm:block sm:p-5 animate-rise")}
                    style={{ animationDelay: `${200 + i * 80}ms` }}
                >
                    <p className="text-[13px] text-muted leading-tight">{m.label}</p>
                    <div className="text-right sm:text-left">
                        <p className="num sm:mt-2 text-xl sm:text-2xl font-semibold">
                            <MetricValue value={m.value} delay={200 + i * 80} />
                            <span className="ml-1 text-sm font-normal text-muted">{m.unit}</span>
                        </p>
                        {m.sub && <p className="num text-xs text-muted mt-0.5">{m.sub}</p>}
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ---------- Dönem çizelgesi ---------- */

function Bar({ segments }: { segments: { label: string; days: number; color: string; from: Date; to: Date }[] }) {
    const mounted = useMounted(350);
    const shown = segments.filter((s) => s.days > 0);
    const sum = shown.reduce((a, s) => a + s.days, 0) || 1;
    return (
        <div>
            <div className="flex h-11 w-full overflow-hidden rounded-xl gap-0.5 bg-paper">
                {shown.map((s, i) => {
                    const pct = Math.max(6, (s.days / sum) * 100);
                    return (
                        <div
                            key={s.label}
                            className={cn(s.color, "flex items-center overflow-hidden px-3 text-white text-[13px] font-medium transition-[width] duration-1000 ease-out")}
                            style={{ width: mounted ? `${pct}%` : "0%", transitionDelay: `${i * 150}ms` }}
                            title={`${s.label}: ${years(s.days)} yıl`}
                        >
                            {pct > 22 && <span className="truncate">{s.label}</span>}
                        </div>
                    );
                })}
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 text-[13px]">
                {shown.map((s) => (
                    <div key={s.label} className="rounded-xl bg-paper px-3 py-2.5">
                        <p className="flex items-center gap-2 font-medium">
                            <span className={cn(s.color, "h-2 w-2 rounded-full")} />
                            {s.label}
                            <span className="num ml-auto text-muted font-normal">{years(s.days)} yıl</span>
                        </p>
                        <p className="num mt-0.5 pl-4 text-muted">{d(s.from)} – {d(s.to)}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function Timeline({ r }: { r: CalculationResult }) {
    return (
        <section aria-labelledby="tl-title" className={cn(card, "p-5 sm:p-7 space-y-6 animate-rise [animation-delay:420ms]")}>
            <h3 id="tl-title" className="flex items-center gap-2 font-serif text-lg font-semibold">
                <Clock className="h-4 w-4 text-brand" /> Dönem analizi
            </h3>
            <div>
                <p className="text-[13px] text-muted mb-2">Hesap tarihine göre</p>
                <Bar
                    segments={[
                        { label: "Bilinen dönem", days: r.knownDays, color: "bg-known", from: r.knownStart, to: r.knownEnd },
                        { label: "Bilinmeyen dönem", days: r.futureDays, color: "bg-future", from: r.futureStart, to: r.deathDate },
                    ]}
                />
            </div>
            <div>
                <p className="text-[13px] text-muted mb-2">Çalışma çağına göre</p>
                <Bar
                    segments={[
                        { label: "Aktif dönem", days: r.activeDays, color: "bg-active", from: r.activeStart, to: r.activeEnd },
                        { label: "Pasif dönem", days: r.passiveDays, color: "bg-passive", from: r.passiveStart, to: r.passiveEnd },
                    ]}
                />
            </div>
            <p className="flex gap-2 rounded-xl bg-paper p-3 text-[13px] leading-snug text-muted">
                <Info className="h-4 w-4 shrink-0 mt-px text-brand" />
                Bilinen dönem her dönemin kendi asgari ücretiyle, bilinmeyen dönem hesap tarihindeki asgari ücretle hesaplanır.
                Bu yüzden hesap tarihi aynı asgari ücret dönemi içinde kaydırıldığında tutar bir kalemden diğerine geçer, toplam değişmez.
            </p>
        </section>
    );
}

/* ---------- Hesap tabloları ---------- */

const typeLabel: Record<NonNullable<CompensationRow["type"]>, [string, string]> = {
    active: ["Aktif", "bg-blue-50 text-active"],
    passive: ["Pasif", "bg-amber-50 text-passive"],
    temp: ["Geçici", "bg-orange-50 text-temp"],
    perm: ["Bilinen", "bg-slate-100 text-known"],
    caretaker: ["Bakıcı", "bg-violet-50 text-care"],
};

export function CompensationTable({ title, rows, total, wageType = "net" }: { title: string; rows: CompensationRow[]; total: number; wageType?: "net" | "gross" }) {
    if (rows.length === 0) return null;
    return (
        <section className={cn(card, "overflow-hidden")}>
            <header className="flex items-center justify-between gap-4 px-4 sm:px-6 py-4 border-b border-line">
                <h3 className="font-serif text-base sm:text-lg font-semibold leading-snug">{title}</h3>
                <span className="num font-semibold whitespace-nowrap rounded-lg bg-brand-soft px-2.5 py-1 text-sm text-brand">{tl(total)} TL</span>
            </header>
            <div className="max-h-[440px] overflow-auto">
                <table className="w-full text-[13px] sm:text-sm">
                    <thead className="sticky top-0 z-10 bg-paper/95 backdrop-blur text-muted text-left">
                        <tr>
                            <th className="font-medium pl-4 sm:pl-6 pr-2 py-2.5">Dönem</th>
                            <th className="font-medium px-2 py-2.5 text-right">Gün</th>
                            <th className="hidden sm:table-cell font-medium px-3 py-2.5 text-right whitespace-nowrap">Asgari ücret ({wageType === "gross" ? "brüt" : "net"})</th>
                            <th className="font-medium pl-2 pr-4 sm:pr-6 py-2.5 text-right">Tutar</th>
                        </tr>
                    </thead>
                    <tbody className="num divide-y divide-line">
                        {rows.map((row, i) => (
                            <tr key={i} className="hover:bg-brand-soft/40 transition-colors">
                                <td className="pl-4 sm:pl-6 pr-2 py-2.5">
                                    <span className="whitespace-nowrap">{d(row.start)} – {d(row.end)}</span>
                                    <span className="mt-1 flex flex-wrap gap-1 sm:mt-0 sm:ml-2 sm:inline-flex align-middle">
                                        {row.type && (
                                            <span className={cn("rounded px-1.5 py-0.5 text-[11px] font-medium", typeLabel[row.type][1])}>
                                                {typeLabel[row.type][0]}
                                            </span>
                                        )}
                                        {row.agiExcluded && (
                                            <span className="rounded bg-sky-50 px-1.5 py-0.5 text-[11px] font-medium text-sky-800" title="18 yaş altı dönem, AGİ hariç net asgari ücret">
                                                AGİ hariç
                                            </span>
                                        )}
                                        {row.projected && (
                                            <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-800" title="Asgari ücret henüz açıklanmadı; güncel ücretle projeksiyon">
                                                Güncel ücretle
                                            </span>
                                        )}
                                    </span>
                                    <span className="block sm:hidden text-[11px] text-muted mt-0.5">Ücret: {tl(row.wage)}</span>
                                </td>
                                <td className="px-2 py-2.5 text-right align-top sm:align-middle">{row.days}</td>
                                <td className="hidden sm:table-cell px-3 py-2.5 text-right">{tl(row.wage)}</td>
                                <td className="pl-2 pr-4 sm:pr-6 py-2.5 text-right font-medium whitespace-nowrap align-top sm:align-middle">{tl(row.amount)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

/* ---------- Asgari ücret tablosu ---------- */

export function WageTable() {
    const rows = [...MIN_WAGES].reverse();
    const fmt = (s: string) => s.split("-").reverse().join(".");
    return (
        <section className="rounded-3xl bg-white border border-line shadow-sm overflow-hidden">
            <header className="px-5 py-4 border-b border-line">
                <h3 className="font-serif text-lg font-semibold">Hesapta kullanılan asgari ücretler</h3>
                <p className="text-sm text-muted mt-1">
                    16 yaş üstü işçiler için aylık tutarlar. 2012 ile 2021 arasındaki net tutarlar bekar AGİ dahildir; 2022'den itibaren AGİ uygulanmadığından iki sütun eşittir.
                </p>
            </header>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-paper text-muted text-left">
                        <tr>
                            <th className="font-medium px-5 py-2.5">Dönem</th>
                            <th className="font-medium px-3 py-2.5 text-right">Brüt</th>
                            <th className="font-medium px-3 py-2.5 text-right">Net (AGİ dahil)</th>
                            <th className="font-medium px-5 py-2.5 text-right">Net (AGİ hariç)</th>
                        </tr>
                    </thead>
                    <tbody className="num divide-y divide-line">
                        {rows.map((w) => {
                            const latest = w === LATEST_MIN_WAGE;
                            return (
                                <tr key={w.start} className={latest ? "bg-brand-soft/60" : undefined}>
                                    <td className="px-5 py-2.5 whitespace-nowrap">
                                        {fmt(w.start)} – {fmt(w.end)}
                                        {latest && <span className="ml-2 rounded bg-brand px-1.5 py-0.5 text-[11px] font-medium text-white">Güncel</span>}
                                    </td>
                                    <td className="px-3 py-2.5 text-right">{tl(w.gross)}</td>
                                    <td className={cn("px-3 py-2.5 text-right", latest && "font-semibold")}>{tl(w.amount)}</td>
                                    <td className="px-5 py-2.5 text-right">{tl(w.amountWithoutAgi)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

/* ---------- Metodoloji, formüller ve içtihat ---------- */

const pct = (n: number) => n.toLocaleString("tr-TR", { maximumFractionDigits: 2 });
const n2 = (n: number, digits = 2) => n.toLocaleString("tr-TR", { minimumFractionDigits: digits, maximumFractionDigits: digits });

function Formula({ no, title, children, example }: { no: number; title: string; children: ReactNode; example?: ReactNode }) {
    return (
        <div className="print-avoid rounded-2xl border border-line p-4 sm:p-5">
            <p className="flex items-center gap-2 text-sm font-semibold">
                <span className="num flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-xs text-brand">{no}</span>
                {title}
            </p>
            <div className="formula mt-3 overflow-x-auto rounded-xl bg-paper px-4 py-3 font-serif text-[15px] sm:text-base leading-relaxed text-ink">
                {children}
            </div>
            {example && <div className="num mt-3 text-[13px] leading-relaxed text-muted">{example}</div>}
        </div>
    );
}

const V = ({ children }: { children: ReactNode }) => <i className="font-serif">{children}</i>;

export function Methodology({ r, inputs }: { r?: CalculationResult; inputs?: ActuarialInputs }) {
    const x = r?.exactAge ?? 0;
    const fl = Math.floor(x);
    const t = x - fl;
    const table = inputs ? TRH2010[inputs.gender] : null;
    const eFloor = table?.[fl];
    const eCeil = table?.[fl + 1];
    const sample = r?.permRows[0] ?? r?.futureRows[0];

    return (
        <div className="space-y-6">
            <section className={cn(card, "p-5 sm:p-7")}>
                <h3 className="flex items-center gap-2 font-serif text-lg font-semibold">
                    <Sigma className="h-4 w-4 text-brand" /> Formüller
                </h3>
                <p className="mt-1 text-sm text-muted max-w-[72ch]">
                    Hesapta kullanılan formüller{r ? "; örnekler bu dosyanın değerleriyle çözülmüştür." : "."}
                </p>
                <div className="mt-5 grid gap-4 xl:grid-cols-2 print:grid-cols-1">
                    <Formula
                        no={1}
                        title="Kaza tarihindeki tam yaş"
                        example={inputs && r && <>x = ({d(inputs.accidentDate)} − {d(inputs.birthDate)}) / 365,2425 = <b className="text-ink">{n2(x, 4)}</b> yaş</>}
                    >
                        <V>x</V> = (kaza tarihi − doğum tarihi) / 365,2425
                    </Formula>
                    <Formula
                        no={2}
                        title="Bakiye ömür: TRH-2010 doğrusal enterpolasyon"
                        example={
                            r && eFloor !== undefined && eCeil !== undefined && (
                                <>
                                    ⌊x⌋ = {fl}, t = {n2(t, 4)}; E<sub>{fl}</sub> = {n2(eFloor)}, E<sub>{fl + 1}</sub> = {n2(eCeil)} ({inputs?.gender === "F" ? "kadın" : "erkek"})
                                    <br />E = (1 − {n2(t, 4)}) × {n2(eFloor)} + {n2(t, 4)} × {n2(eCeil)} = <b className="text-ink">{n2(r.lifeExpectancy)}</b> yıl
                                </>
                            )
                        }
                    >
                        <V>E</V>(<V>x</V>) = (1 − <V>t</V>) · <V>E</V><sub>⌊x⌋</sub> + <V>t</V> · <V>E</V><sub>⌊x⌋+1</sub>
                        <span className="block text-sm text-muted mt-1"><V>t</V> = <V>x</V> − ⌊<V>x</V>⌋</span>
                    </Formula>
                    <Formula
                        no={3}
                        title="Beklenen ömür sonu"
                        example={inputs && r && <>{d(inputs.accidentDate)} + {n2(r.lifeExpectancy)} yıl = <b className="text-ink">{d(r.deathDate)}</b> ({n2(r.deathAge)} yaş)</>}
                    >
                        ömür sonu = kaza tarihi + <V>E</V>(<V>x</V>) × 365,2425 gün
                    </Formula>
                    <Formula
                        no={4}
                        title="Emeklilik yaşı (aktif / pasif dönem sınırı)"
                        example={inputs && <>Bu dosyada emeklilik yaşı <b className="text-ink">{inputs.retirementAge}</b>; pasif dönem {r && d(r.retirementDate)} tarihinde başlar.</>}
                    >
                        kaza ≥ 20.03.2020 ve doğum ≥ 01.01.1990 ise 65, aksi hâlde 60
                    </Formula>
                    <Formula
                        no={5}
                        title="Geçici iş göremezlik ve geçici bakıcı gideri"
                        example={inputs && r && <>Geçici iş göremezlik {inputs.tempIncapacityMonths} ay → <b className="text-ink">{tl(r.tempTotal)} TL</b>; bakıcı {inputs.tempCaretakerMonths} ay → <b className="text-ink">{tl(r.caretakerTotal)} TL</b></>}
                    >
                        <V>T</V> = Σ ay<sub>i</sub> × <V>Ü</V><sub>i</sub> × kusur
                        <span className="block text-sm text-muted mt-1"><V>Ü</V>: iş göremezlikte aylık net, bakıcıda aylık brüt asgari ücret</span>
                    </Formula>
                    <Formula
                        no={6}
                        title="Sürekli iş göremezlik (dönem satırı)"
                        example={
                            sample &&
                            inputs && (
                                <>
                                    Örnek satır {d(sample.start)} – {d(sample.end)}: {sample.days} × ({tl(sample.wage)} × 12 / 365) × %{pct(inputs.disabilityRate)} × %{pct(inputs.faultRate)} ={" "}
                                    <b className="text-ink">{tl(sample.amount)} TL</b>
                                </>
                            )
                        }
                    >
                        <V>S</V> = gün × (<V>Ü</V> × 12 / 365) × maluliyet × kusur
                        <span className="block text-sm text-muted mt-1">gün: takvim günü, artık yıllarda 29 Şubat hariç</span>
                    </Formula>
                    <Formula
                        no={7}
                        title="Bilinen ve bilinmeyen dönem"
                        example={
                            inputs &&
                            r && (
                                <>
                                    Bilinen dönem {d(r.knownStart)} – {d(r.knownEnd)}, bilinmeyen dönem {d(r.futureStart)} – {d(r.deathDate)};
                                    bilinmeyen dönemde <b className="text-ink">{tl(wageAt(inputs.calcDate).amount)} TL</b> esas alınır.
                                </>
                            )
                        }
                    >
                        bilinen: dönemin kendi <V>Ü</V>'sü · bilinmeyen: hesap tarihindeki <V>Ü</V>
                    </Formula>
                    <Formula
                        no={8}
                        title="Toplam maddi tazminat"
                        example={r && <><b className="text-ink">{tl(r.grandTotal)} TL</b></>}
                    >
                        Toplam = <V>T</V><sub>geçici</sub> + <V>T</V><sub>bakıcı</sub> + <V>S</V><sub>bilinen</sub> + <V>S</V><sub>aktif</sub> + <V>S</V><sub>pasif</sub>
                    </Formula>
                </div>
            </section>

            <section className={cn(card, "print-avoid p-5 sm:p-7")}>
                <h3 className="font-serif text-lg font-semibold">Hesaplama esasları</h3>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-ink/85 max-w-[80ch] marker:text-brand">
                    {METHOD_NOTES.map((n) => <li key={n}>{n}</li>)}
                </ul>
            </section>

            <section>
                <h3 className="flex items-center gap-2 font-serif text-lg font-semibold mb-3">
                    <Scale className="h-4 w-4 text-brand" /> Dayanılan Yargıtay kararları
                </h3>
                <div className="grid gap-4 lg:grid-cols-2 print:grid-cols-1">
                    {PRECEDENTS.map((p) => (
                        <article key={p.esas} className={cn(card, "print-avoid p-5 flex flex-col")}>
                            <header>
                                <p className="font-semibold">Yargıtay {p.division}</p>
                                <p className="num text-[13px] text-muted mt-0.5">
                                    E. {p.esas}, K. {p.karar}{p.tarih ? `, T. ${p.tarih}` : ""}
                                </p>
                            </header>
                            <blockquote className="mt-3 border-l-2 border-brand/40 pl-3 font-serif text-[15px] leading-relaxed text-ink/80 flex-1">
                                {p.text}
                            </blockquote>
                            <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2.5 text-[13px] text-emerald-900">
                                <span className="font-semibold">Hesaba yansıması: </span>{p.systemNote}
                            </p>
                        </article>
                    ))}
                </div>
            </section>
        </div>
    );
}
