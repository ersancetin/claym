import { useEffect, useRef, useState, type ReactNode } from "react";
import { Download, Info, Loader2, ShieldAlert } from "lucide-react";
import {
    EMPTY_DRAFT, ParameterPanel, legalRetirementAge,
    type ActuarialInputs, type Draft, type DraftErrors,
} from "@/components/ParameterPanel";
import { CompensationTable, EmptyState, Methodology, Metrics, Summary, Timeline, WageTable } from "@/components/Results";
import { ActuarialEngine, WAGE_DATA_START, wageAt, type CalculationResult } from "@/lib/actuarial-engine";
import { prefersReducedMotion } from "@/lib/motion";
import { cn, d, tl } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import { BRAND, DISCLAIMER_LEAD, DISCLAIMER_LINE, DISCLAIMER_PARAGRAPHS, DISCLAIMER_SHORT, DISCLAIMER_TITLE } from "@/data/methodology";

const TABS = [
    { id: "tables", label: "Hesap tabloları", short: "Tablolar" },
    { id: "wages", label: "Asgari ücret verisi", short: "Asgari ücret" },
    { id: "method", label: "Metodoloji ve içtihat", short: "Metodoloji" },
] as const;
type TabId = (typeof TABS)[number]["id"];

function validate(draft: Draft): { errors: DraftErrors; inputs?: ActuarialInputs } {
    const e: DraftErrors = {};
    if (!draft.gender) e.gender = "Cinsiyet seçin.";
    if (!draft.birthDate) e.birthDate = "Doğum tarihini girin.";
    if (!draft.accidentDate) e.accidentDate = "Kaza tarihini girin.";
    else if (draft.accidentDate < WAGE_DATA_START) e.accidentDate = `Asgari ücret verisi ${d(WAGE_DATA_START)} tarihinden başlar.`;
    else if (draft.birthDate && draft.accidentDate < draft.birthDate) e.accidentDate = "Kaza tarihi doğum tarihinden önce olamaz.";
    if (!draft.calcDate) e.calcDate = "Hesap tarihini girin.";
    else if (draft.accidentDate && draft.calcDate < draft.accidentDate) e.calcDate = "Hesap tarihi kaza tarihinden önce olamaz.";
    if (draft.retirementAge !== null && draft.retirementAge < 18) e.retirementAge = "Emeklilik yaşı 18'den küçük olamaz.";
    if (draft.disabilityRate === null || draft.disabilityRate <= 0) e.disabilityRate = "Oran girin.";
    if (draft.faultRate === null || draft.faultRate <= 0) e.faultRate = "Oran girin.";

    if (Object.keys(e).length) return { errors: e };
    return {
        errors: e,
        inputs: {
            gender: draft.gender!,
            birthDate: draft.birthDate!,
            accidentDate: draft.accidentDate!,
            calcDate: draft.calcDate!,
            retirementAge: draft.retirementAge ?? legalRetirementAge(draft)!,
            tempIncapacityMonths: draft.tempIncapacityMonths ?? 0,
            tempCaretakerMonths: draft.tempCaretakerMonths ?? 0,
            disabilityRate: draft.disabilityRate!,
            faultRate: draft.faultRate!,
        },
    };
}

const sameDraft = (a: Draft, b: Draft) => JSON.stringify(a) === JSON.stringify(b);

interface Calculated {
    id: number;
    inputs: ActuarialInputs;
    draft: Draft;
    result: CalculationResult;
}

export default function App() {
    const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
    const [errors, setErrors] = useState<DraftErrors>({});
    const [busy, setBusy] = useState(false);
    const [calc, setCalc] = useState<Calculated | null>(null);
    const [tab, setTab] = useState<TabId>("tables");
    const [pdfBusy, setPdfBusy] = useState(false);
    const resultsRef = useRef<HTMLDivElement>(null);
    const timer = useRef<number | undefined>(undefined);

    useEffect(() => () => window.clearTimeout(timer.current), []);

    // PDF modülü ve logo boşta önceden yüklenir; bağlantı kopsa da PDF indirilebilir
    useEffect(() => {
        const id = window.setTimeout(() => {
            import("@/lib/pdf-report").then((m) => m.preloadReportAssets()).catch(() => undefined);
        }, 1500);
        return () => window.clearTimeout(id);
    }, []);

    const change = (next: Draft) => {
        setDraft(next);
        // Düzeltilen alanın hatasını hemen kaldır
        if (Object.keys(errors).length) {
            const cleared = { ...errors };
            (Object.keys(cleared) as (keyof Draft)[]).forEach((k) => {
                if (next[k] !== draft[k]) delete cleared[k];
            });
            setErrors(cleared);
        }
    };

    const submit = () => {
        const { errors: errs, inputs } = validate(draft);
        setErrors(errs);
        if (!inputs) return;

        setBusy(true);
        const snapshot = draft;
        timer.current = window.setTimeout(() => {
            const result = ActuarialEngine.calculate(inputs);
            setCalc((prev) => ({ id: (prev?.id ?? 0) + 1, inputs, draft: snapshot, result }));
            setTab("tables");
            setBusy(false);
            // Mobilde sonuca kaydır
            if (window.matchMedia("(max-width: 1023px)").matches) {
                requestAnimationFrame(() =>
                    resultsRef.current?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" })
                );
            }
        }, prefersReducedMotion() ? 0 : 650);
    };

    const downloadPdf = async () => {
        if (!calc || pdfBusy) return;
        setPdfBusy(true);
        try {
            // PDF motoru yalnızca ihtiyaç olduğunda yüklenir
            const { downloadReport } = await import("@/lib/pdf-report");
            await downloadReport(calc.inputs, calc.result);
        } catch (err) {
            console.error(err);
            alert("PDF oluşturulamadı. Lütfen tekrar deneyin.");
        } finally {
            setPdfBusy(false);
        }
    };

    const reset = () => {
        window.clearTimeout(timer.current);
        setBusy(false);
        setDraft(EMPTY_DRAFT);
        setErrors({});
        setCalc(null);
    };

    const stale = !!calc && !sameDraft(calc.draft, draft);
    const inputs = calc?.inputs;
    const result = calc?.result;
    const calcWage = inputs ? wageAt(inputs.calcDate) : null;

    return (
        <div className="min-h-screen flex flex-col">
            <header className="no-print sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
                <div className="mx-auto flex h-[68px] max-w-7xl items-center px-4 sm:px-6">
                    <a href={BRAND.url} target="_blank" rel="noopener noreferrer" className="min-w-0">
                        <Logo />
                    </a>
                </div>
            </header>

            <Notice />

            <section className="no-print relative overflow-hidden border-b border-line bg-white">
                <div aria-hidden="true" className="pointer-events-none absolute -right-32 -top-40 h-[26rem] w-[26rem] rounded-full bg-brand-soft blur-3xl" />
                <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand animate-rise">
                        Meslektaş dayanışması <span className="text-muted">·</span> Eğitim çalışması <span className="text-muted">·</span> Ücretsiz
                    </p>
                    <h1 className="mt-4 font-heading text-[1.9rem] sm:text-[2.6rem] font-bold leading-[1.15] tracking-tight text-ink max-w-[22ch] animate-rise [animation-delay:80ms]">
                        Sürekli maluliyet tazminatı hesaplama
                    </h1>
                    <p className="mt-3 max-w-[64ch] text-[15px] font-light leading-relaxed text-ink/80 animate-rise [animation-delay:160ms]">
                        Yargıtay kararları doğrultusunda; TRH-2010 yaşam tablosu ve dönemsel asgari ücretlerle bilinen ve bilinmeyen, aktif ve pasif dönem ayrımıyla
                        hazırlanmış bir eğitim çalışmasıdır. Hesap tamamen tarayıcınızda yapılır, hiçbir veri gönderilmez.
                    </p>
                </div>
            </section>

            <main className="relative flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 pt-6 sm:pt-8 pb-16 print:pt-0 print:px-0 print:pb-0">
                <div className="grid gap-6 lg:gap-8 lg:grid-cols-[380px_minmax(0,1fr)] lg:items-start">
                    <div className="no-print lg:sticky lg:top-[92px] animate-rise [animation-delay:200ms]">
                        <ParameterPanel
                            draft={draft}
                            errors={errors}
                            busy={busy}
                            stale={stale}
                            hasResult={!!calc}
                            onChange={change}
                            onSubmit={submit}
                            onReset={reset}
                        />
                    </div>

                    <div ref={resultsRef} className="min-w-0 scroll-mt-4">
                        {!calc || !result || !inputs ? (
                            <EmptyState busy={busy} />
                        ) : (
                            <div key={calc.id} className={cn("space-y-6 transition-all duration-300 print:space-y-5 print:opacity-100 print:blur-none", busy ? "opacity-40 blur-[1px]" : stale && "opacity-70")}>
                                <PrintHeader inputs={inputs} />

                                <Summary r={result} />
                                <Metrics r={result} />

                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print animate-rise [animation-delay:350ms]">
                                    {calcWage && (
                                        <p className="num text-[13px] text-muted">
                                            Bilinmeyen dönemde esas alınan net asgari ücret:{" "}
                                            <span className="text-ink font-medium">{tl(calcWage.amount)} TL</span> (hesap tarihi {d(inputs.calcDate)})
                                        </p>
                                    )}
                                    <button
                                        type="button"
                                        onClick={downloadPdf}
                                        disabled={pdfBusy || stale}
                                        title={stale ? "Önce yeniden hesaplayın" : undefined}
                                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-brand bg-white px-6 py-3 text-sm font-semibold text-brand shadow-sm transition-colors hover:bg-brand hover:text-white disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-brand"
                                    >
                                        {pdfBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                        {pdfBusy ? "PDF hazırlanıyor" : "PDF çıktısı indir"}
                                    </button>
                                </div>

                                <Timeline r={result} />

                                <div className="animate-rise [animation-delay:500ms]">
                                    <div role="tablist" aria-label="Ayrıntılar" className="no-print mb-6 grid grid-cols-3 gap-1 rounded-full border border-line/80 bg-white p-1.5 shadow-sm">
                                        {TABS.map((t) => (
                                            <button
                                                key={t.id}
                                                role="tab"
                                                id={`tab-${t.id}`}
                                                aria-selected={tab === t.id}
                                                aria-controls={`panel-${t.id}`}
                                                onClick={() => setTab(t.id)}
                                                className={cn(
                                                    "rounded-full px-2 py-2.5 text-[13px] sm:text-sm font-semibold transition-all duration-200",
                                                    tab === t.id ? "bg-brand text-white shadow-sm" : "text-muted hover:text-ink hover:bg-paper"
                                                )}
                                            >
                                                <span className="sm:hidden">{t.short}</span>
                                                <span className="hidden sm:inline">{t.label}</span>
                                            </button>
                                        ))}
                                    </div>

                                    <div role="tabpanel" id="panel-tables" aria-labelledby="tab-tables" className={cn("space-y-6", tab !== "tables" && "hidden print:block")}>
                                        <PrintTitle>Hesap tabloları</PrintTitle>
                                        <CompensationTable title="Geçici iş göremezlik" rows={result.tempRows} total={result.tempTotal} />
                                        <CompensationTable title="Geçici bakıcı gideri" wageType="gross" rows={result.caretakerRows} total={result.caretakerTotal} />
                                        <CompensationTable title="Sürekli iş göremezlik, bilinen dönem" rows={result.permRows} total={result.permTotal} />
                                        <CompensationTable title="Sürekli iş göremezlik, bilinmeyen dönem" rows={result.futureRows} total={result.futureTotal} />
                                    </div>
                                    <div role="tabpanel" id="panel-method" aria-labelledby="tab-method" className={cn("print-break", tab !== "method" && "hidden print:block")}>
                                        <PrintTitle>Metodoloji, formüller ve Yargıtay kararları</PrintTitle>
                                        <Methodology r={result} inputs={inputs} />
                                    </div>
                                    <div role="tabpanel" id="panel-wages" aria-labelledby="tab-wages" className={cn("print-break", tab !== "wages" && "hidden print:block")}>
                                        <PrintTitle>Ek: Hesapta kullanılan asgari ücretler</PrintTitle>
                                        <WageTable />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <footer className="border-t border-line bg-white print:border-0 print:mt-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 text-[13px] text-muted print:px-0 print:py-0 print:text-[11px]">
                    <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
                        <div className="no-print">
                            <Logo />
                            <p className="mt-3 leading-relaxed">Meslektaş dayanışması için hazırlandı. Ücretsiz, üyeliksiz; veri toplamaz.</p>
                        </div>
                        <div className="max-w-[90ch] leading-relaxed">
                            <h2 className="flex items-center gap-2 text-[15px] font-bold text-ink">
                                <Info className="h-4 w-4 text-brand" /> {DISCLAIMER_TITLE}
                            </h2>
                            <div className="mt-3 space-y-2.5">
                                {DISCLAIMER_PARAGRAPHS.map((t) => <p key={t}>{t}</p>)}
                            </div>
                        </div>
                    </div>
                    <div className="mt-8 flex flex-col gap-2 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
                        <span>© {new Date().getFullYear()} {BRAND.org} · {DISCLAIMER_LINE}</span>
                        <a href={BRAND.url} target="_blank" rel="noopener noreferrer" className="no-print font-medium text-brand hover:text-brand-dark">cumhuriyetavukatlari.com</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}

const pct = (n: number) => n.toLocaleString("tr-TR", { maximumFractionDigits: 2 });

function PrintTitle({ children }: { children: ReactNode }) {
    return <h2 className="hidden print:block font-heading text-xl font-semibold border-b-2 border-ink pb-2 mb-4">{children}</h2>;
}

/** Eğitim çalışması uyarısı; sitenin her görünümünde ve yazdırmada en üstte yer alır */
function Notice() {
    return (
        <div role="note" className="border-b border-brand/20 bg-brand-soft print:hidden">
            <p className="mx-auto flex max-w-7xl items-start gap-2 px-4 sm:px-6 py-2.5 text-[12.5px] leading-snug text-brand-dark">
                <ShieldAlert className="mt-px h-4 w-4 shrink-0" />
                <span><strong className="font-semibold">{DISCLAIMER_LEAD}</strong> {DISCLAIMER_SHORT}</span>
            </p>
        </div>
    );
}

function PrintHeader({ inputs }: { inputs: ActuarialInputs }) {
    const rows: [string, string][] = [
        ["Cinsiyet", inputs.gender === "M" ? "Erkek" : "Kadın"],
        ["Doğum tarihi", d(inputs.birthDate)],
        ["Kaza tarihi", d(inputs.accidentDate)],
        ["Hesap tarihi", d(inputs.calcDate)],
        ["Emeklilik yaşı", String(inputs.retirementAge)],
        ["Geçici iş göremezlik", `${pct(inputs.tempIncapacityMonths)} ay`],
        ["Geçici bakıcı", `${pct(inputs.tempCaretakerMonths)} ay`],
        ["Maluliyet oranı", `%${pct(inputs.disabilityRate)}`],
        ["Karşı taraf kusuru", `%${pct(inputs.faultRate)}`],
    ];
    return (
        <section className="hidden print:block">
            <div className="flex items-end justify-between border-b-2 border-brand pb-3">
                <div>
                    <Logo />
                    <h1 className="mt-3 font-heading text-2xl font-bold">Sürekli maluliyet tazminatı hesap çalışması</h1>
                </div>
                <p className="num text-xs text-muted text-right">Oluşturulma tarihi<br /><span className="text-ink font-medium">{d(new Date())}</span></p>
            </div>
            <p className="mt-3 rounded-xl border border-brand/30 bg-brand-soft px-3 py-2 text-[11px] leading-snug text-brand-dark"><strong>{DISCLAIMER_LEAD}</strong> {DISCLAIMER_SHORT}</p>
            <h2 className="mt-5 mb-2 text-sm font-semibold uppercase tracking-wide text-muted">Dosya bilgileri</h2>
            <dl className="num grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-line bg-line text-sm">
                {rows.map(([k, v]) => (
                    <div key={k} className="bg-white px-3 py-2">
                        <dt className="text-[11px] text-muted">{k}</dt>
                        <dd className="font-medium">{v}</dd>
                    </div>
                ))}
            </dl>
        </section>
    );
}
