import logoUrl from "@/assets/logo.png";
import { BRAND } from "@/data/methodology";
import { cn } from "@/lib/utils";

interface LogoProps {
    className?: string;
    iconOnly?: boolean;
    /** Logonun yanındaki alt başlık */
    subtitle?: string;
}

export function Logo({ className, iconOnly = false, subtitle = BRAND.app }: LogoProps) {
    return (
        <div className={cn("flex min-w-0 items-center gap-3", className)}>
            <img src={logoUrl} alt={`${BRAND.org} logosu`} width={46} height={46} className="h-10 w-10 shrink-0 sm:h-[46px] sm:w-[46px]" />
            {!iconOnly && (
                <span className="flex min-w-0 flex-col leading-tight">
                    <strong className="truncate text-[11px] font-bold tracking-[0.08em] text-ink sm:text-[12.5px] sm:tracking-[0.13em]">{BRAND.orgUpper}</strong>
                    <small className="truncate text-[11.5px] italic text-brand sm:text-[12.5px]">{subtitle}</small>
                </span>
            )}
        </div>
    );
}
