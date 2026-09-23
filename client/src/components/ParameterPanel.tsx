import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import * as Popover from "@radix-ui/react-popover";
import { DayPicker } from "react-day-picker";
import { tr } from "date-fns/locale";
import { isValid, parse } from "date-fns";
import { Calculator, CalendarDays, CircleHelp, Loader2, RotateCcw } from "lucide-react";
import { cn, d } from "@/lib/utils";
import { ActuarialEngine } from "@/lib/actuarial-engine";

export interface ActuarialInputs {
    gender: "M" | "F";
    birthDate: Date;
    accidentDate: Date;
    calcDate: Date;
    retirementAge: number;
    tempIncapacityMonths: number;
    tempCaretakerMonths: number;
    disabilityRate: number;
    faultRate: number;
}

/** Formdaki ham değerler; hepsi boş başlar */
export interface Draft {
    gender: "M" | "F" | null;
    birthDate: Date | null;
    accidentDate: Date | null;
    calcDate: Date | null;
    retirementAge: number | null;
    tempIncapacityMonths: number | null;
    tempCaretakerMonths: number | null;
    disabilityRate: number | null;
    faultRate: number | null;
}

export type DraftErrors = Partial<Record<keyof Draft, string>>;

export const EMPTY_DRAFT: Draft = {
    gender: "M",
    birthDate: null,
    accidentDate: null,
    calcDate: null,
    retirementAge: 60,
    tempIncapacityMonths: null,
    tempCaretakerMonths: null,
    disabilityRate: null,
    faultRate: null,
};

/** Emeklilik yaşı alanı boş bırakılırsa kullanılan varsayılan değer */
export const legalRetirementAge = (_draft?: Draft) => ActuarialEngine.getLegalRetirementAge();

interface Props {
    draft: Draft;
    errors: DraftErrors;
    busy: boolean;
    stale: boolean;
    hasResult: boolean;
    onChange: (draft: Draft) => void;
    onSubmit: () => void;
    onReset: () => void;
}

export function ParameterPanel({ draft, errors, busy, stale, hasResult, onChange, onSubmit, onReset }: Props) {
    const set = <K extends keyof Draft>(key: K, value: Draft[K]) => onChange({ ...draft, [key]: value });
    const legal = legalRetirementAge(draft);
    const [ageInfo, setAgeInfo] = useState(false);
    const thisYear = new Date().getFullYear();

    const submit = (e: FormEvent) => {
        e.preventDefault();
        if (!busy) onSubmit();
    };

    return (
        <form
            onSubmit={submit}
            noValidate
            aria-labelledby="params-title"
            className="rounded-3xl bg-white p-5 sm:p-7 shadow-[0_20px_60px_-24px_rgba(20,33,61,0.35)] ring-1 ring-ink/5"
        >
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 id="params-title" className="font-serif text-xl font-semibold">Dosya bilgileri</h2>
                    <p className="text-[13px] text-muted mt-0.5">Alanları doldurup hesaplayın</p>
                </div>
                <button
                    type="button"
                    onClick={onReset}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted hover:text-ink hover:bg-paper transition-colors"
                >
                    <RotateCcw className="h-3.5 w-3.5" /> Temizle
                </button>
            </div>

            <div className="space-y-5">
                <Field label="Cinsiyet" error={errors.gender}>
                    <div role="radiogroup" aria-label="Cinsiyet" className="grid grid-cols-2 gap-1 rounded-xl bg-paper p-1 ring-1 ring-line">
                        {([["M", "Erkek"], ["F", "Kadın"]] as const).map(([val, label]) => (
                            <button
                                key={val}
                                type="button"
                                role="radio"
                                aria-checked={draft.gender === val}
                                onClick={() => set("gender", val)}
                                className={cn(
                                    "rounded-lg py-2.5 text-sm font-medium transition-all duration-200",
                                    draft.gender === val ? "bg-ink text-white shadow-sm" : "text-muted hover:text-ink hover:bg-white"
                                )}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </Field>

                <DateField label="Doğum tarihi" value={draft.birthDate} error={errors.birthDate} onChange={(v) => set("birthDate", v)} fromYear={1920} toYear={thisYear} />
                <DateField label="Kaza tarihi" value={draft.accidentDate} error={errors.accidentDate} onChange={(v) => set("accidentDate", v)} fromYear={2012} toYear={thisYear + 1} />
                <DateField
                    label="Hesap tarihi"
                    value={draft.calcDate}
                    error={errors.calcDate}
                    onChange={(v) => set("calcDate", v)}
                    fromYear={2012}
                    toYear={thisYear + 5}
                    action={{ label: "Bugün", onClick: () => set("calcDate", startOfToday()) }}
                />

                <NumberField
                    label="Emeklilik yaşı (pasif dönem başlangıcı)"
                    suffix="yaş"
                    value={draft.retirementAge}
                    error={errors.retirementAge}
                    onChange={(v) => set("retirementAge", v)}
                    max={80}
                    placeholder={String(legal)}
                    action={
                        <button
                            type="button"
                            onClick={() => setAgeInfo((o) => !o)}
                            aria-expanded={ageInfo}
                            aria-label="Emeklilik yaşı hakkında bilgi"
                            title="Emeklilik yaşı hakkında bilgi"
                            className={cn("rounded-full p-0.5 transition-colors", ageInfo ? "text-brand" : "text-muted hover:text-brand")}
                        >
                            <CircleHelp className="h-4 w-4" />
                        </button>
                    }
                >
                    {ageInfo && (
                        <div className="mt-2 space-y-1.5 rounded-xl bg-paper p-3 text-xs leading-relaxed text-ink/80 ring-1 ring-line animate-rise">
                            <p>Varsayılan değer 60'tır; dosyanın durumuna göre değiştirilebilir.</p>
                            <p>Yargıtay kararlarında pasif dönemin genellikle 60 yaşında başlatıldığı görülmektedir; kadın ve erkek için ayrı bir yaş uygulanmamaktadır.</p>
                            <p>Zorunlu trafik sigortası Genel Şartları'nda 01.01.1990 ve sonrası doğanlar için 65 yaş öngörülmektedir; bu düzenlemenin mahkeme hesaplarına etkisi tartışmalıdır.</p>
                            <p>Asker, polis gibi kurum yaş haddi daha erken olan mesleklerde de uygulamada çoğunlukla 60 esas alınmaktadır; somut duruma göre farklı bir yaş girilebilir.</p>
                            <p className="text-muted">Bu araçta aktif ve pasif dönem aynı net asgari ücretle hesaplandığından, yaş değişikliği toplamı değil aktif/pasif dağılımını etkiler.</p>
                        </div>
                    )}
                </NumberField>

                <div className="grid grid-cols-2 gap-x-3 gap-y-5">
                    <NumberField label="Geçici iş göremezlik" suffix="ay" value={draft.tempIncapacityMonths} error={errors.tempIncapacityMonths} onChange={(v) => set("tempIncapacityMonths", v)} max={100} />
                    <NumberField label="Geçici bakıcı" suffix="ay" value={draft.tempCaretakerMonths} error={errors.tempCaretakerMonths} onChange={(v) => set("tempCaretakerMonths", v)} max={100} />
                    <NumberField label="Maluliyet oranı" suffix="%" value={draft.disabilityRate} error={errors.disabilityRate} onChange={(v) => set("disabilityRate", v)} max={100} />
                    <NumberField label="Karşı taraf kusuru" suffix="%" value={draft.faultRate} error={errors.faultRate} onChange={(v) => set("faultRate", v)} max={100} />
                </div>
            </div>

            <button
                type="submit"
                disabled={busy}
                className={cn(
                    "group relative mt-7 flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl py-3.5 text-[15px] font-semibold text-white",
                    "bg-gradient-to-r from-brand to-[#3b6ff0] shadow-[0_10px_30px_-10px_rgba(34,87,214,0.7)]",
                    "transition-all duration-200 hover:shadow-[0_14px_36px_-10px_rgba(34,87,214,0.85)] hover:-translate-y-px active:translate-y-0 disabled:cursor-wait",
                    stale && "animate-pulse-ring"
                )}
            >
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent group-hover:animate-shine" />
                {busy ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Hesaplanıyor
                    </>
                ) : (
                    <>
                        <Calculator className="h-4 w-4" /> {hasResult ? "Yeniden hesapla" : "Hesapla"}
                    </>
                )}
            </button>
            {stale && !busy && (
                <p className="mt-2.5 text-center text-xs text-muted animate-rise">Bilgiler değişti, güncel sonuç için yeniden hesaplayın.</p>
            )}
        </form>
    );
}

function startOfToday() {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), t.getDate());
}

function Field({ label, children, error, htmlFor, action }: { label: string; children: ReactNode; error?: string; htmlFor?: string; action?: ReactNode }) {
    return (
        <div>
            <div className="flex items-baseline justify-between gap-2 mb-1.5">
                <label htmlFor={htmlFor} className="text-[13px] font-medium text-ink/80 truncate">{label}</label>
                {action}
            </div>
            {children}
            {error && <p className="mt-1.5 text-xs text-red-600 animate-rise">{error}</p>}
        </div>
    );
}

const inputClass =
    "num w-full rounded-xl bg-paper/70 border border-line px-3.5 py-2.5 text-[15px] text-ink placeholder:text-ink/30 transition-all duration-150 focus:outline-none focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/10";

function parseTypedDate(raw: string): Date | null {
    const s = raw.trim();
    if (/^\d{8}$/.test(s)) return parseTypedDate(`${s.slice(0, 2)}.${s.slice(2, 4)}.${s.slice(4)}`);
    const normalized = s.replace(/[/\-\s]/g, ".");
    if (!/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(normalized)) return null;
    const p = parse(normalized, "d.M.yyyy", new Date());
    return isValid(p) && p.getFullYear() > 1900 ? p : null;
}

/**
 * Yazarken gg.aa.yyyy biçimine çevirir: rakamlar gün, ay ve yıl olarak gruplanır, noktalar
 * kendiliğinden eklenir. Tek haneli gün/ay ardından ayraç yazılırsa başına 0 konur (1.3 → 01.03).
 * Silerken sona otomatik nokta eklenmez, böylece geri tuşu takılmaz.
 */
export function maskDate(raw: string, deleting = false): string {
    const segs: string[] = [];
    let cur = "";
    for (const ch of raw) {
        if (/\d/.test(ch)) {
            if (segs.length < 2) {
                cur += ch;
                if (cur.length === 2) {
                    segs.push(cur);
                    cur = "";
                }
            } else if (cur.length < 4) {
                cur += ch;
            }
        } else if (/[.,/\-\s]/.test(ch) && cur.length === 1 && segs.length < 2) {
            segs.push(cur.padStart(2, "0"));
            cur = "";
        }
    }
    let out = segs.join(".");
    if (segs.length && (cur || (segs.length < 3 && !deleting))) out += ".";
    out += cur;
    return out;
}

function DateField({
    label, value, onChange, fromYear, toYear, action, error,
}: {
    label: string;
    value: Date | null;
    onChange: (d: Date | null) => void;
    fromYear: number;
    toYear: number;
    action?: { label: string; onClick: () => void };
    error?: string;
}) {
    const id = label.replace(/\s/g, "-");
    const [text, setText] = useState(value ? d(value) : "");
    const [touched, setTouched] = useState(false);
    const [open, setOpen] = useState(false);
    const [month, setMonth] = useState<Date>(value ?? new Date(Math.min(toYear, new Date().getFullYear()), 0));

    // Değer dışarıdan değiştiğinde (takvim, Bugün, Temizle) metni eşitle
    useEffect(() => {
        const parsed = parseTypedDate(text);
        const same = value === null ? parsed === null : parsed?.getTime() === value.getTime();
        if (!same) {
            setText(value ? d(value) : "");
            setTouched(false);
        }
        if (value) setMonth(value);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    const formatError = touched && text.trim() !== "" && !parseTypedDate(text) ? "Tarihi gg.aa.yyyy biçiminde yazın, ör. 15.03.2024" : undefined;

    return (
        <Field
            label={label}
            htmlFor={id}
            error={formatError ?? error}
            action={
                action && (
                    <button type="button" onClick={action.onClick} className="text-xs font-medium text-brand hover:text-ink transition-colors">
                        {action.label}
                    </button>
                )
            }
        >
            <div className="relative">
                <input
                    id={id}
                    value={text}
                    inputMode="numeric"
                    placeholder="gg.aa.yyyy"
                    autoComplete="off"
                    aria-invalid={!!(formatError ?? error)}
                    maxLength={10}
                    onChange={(e) => {
                        const deleting = (e.nativeEvent as InputEvent).inputType?.startsWith("delete") ?? false;
                        const masked = maskDate(e.target.value, deleting);
                        setText(masked);
                        // Yazılan tarih anında işlenir; alandan çıkmak gerekmez
                        onChange(parseTypedDate(masked));
                    }}
                    onBlur={() => setTouched(true)}
                    className={cn(inputClass, "pr-11", (formatError ?? error) && "border-red-400 focus:border-red-500 focus:ring-red-500/10")}
                />
                <Popover.Root open={open} onOpenChange={setOpen}>
                    <Popover.Trigger
                        aria-label={`${label} için takvimi aç`}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted hover:text-brand hover:bg-brand-soft transition-colors"
                    >
                        <CalendarDays className="h-4 w-4" />
                    </Popover.Trigger>
                    <Popover.Portal>
                        <Popover.Content
                            align="end"
                            sideOffset={8}
                            collisionPadding={12}
                            className="z-50 rounded-2xl border border-line bg-white p-3 text-ink shadow-2xl animate-pop"
                        >
                            <DayPicker
                                mode="single"
                                locale={tr}
                                selected={value ?? undefined}
                                month={month}
                                onMonthChange={setMonth}
                                captionLayout="dropdown"
                                startMonth={new Date(fromYear, 0)}
                                endMonth={new Date(toYear, 11)}
                                onSelect={(sel) => {
                                    if (sel) {
                                        onChange(sel);
                                        setOpen(false);
                                    }
                                }}
                            />
                        </Popover.Content>
                    </Popover.Portal>
                </Popover.Root>
            </div>
        </Field>
    );
}

function NumberField({
    label, suffix, value, onChange, max, error, placeholder = "", hint, children, action,
}: {
    children?: ReactNode;
    action?: ReactNode;
    label: string;
    suffix: string;
    value: number | null;
    onChange: (n: number | null) => void;
    max: number;
    error?: string;
    placeholder?: string;
    hint?: string;
}) {
    const id = label.replace(/\s/g, "-");
    const fmt = (n: number | null) => (n === null ? "" : String(n).replace(".", ","));
    const [text, setText] = useState(fmt(value));

    useEffect(() => {
        const current = text.trim() === "" ? null : parseFloat(text.replace(",", "."));
        if (current !== value) setText(fmt(value));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    return (
        <Field label={label} htmlFor={id} error={error} action={action}>
            <div className="relative">
                <input
                    id={id}
                    value={text}
                    inputMode="decimal"
                    placeholder={placeholder}
                    autoComplete="off"
                    aria-invalid={!!error}
                    onChange={(e) => {
                        const raw = e.target.value.replace(/[^\d.,]/g, "");
                        setText(raw);
                        const n = parseFloat(raw.replace(",", "."));
                        onChange(isNaN(n) ? null : Math.min(max, Math.max(0, n)));
                    }}
                    className={cn(inputClass, "pr-11", error && "border-red-400 focus:border-red-500 focus:ring-red-500/10")}
                />
                <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-muted">{suffix}</span>
            </div>
            {hint && !error && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
            {children}
        </Field>
    );
}
