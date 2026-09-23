import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { ArrowRight, Lock, ShieldAlert } from "lucide-react";
import { Logo } from "@/components/Logo";
import { DISCLAIMER_SHORT } from "@/data/methodology";
import { cn } from "@/lib/utils";

// Şifrenin SHA-256 özeti; şifrenin kendisi kaynakta yer almaz.
const PASSWORD_HASH = "74ed65a2d22a92c3b4e013c15ff04d05f4954cd792d9cf56e9a0edad5f914ed1";
const STORAGE_KEY = "claymhero-auth";

async function sha256(text: string) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

function readAuth() {
    try {
        return sessionStorage.getItem(STORAGE_KEY) === PASSWORD_HASH;
    } catch {
        return false;
    }
}

export function signOut() {
    try {
        sessionStorage.removeItem(STORAGE_KEY);
    } catch {
        // depolama kapalıysa yeniden yükleme yine giriş ekranını açar
    }
    window.location.reload();
}

export function PasswordGate({ children }: { children: ReactNode }) {
    const [authed, setAuthed] = useState(readAuth);
    const [value, setValue] = useState("");
    const [error, setError] = useState(false);
    const [shake, setShake] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    // Dokunmatik cihazda otomatik odak klavyeyi açıp ekranı kaydırır; yalnızca fare/klavye ile odaklan
    useEffect(() => {
        if (!authed && window.matchMedia?.("(pointer: fine)").matches) inputRef.current?.focus({ preventScroll: true });
    }, [authed]);

    if (authed) return <>{children}</>;

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        if ((await sha256(value)) === PASSWORD_HASH) {
            try {
                sessionStorage.setItem(STORAGE_KEY, PASSWORD_HASH);
            } catch {
                // depolama kapalıysa yalnızca bu oturum için açılır
            }
            setAuthed(true);
        } else {
            setError(true);
            setShake((n) => n + 1);
            setValue("");
            inputRef.current?.focus();
        }
    };

    return (
        <div className="fixed inset-0 overflow-y-auto bg-ink">
            <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-24 h-[30rem] w-[30rem] rounded-full bg-brand/40 blur-3xl animate-float" />
                <div className="absolute -bottom-40 -left-24 h-[26rem] w-[26rem] rounded-full bg-sky-400/15 blur-3xl animate-float [animation-delay:-7s]" />
            </div>
            <div className="relative flex min-h-full flex-col items-center justify-center px-4 py-10">
                <form
                    key={shake}
                    onSubmit={submit}
                    className={cn("w-full max-w-sm rounded-3xl bg-white px-7 py-9 text-center shadow-2xl", shake > 0 ? "animate-shake" : "animate-rise")}
                >
                    <div className="flex flex-col items-center">
                        <Logo iconOnly className="justify-center [&_svg]:h-14 [&_svg]:w-14" />
                        <p className="mt-3 font-serif text-2xl font-bold tracking-tight text-ink leading-none">
                            Claym<span className="text-brand">Hero</span>
                        </p>
                        <p className="mt-1.5 text-[13px] text-muted">Sürekli maluliyet tazminatı hesabı</p>
                    </div>

                    <div className="my-7 h-px bg-line" />

                    <label htmlFor="gate-password" className="flex items-center justify-center gap-1.5 text-sm font-medium text-ink/80">
                        <Lock className="h-4 w-4 text-brand" /> Devam etmek için şifreyi girin
                    </label>
                    <input
                        id="gate-password"
                        ref={inputRef}
                        type="password"
                        inputMode="numeric"
                        autoComplete="current-password"
                        aria-invalid={error}
                        value={value}
                        onChange={(e) => {
                            setValue(e.target.value);
                            setError(false);
                        }}
                        className={cn(
                            "num mt-3 w-full rounded-xl border bg-paper/70 px-4 py-3 text-center text-lg tracking-[0.5em] transition-all focus:outline-none focus:bg-white focus:ring-4",
                            error ? "border-red-400 focus:ring-red-500/10" : "border-line focus:border-brand focus:ring-brand/10"
                        )}
                    />
                    <p className={cn("mt-2 h-5 text-sm text-red-600", !error && "invisible")}>Şifre hatalı.</p>
                    <button
                        type="submit"
                        className="group mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-[#3b6ff0] py-3 font-semibold text-white shadow-[0_10px_30px_-10px_rgba(34,87,214,0.7)] transition-all hover:-translate-y-px"
                    >
                        Giriş <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </button>
                </form>
                <p className="mt-6 flex max-w-sm items-start gap-2 text-left text-xs leading-snug text-white/55">
                    <ShieldAlert className="mt-px h-3.5 w-3.5 shrink-0 text-amber-300/80" />
                    {DISCLAIMER_SHORT}
                </p>
            </div>
        </div>
    );
}
