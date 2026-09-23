import { useEffect, useRef, useState, type ReactNode } from "react";
import { LogOut, Printer, Sparkles } from "lucide-react";
import {
    EMPTY_DRAFT, ParameterPanel, legalRetirementAge,
    type ActuarialInputs, type Draft, type DraftErrors,
} from "@/components/ParameterPanel";
import { CompensationTable, EmptyState, Methodology, Metrics, Summary, Timeline, WageTable } from "@/components/Results";
import { ActuarialEngine, WAGE_DATA_START, wageAt, type CalculationResult } from "@/lib/actuarial-engine";
import { prefersReducedMotion } from "@/lib/motion";
import { cn, d, tl } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import { signOut } from "@/components/PasswordGate";

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
    const resultsRef = useRef<HTMLDivElement>(null);
    const timer = useRef<number | undefined>(undefined);

    useEffect(() => () => window.clearTimeout(timer.current), []);

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
            <header className="no-print relative overflow-hidden bg-ink text-white" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
                <div aria-hidden="true" className="pointer-events-none absolute inset-0">
                    <div className="absolute -top-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-brand/40 blur-3xl animate-float" />
                    <div className="absolute -bottom-48 -left-24 h-[26rem] w-[26rem] rounded-full bg-sky-400/15 blur-3xl animate-float [animation-delay:-6s]" />
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
                </div>
                <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-5 flex items-center justify-between gap-4">
                    <Logo light />
                    <button
                        type="button"
                        onClick={signOut}
                        className="no-print inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] text-white/70 ring-1 ring-white/15 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <LogOut className="h-3.5 w-3.5" /> Çıkış
                    </button>
                </div>
                <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-6 pb-28 sm:pt-10 sm:pb-32">
                    <p className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-sky-100 ring-1 ring-white/15 animate-rise">
                        <Sparkles className="h-3.5 w-3.5" /> Yargıtay içtihadına uygun hesap
                    </p>
                    <h1 className="mt-4 font-serif text-[2rem] sm:text-5xl font-semibold leading-[1.1] tracking-tight max-w-[20ch] animate-rise [animation-delay:80ms]">
                        Sürekli maluliyet tazminatı hesabı
                    </h1>
                    <p className="mt-4 text-white/70 max-w-[60ch] text-[15px] sm:text-base leading-relaxed animate-rise [animation-delay:160ms]">
                        TRH-2010 yaşam tablosu ve dönemsel asgari ücretlerle; bilinen ve bilinmeyen, aktif ve pasif dönem ayrımıyla.
                    </p>
                </div>
            </header>

            <main className="relative flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 -mt-20 sm:-mt-24 pb-16 print:mt-0 print:px-0 print:pb-0">
                <div className="grid gap-6 lg:gap-8 lg:grid-cols-[380px_minmax(0,1fr)] lg:items-start">
                    <div className="no-print lg:sticky lg:top-6 animate-rise [animation-delay:200ms]">
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
                                        onClick={() => window.print()}
                                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-medium shadow-sm hover:border-brand/40 hover:text-brand transition-colors"
                                    >
                                        <Printer className="h-4 w-4" /> Yazdır / PDF
                                    </button>
                                </div>

                                <Timeline r={result} />

                                <div className="animate-rise [animation-delay:500ms]">
                                    <div role="tablist" aria-label="Ayrıntılar" className="no-print mb-6 grid grid-cols-3 gap-1 rounded-2xl bg-white p-1.5 ring-1 ring-line shadow-sm">
                                        {TABS.map((t) => (
                                            <button
                                                key={t.id}
                                                role="tab"
                                                id={`tab-${t.id}`}
                                                aria-selected={tab === t.id}
                                                aria-controls={`panel-${t.id}`}
                                                onClick={() => setTab(t.id)}
                                                className={cn(
                                                    "rounded-xl px-2 py-2.5 text-[13px] sm:text-sm font-medium transition-all duration-200",
                                                    tab === t.id ? "bg-ink text-white shadow" : "text-muted hover:text-ink hover:bg-paper"
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
                <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 text-[13px] text-muted print:px-0 print:py-0 print:text-[11px]">
                    <div className="max-w-[90ch] space-y-2">
                        <p>
                            Bu araç hukuki danışmanlık veya aktüerya hizmeti değildir. Hesaplamalar bilgilendirme amaçlıdır ve bilirkişi raporu yerine geçmez. Tüm hesaplama tarayıcınızda yapılır; girdiğiniz bilgiler hiçbir sunucuya gönderilmez.
                        </p>
                        <p>© {new Date().getFullYear()} ClaymHero</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

const pct = (n: number) => n.toLocaleString("tr-TR", { maximumFractionDigits: 2 });

function PrintTitle({ children }: { children: ReactNode }) {
    return <h2 className="hidden print:block font-serif text-xl font-semibold border-b-2 border-ink pb-2 mb-4">{children}</h2>;
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
            <div className="flex items-end justify-between border-b-2 border-ink pb-3">
                <div>
                    <Logo />
                    <h1 className="mt-3 font-serif text-2xl font-semibold">Sürekli maluliyet tazminatı hesap raporu</h1>
                </div>
                <p className="num text-xs text-muted text-right">Rapor tarihi<br /><span className="text-ink font-medium">{d(new Date())}</span></p>
            </div>
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
