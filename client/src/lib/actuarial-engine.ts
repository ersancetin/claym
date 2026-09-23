import { TRH2010 } from "../data/trh2010";
import { MIN_WAGES } from "../data/min-wages";
import { addMonths, addDays } from "date-fns";

/**
 * "YYYY-MM-DD" metnini YEREL gece yarısı olarak çözer.
 * new Date("2024-01-01") UTC gece yarısı döndürür; Türkiye saatinde bu 03:00'e denk gelir
 * ve takvimden seçilen 01.01.2024 00:00 tarihi dönem dışında kalırdı.
 */
export function parseLocalDate(iso: string): Date {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d);
}

/** Tablodaki son dönemin bitişi; sonrası en güncel asgari ücretle projeksiyon kabul edilir */
export const WAGE_DATA_START = parseLocalDate(MIN_WAGES[0].start);
export const WAGE_DATA_END = parseLocalDate(MIN_WAGES[MIN_WAGES.length - 1].end);

// Tablo bittikten sonraki günler (ör. 2027'ye uzanan bilinen dönem veya 2027'deki bir kaza)
// hesaptan düşmesin diye en güncel ücretle ayrı bir projeksiyon dönemi eklenir.
const WAGES = [
    ...MIN_WAGES.map(w => ({ ...w, startDate: parseLocalDate(w.start), endDate: parseLocalDate(w.end) })),
    {
        ...MIN_WAGES[MIN_WAGES.length - 1],
        startDate: addDays(WAGE_DATA_END, 1),
        endDate: new Date(2200, 11, 31),
    },
];

/** Verilen tarihte yürürlükte olan asgari ücret; tablo dışındaysa en güncel dönem */
export function wageAt(date: Date) {
    return WAGES.find(w => date >= w.startDate && date <= w.endDate) || WAGES[WAGES.length - 1];
}

export interface CompensationRow {
    start: Date;
    end: Date;
    days: number;
    wage: number;
    amount: number;
    type?: 'active' | 'passive' | 'temp' | 'perm' | 'caretaker';
    /** Satır, kişi 18 yaşından küçükken geçen döneme ait ve AGİ hariç net ücretle hesaplandı */
    agiExcluded?: boolean;
    /** Satır, asgari ücret tablosunun kapsadığı son tarihten sonraya ait (güncel ücretle projeksiyon) */
    projected?: boolean;
}

export interface CalculationResult {
    exactAge: number;
    lifeExpectancy: number;
    deathAge: number;
    deathDate: Date;
    retirementDate: Date;
    tempRows: CompensationRow[];
    tempTotal: number;
    caretakerRows: CompensationRow[];
    caretakerTotal: number;
    permRows: CompensationRow[];
    permTotal: number;
    futureRows: CompensationRow[];
    futureTotal: number;
    futureActiveTotal: number;
    futurePassiveTotal: number;
    grandTotal: number;
    
    // Period Analysis
    knownStart: Date;
    knownEnd: Date;
    knownDays: number;
    futureStart: Date;
    futureDays: number;
    
    activeStart: Date;
    activeEnd: Date;
    activeDays: number;
    
    passiveStart: Date;
    passiveEnd: Date;
    passiveDays: number;
    
    // Yargıtay 4. HD 2024/5497 E., 2024/6426 K. - Minor warning
    isMinorAtAccident: boolean;
    minorWarning?: string;

    // Yargıtay 4. HD 2022/16716 E. - 18 yaş altı dönemlerde AGİ hariç net ücret
    agiExcludedApplied: boolean;
    agiNote?: string;
}

/**
 * Net ücret seçimi. Yargıtay 4. HD 2022/16716 E. uyarınca kişinin 18 yaşından küçük
 * olduğu günler için AGİ hariç net asgari ücret esas alınır. 2022'den itibaren AGİ
 * uygulanmadığından iki tutar eşittir; fark yalnızca 2012-2021 dönemlerinde doğar.
 */
function netWage(w: { amount: number; amountWithoutAgi: number }, isMinor: boolean) {
    return isMinor ? w.amountWithoutAgi : w.amount;
}

export function eighteenthBirthday(birthDate: Date): Date {
    const d = new Date(birthDate);
    d.setFullYear(d.getFullYear() + 18);
    return d;
}

export class ActuarialEngine {
    /**
     * Yargıtay 4. Hukuk Dairesi - 2024/5497 E., 2024/6426 K., 25.06.2024
     * 18 yaşından küçük ve kaza tarihinde çalışmayan kişiler için
     * geçici iş göremezlik tazminatı hesaplanmaz.
     * Ancak sürekli sakatlık tazminatı hesaplanabilir.
     */
    static isMinorAtAccident(birthDate: Date, accidentDate: Date): boolean {
        const ageAtAccident = this.calculateExactAge(birthDate, accidentDate);
        return ageAtAccident < 18;
    }

    /**
     * Pasif dönem başlangıç yaşı, Yargıtay uygulaması: kadın-erkek ayrımı olmaksızın 60.
     * (ör. 4. HD 2021/25266 E. 2023/3355 K.; 4. HD 2025/1967 E. 2025/12362 K.; 17. HD 2015/2076 E. 2017/8171 K.)
     * Asker/polis gibi kurum yaş haddi daha erken olan mesleklerde de 60 esas alınır.
     */
    static getLegalRetirementAge(_birthDate?: Date, _accidentDate?: Date): number {
        return 60;
    }

    /**
     * Zorunlu trafik sigortası Genel Şartları (RG 20.03.2020, yürürlük 01.04.2020):
     * 01.01.1990 ve sonrası doğanlar için 65, öncekiler için 60. AYM 2019/40 E. 2020/40 K. iptal
     * kararından sonra mahkemeleri bağlamaz; sigorta şirketi hesabını karşılaştırmak için sunulur.
     */
    static getGeneralConditionsRetirementAge(birthDate: Date, accidentDate: Date): number {
        return accidentDate >= new Date(2020, 3, 1) && birthDate >= new Date(1990, 0, 1) ? 65 : 60;
    }

    static interpolateLifeExpectancy(age: number, gender: "M" | "F"): number {
        const table = TRH2010[gender];
        const floorAge = Math.floor(age);
        const ceilAge = floorAge + 1;

        if (floorAge >= 100) return table[table.length - 1] || 1.10;
        if (floorAge < 0) return table[0];

        const e_floor = table[floorAge];
        const e_ceil = table[ceilAge] !== undefined ? table[ceilAge] : (table[floorAge] - 0.5);
        const decimalPart = age - floorAge;
        // Ex = (1 - t) * E_floor + t * E_ceil
        return ((1 - decimalPart) * e_floor) + (decimalPart * e_ceil);
    }

    static calculateExactAge(birthDate: Date, targetDate: Date): number {
        const diffTime = targetDate.getTime() - birthDate.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        return diffDays / 365.2425;
    }

    static addYearsToDate(date: Date, years: number): Date {
        const newDate = new Date(date);
        const days = years * 365.2425;
        newDate.setDate(newDate.getDate() + days);
        return newDate;
    }

    static dateDiff(d1: Date, d2: Date): number {
        if (d1 > d2) return 0;
        const diffTime = Math.abs(d2.getTime() - d1.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    static calculateStandardDays(d1: Date, d2: Date): number {
        if (d1 > d2) return 0;
        const oneDay = 1000 * 60 * 60 * 24;
        const totalDays = Math.round((d2.getTime() - d1.getTime()) / oneDay) + 1;

        let leapDays = 0;
        const startYear = d1.getFullYear();
        const endYear = d2.getFullYear();

        for (let year = startYear; year <= endYear; year++) {
            if ((year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)) {
                const feb29 = new Date(year, 1, 29);
                if (feb29 >= d1 && feb29 <= d2) {
                    leapDays++;
                }
            }
        }
        return totalDays - leapDays;
    }

    static calculateTempCompensationByMonths(accidentDate: Date, months: number, faultRate: number, useGrossWage: boolean, date18?: Date): { rows: CompensationRow[], total: number } {
        if (months <= 0) return { rows: [], total: 0 };

        let totalCompensation = 0;
        const rows: CompensationRow[] = [];
        let remainingMonths = months;
        let currentDate = new Date(accidentDate);

        while (remainingMonths > 0) {
            const applicableWage = WAGES.find(wage => currentDate >= wage.startDate && currentDate <= wage.endDate);

            if (!applicableWage) break;

            const wageEnd = applicableWage.endDate;
            const minorPeriod = !useGrossWage && !!date18 && currentDate < date18;
            const wageAmount = useGrossWage ? applicableWage.gross : netWage(applicableWage, minorPeriod);
            const agiExcluded = minorPeriod && applicableWage.amountWithoutAgi !== applicableWage.amount;

            const periodStart = new Date(currentDate);
            let monthsInThisPeriod = 0;
            let tempDate = new Date(currentDate);

            while (remainingMonths > 0 && tempDate <= wageEnd) {
                const monthToAdd = Math.min(remainingMonths, 1);
                const nextDate = addMonths(tempDate, monthToAdd);
                
                if (nextDate > wageEnd) {
                    const daysUntilEnd = Math.floor((wageEnd.getTime() - tempDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                    const fractionOfMonth = daysUntilEnd / 30;
                    monthsInThisPeriod += fractionOfMonth;
                    remainingMonths -= fractionOfMonth;
                    tempDate = new Date(wageEnd);
                    tempDate.setDate(tempDate.getDate() + 1);
                    break;
                } else {
                    monthsInThisPeriod += monthToAdd;
                    remainingMonths -= monthToAdd;
                    tempDate = nextDate;
                }
            }

            if (monthsInThisPeriod > 0) {
                const periodEnd = addMonths(periodStart, monthsInThisPeriod);
                const actualEnd = periodEnd > wageEnd ? wageEnd : periodEnd;
                
                const loss = monthsInThisPeriod * wageAmount * (faultRate / 100);
                totalCompensation += loss;

                // Show actual calendar days for display
                const actualDays = Math.floor((actualEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));

                rows.push({
                    start: periodStart,
                    end: actualEnd,
                    days: actualDays,
                    wage: wageAmount,
                    amount: loss,
                    type: useGrossWage ? 'caretaker' : 'temp',
                    agiExcluded,
                    projected: periodStart > WAGE_DATA_END
                });
            }

            currentDate = tempDate;
        }

        return { rows, total: totalCompensation };
    }

    static calculateCompensation(
        startDate: Date, 
        endDate: Date, 
        rate: number, 
        faultRate: number, 
        isTemp: boolean, 
        useGrossWage: boolean = false,
        birthDate?: Date
    ): { rows: CompensationRow[], total: number } {
        if (!startDate || !endDate || startDate > endDate) return { rows: [], total: 0 };

        let totalCompensation = 0;
        const rows: CompensationRow[] = [];

        WAGES.forEach(wage => {
            const wageStart = wage.startDate;
            const wageEnd = wage.endDate;

            const intersectStart = new Date(Math.max(startDate.getTime(), wageStart.getTime()));
            const intersectEnd = new Date(Math.min(endDate.getTime(), wageEnd.getTime()));

            if (intersectStart <= intersectEnd) {
                // Dönem 18. yaş gününü kapsıyorsa iki parçaya bölünür
                const segments: { from: Date; to: Date; minor: boolean }[] = [];
                const date18 = birthDate && !useGrossWage ? eighteenthBirthday(birthDate) : null;
                if (date18 && intersectStart < date18 && intersectEnd >= date18) {
                    const dayBefore18 = addDays(date18, -1);
                    segments.push({ from: intersectStart, to: dayBefore18, minor: true });
                    segments.push({ from: date18, to: intersectEnd, minor: false });
                } else {
                    segments.push({ from: intersectStart, to: intersectEnd, minor: !!date18 && intersectEnd < date18 });
                }

                for (const seg of segments) {
                    const wageAmount = useGrossWage ? wage.gross : netWage(wage, seg.minor);
                    const days = ActuarialEngine.calculateStandardDays(seg.from, seg.to);
                    const dailyWage = (wageAmount * 12) / 365;

                    if (days > 0) {
                        const loss = days * dailyWage * (rate / 100) * (faultRate / 100);
                        totalCompensation += loss;

                        rows.push({
                            start: seg.from,
                            end: seg.to,
                            days: days,
                            wage: wageAmount,
                            amount: loss,
                            type: 'perm',
                            agiExcluded: seg.minor && wage.amountWithoutAgi !== wage.amount,
                            projected: seg.from > WAGE_DATA_END
                        });
                    }
                }
            }
        });

        return { rows, total: totalCompensation };
    }

    static calculate(inputs: {
        birthDate: Date;
        accidentDate: Date;
        calcDate: Date;
        retirementAge: number;
        tempIncapacityMonths: number;
        tempCaretakerMonths: number;
        disabilityRate: number;
        faultRate: number;
        gender: "M" | "F";
    }): CalculationResult {
        const { birthDate, accidentDate, calcDate, tempCaretakerMonths, disabilityRate, faultRate, gender } = inputs;
        
        // Yargıtay 4. HD 2024/5497 E., 2024/6426 K., 25.06.2024
        // 18 yaşından küçük ve kaza tarihinde çalışmayan kişiler için
        // geçici iş göremezlik tazminatı hesaplanmaz (ama UI'da gösterilir, üstü çizili).
        const isMinor = this.isMinorAtAccident(birthDate, accidentDate);
        let minorWarning: string | undefined;
        
        if (isMinor && inputs.tempIncapacityMonths > 0) {
            minorWarning = "Yargıtay 4. HD 2024/5497 E., 2024/6426 K. uyarınca, kaza tarihinde 18 yaşından küçük olan ve gelir getirici bir işte çalışmayan kişi için geçici iş göremezlik zararı doğmaz. Tutar hesaplanmış ve toplama dahil edilmiştir; kişinin kaza tarihinde gelir getirici bir işte çalıştığı ispatlanamazsa bu kalem reddedilebilir.";
        }

        // Use the retirement age from user input
        const retirementAge = inputs.retirementAge;
        
        // 1. Ages & Life Expectancy
        const ageAtAccident = this.calculateExactAge(birthDate, accidentDate);
        const lifeExp = this.interpolateLifeExpectancy(ageAtAccident, gender);
        const deathDate = this.addYearsToDate(accidentDate, lifeExp);
        const deathAge = ageAtAccident + lifeExp;

        // 2. Dates
        const retirementDate = new Date(birthDate);
        retirementDate.setFullYear(retirementDate.getFullYear() + retirementAge);

        // Helper to add months accurately (e.g., 1.5 months = 1 month + 15 days)
        const addMonthsAndDays = (date: Date, months: number): Date => {
            const wholeMonths = Math.floor(months);
            const fraction = months - wholeMonths;
            const extraDays = Math.round(fraction * 30);
            
            let result = addMonths(date, wholeMonths);
            if (extraDays > 0) {
                result = addDays(result, extraDays);
            }
            return result;
        };

        // Calculate End Dates
        // Logic: End Date is INCLUSIVE. 
        // If duration is 1 month (Jan 1 -> Jan 31), next period starts Feb 1.
        // addMonths(Jan 1, 1) -> Feb 1.
        // So inclusive end date = Feb 1 - 1 day = Jan 31.
        
        let tempIncapacityEndDate = new Date(accidentDate);
        if (inputs.tempIncapacityMonths > 0) {
            const endDateExclusive = addMonthsAndDays(accidentDate, inputs.tempIncapacityMonths);
            tempIncapacityEndDate = addDays(endDateExclusive, -1);
        } else {
            // If 0 months, end date is before start date (invalid range, results in 0 cost)
            tempIncapacityEndDate = addDays(accidentDate, -1);
        }

        let tempCaretakerEndDate = new Date(accidentDate);
        if (tempCaretakerMonths > 0) {
             const endDateExclusive = addMonthsAndDays(accidentDate, tempCaretakerMonths);
             tempCaretakerEndDate = addDays(endDateExclusive, -1);
        } else {
             tempCaretakerEndDate = addDays(accidentDate, -1);
        }

        // Permanent Period Start:
        // "geçici iş göremezlik süresi hesaplamadan dışlanmak suretiyle bilinen dönem süresi belirlenip"
        // Means Permanent Period starts AFTER Temporary Period.
        // tempIncapacityEndDate is the last day of temp incapacity.
        // So Permanent Start is the next day.
        const permanentStart = new Date(tempIncapacityEndDate);
        permanentStart.setDate(permanentStart.getDate() + 1);

        // 3. Compensation - Temporary
        // 1 month = 1 net minimum wage (not daily calculation)
        // Calculate temp incapacity (shown with strikethrough for minors)
        const date18Birthday = eighteenthBirthday(birthDate);
        const tempRes = this.calculateTempCompensationByMonths(accidentDate, inputs.tempIncapacityMonths, faultRate, false, date18Birthday);

        // 3.1 Compensation - Temporary Caretaker (Bakıcı Gideri)
        // 1 month = 1 gross minimum wage (not daily calculation)
        const caretakerRes = this.calculateTempCompensationByMonths(accidentDate, tempCaretakerMonths, faultRate, true);

        // 4. Compensation - Permanent (Known Period)
        // From permanentStart to min(calcDate, deathDate)
        let knownEnd = new Date(Math.min(calcDate.getTime(), deathDate.getTime()));
        
        // If permanentStart is after knownEnd (e.g. long temp incapacity continuing past calc date), handle gracefully
        let permRes: { rows: CompensationRow[], total: number } = { rows: [], total: 0 };
        
        if (permanentStart <= knownEnd) {
             permRes = this.calculateCompensation(permanentStart, knownEnd, disabilityRate, faultRate, false, false, birthDate);
        } else {
            // If permanent period hasn't started yet (still in temp), then knownEnd should reflect that for timeline
            knownEnd = permanentStart; 
        }

        // 5. Compensation - Future
        // Bilinmeyen dönem hesap tarihinin ertesi günü başlar (hesap tarihi bilinen döneme dahildir);
        // sürekli dönem henüz başlamadıysa sürekli dönem başlangıcından başlar.
        let futureStart = addDays(calcDate, 1);
        if (futureStart < permanentStart) futureStart = permanentStart;

        const futureRes = this.calculateFutureCompensation(
            futureStart,
            calcDate,
            birthDate,
            retirementDate,
            deathDate,
            disabilityRate,
            faultRate
        );

        // 6. Period Analysis Metrics
        // Known Period
        let knownStart = permanentStart;
        if (knownStart > calcDate) knownStart = calcDate;
        const knownDays = this.dateDiff(permanentStart, new Date(Math.min(knownEnd.getTime(), calcDate.getTime())));
        
        // Future Period
        const futureDays = this.dateDiff(futureStart, deathDate);

        // Active/Passive Analysis
        const date18 = new Date(birthDate);
        date18.setFullYear(date18.getFullYear() + 18);

        let activeStartDate = new Date(Math.max(permanentStart.getTime(), date18.getTime()));
        let activeEndDate = (retirementDate < deathDate) ? retirementDate : deathDate;
        let activeDays = 0;
        if (activeStartDate < activeEndDate) {
            activeDays = this.dateDiff(activeStartDate, activeEndDate);
        } else {
            activeStartDate = activeEndDate; // Clamp for display
        }

        let passiveDays = 0;
        // Pre-18
        if (permanentStart < date18) {
            const pre18End = new Date(Math.min(date18.getTime(), deathDate.getTime()));
            if (permanentStart < pre18End) {
                passiveDays += this.dateDiff(permanentStart, pre18End);
            }
        }
        // Post-Retire
        let passiveStartDate = retirementDate;
        let passiveEndDate = deathDate;
        if (retirementDate < deathDate) {
            const effectivePassiveStart = new Date(Math.max(retirementDate.getTime(), permanentStart.getTime()));
            if (effectivePassiveStart < deathDate) {
                passiveDays += this.dateDiff(effectivePassiveStart, deathDate);
                passiveStartDate = effectivePassiveStart;
            }
        } else {
             passiveStartDate = deathDate;
             passiveEndDate = deathDate;
        }


        const agiExcludedApplied = [...tempRes.rows, ...permRes.rows, ...futureRes.rows].some(r => r.agiExcluded);

        return {
            exactAge: ageAtAccident,
            lifeExpectancy: lifeExp,
            deathAge,
            deathDate,
            retirementDate,
            tempRows: tempRes.rows,
            tempTotal: tempRes.total,
            caretakerRows: caretakerRes.rows,
            caretakerTotal: caretakerRes.total,
            permRows: permRes.rows as CompensationRow[],
            permTotal: permRes.total,
            futureRows: futureRes.rows,
            futureTotal: futureRes.total,
            futureActiveTotal: futureRes.activeTotal,
            futurePassiveTotal: futureRes.passiveTotal,
            grandTotal: tempRes.total + caretakerRes.total + permRes.total + futureRes.total,
            
            knownStart,
            knownEnd,
            knownDays,
            futureStart,
            futureDays,
            
            activeStart: activeStartDate,
            activeEnd: activeEndDate,
            activeDays,
            
            passiveStart: passiveStartDate,
            passiveEnd: passiveEndDate,
            passiveDays,
            
            // Yargıtay 4. HD 2024/5497 E., 2024/6426 K. - Minor warning
            isMinorAtAccident: isMinor,
            minorWarning,

            agiExcludedApplied,
            agiNote: agiExcludedApplied
                ? "Yargıtay 4. HD 2022/16716 E. uyarınca kişinin 18 yaşından küçük olduğu günler için AGİ hariç net asgari ücret esas alınmıştır. İlgili satırlar tablolarda işaretlidir."
                : undefined
        };
    }

    static calculateFutureCompensation(
        calcDate: Date,
        wageDate: Date,
        birthDate: Date, 
        retirementDate: Date, 
        deathDate: Date, 
        disabilityRate: number, 
        faultRate: number
    ): { rows: CompensationRow[], total: number, activeTotal: number, passiveTotal: number } {
        // Bilinmeyen dönemin tamamında hesap tarihinde yürürlükteki net asgari ücret esas alınır
        const currentWageObj = wageAt(wageDate);
        
        const rows: CompensationRow[] = [];
        let totalFutureComp = 0;
        let totalActiveFuture = 0;
        let totalPassiveFuture = 0;

        let currentDate = new Date(calcDate);
        let loops = 0;

        while (currentDate < deathDate && loops < 1000) {
            loops++;
            const currentYearEnd = new Date(currentDate.getFullYear(), 11, 31);
            let periodEnd = currentYearEnd;

            if (currentDate < retirementDate && retirementDate <= currentYearEnd) {
                const dayBeforeRetire = new Date(retirementDate);
                dayBeforeRetire.setDate(dayBeforeRetire.getDate() - 1);
                if (dayBeforeRetire >= currentDate) {
                    periodEnd = dayBeforeRetire;
                }
            }

            if (deathDate < periodEnd) {
                periodEnd = deathDate;
            }

            // 18. yaş günü bu dönemin içindeyse dönem orada bölünür (AGİ hariç / dahil ayrımı)
            const date18 = eighteenthBirthday(birthDate);
            if (currentDate < date18 && date18 <= periodEnd) {
                periodEnd = addDays(date18, -1);
            }
            const minorPeriod = currentDate < date18;

            const days = this.calculateStandardDays(currentDate, periodEnd);

            if (days <= 0) {
                currentDate.setDate(currentDate.getDate() + 1);
                continue;
            }

            const currentNetWage = netWage(currentWageObj, minorPeriod);
            
            const isActive = currentDate < retirementDate;
            const periodType = isActive ? 'active' : 'passive';
            const dailyWage = (currentNetWage * 12) / 365;
            const amount = days * dailyWage * (disabilityRate / 100) * (faultRate / 100);

            totalFutureComp += amount;
            if (isActive) totalActiveFuture += amount;
            else totalPassiveFuture += amount;

            rows.push({
                start: new Date(currentDate),
                end: new Date(periodEnd),
                days,
                wage: currentNetWage,
                amount,
                type: periodType,
                agiExcluded: minorPeriod && currentWageObj.amountWithoutAgi !== currentWageObj.amount
            });

            currentDate = new Date(periodEnd);
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return { rows, total: totalFutureComp, activeTotal: totalActiveFuture, passiveTotal: totalPassiveFuture };
    }
}
