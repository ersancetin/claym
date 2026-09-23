import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { ArrowRight, Lock } from "lucide-react";
import { Logo } from "@/components/Logo";
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

    useEffect(() => {
        if (!authed) inputRef.current?.focus();
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
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-ink px-4">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0">
                <div className="absolute -top-40 -right-24 h-[30rem] w-[30rem] rounded-full bg-brand/40 blur-3xl animate-float" />
                <div className="absolute -bottom-40 -left-24 h-[26rem] w-[26rem] rounded-full bg-sky-400/15 blur-3xl animate-float [animation-delay:-7s]" />
            </div>
            <form
                key={shake}
                onSubmit={submit}
                className={cn("relative w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl animate-rise", shake > 0 && "animate-shake")}
            >
                <Logo className="justify-center" />
                <div className="mx-auto mt-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                    <Lock className="h-5 w-5" />
                </div>
                <p className="mt-3 text-center text-sm text-muted">Devam etmek için şifreyi girin</p>
                <input
                    ref={inputRef}
                    type="password"
                    inputMode="numeric"
                    autoComplete="current-password"
                    aria-label="Şifre"
                    aria-invalid={error}
                    value={value}
                    onChange={(e) => {
                        setValue(e.target.value);
                        setError(false);
                    }}
                    className={cn(
                        "num mt-4 w-full rounded-xl border bg-paper/70 px-4 py-3 text-center text-lg tracking-[0.5em] transition-all focus:outline-none focus:bg-white focus:ring-4",
                        error ? "border-red-400 focus:ring-red-500/10" : "border-line focus:border-brand focus:ring-brand/10"
                    )}
                />
                <p className={cn("mt-2 h-5 text-center text-sm text-red-600", !error && "invisible")}>Şifre hatalı.</p>
                <button
                    type="submit"
                    className="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-[#3b6ff0] py-3 font-semibold text-white shadow-[0_10px_30px_-10px_rgba(34,87,214,0.7)] transition-all hover:-translate-y-px"
                >
                    Giriş <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
            </form>
        </div>
    );
}
