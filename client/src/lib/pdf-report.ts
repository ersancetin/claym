import pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from "pdfmake/build/vfs_fonts";
import type { Content, ContentTable, TableCell, TDocumentDefinitions } from "pdfmake/interfaces";
import type { ActuarialInputs } from "@/components/ParameterPanel";
import { wageAt, type CalculationResult, type CompensationRow } from "@/lib/actuarial-engine";
import { TRH2010 } from "@/data/trh2010";
import { MIN_WAGES, LATEST_MIN_WAGE } from "@/data/min-wages";
import { PRECEDENTS } from "@/data/precedents";
import { DISCLAIMER_FULL, DISCLAIMER_SHORT, METHOD_NOTES } from "@/data/methodology";
import { d, tl, years } from "@/lib/utils";

// vfs_fonts paketi sürüme göre ya doğrudan ya da pdfMake.vfs altında dışa aktarır
const fonts = pdfFonts as unknown as { vfs?: Record<string, string>; pdfMake?: { vfs: Record<string, string> }; default?: Record<string, string> };
(pdfMake as unknown as { vfs: Record<string, string> }).vfs =
    fonts.pdfMake?.vfs ?? fonts.vfs ?? (fonts.default as Record<string, string>) ?? (fonts as unknown as Record<string, string>);

const C = {
    ink: "#14213d",
    brand: "#2257d6",
    brandSoft: "#e8eefc",
    muted: "#5b6678",
    line: "#dde2ea",
    paper: "#f5f6f8",
    known: "#64748b",
    future: "#0f7f74",
    active: "#2257d6",
    passive: "#b7791f",
    care: "#7c3aed",
    temp: "#c2410c",
    green: "#065f46",
    greenSoft: "#ecfdf5",
    amber: "#92400e",
    amberSoft: "#fffbeb",
};

const PAGE_W = 595.28;
const MARGIN_X = 40;
const CONTENT_W = PAGE_W - MARGIN_X * 2;

const n2 = (n: number, digits = 2) => n.toLocaleString("tr-TR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
const pct = (n: number) => n.toLocaleString("tr-TR", { maximumFractionDigits: 2 });

const LOGO_SVG = `<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
<path d="M16 3L26.3923 9V10L16 16L5.6077 10V9L16 3Z" fill="#60A5FA"/>
<path d="M26.3923 10V22L16 28V16L26.3923 10Z" fill="#2563EB"/>
<path d="M5.6077 10V22L16 28V16L5.6077 10Z" fill="#3B82F6"/>
<circle cx="16" cy="16" r="2" fill="#ffffff"/></svg>`;

/* ---------- küçük yapı taşları ---------- */

/** Bölüm başlığı; ardından gelen içerikten ayrılmasın diye headlineLevel ile işaretlenir */
function sectionTitle(text: string, opts: { pageBreak?: boolean; number?: string } = {}): Content {
    return {
        stack: [
            {
                columns: [
                    opts.number
                        ? { width: "auto", text: opts.number, color: C.brand, bold: true, fontSize: 13, margin: [0, 0, 8, 0] }
                        : { width: 0, text: "" },
                    { width: "*", text, fontSize: 13, bold: true, color: C.ink },
                ],
            },
            { canvas: [{ type: "line", x1: 0, y1: 4, x2: CONTENT_W, y2: 4, lineWidth: 1.2, lineColor: C.ink }] },
        ],
        margin: [0, opts.pageBreak ? 0 : 18, 0, 10],
        pageBreak: opts.pageBreak ? "before" : undefined,
        headlineLevel: 1,
    } as Content;
}

function subTitle(text: string, right?: string): Content {
    return {
        columns: [
            { text, bold: true, fontSize: 10.5, color: C.ink },
            right ? { text: right, alignment: "right", bold: true, fontSize: 10.5, color: C.brand } : { text: "" },
        ],
        margin: [0, 12, 0, 6],
        headlineLevel: 2,
    } as Content;
}

/** Yatay çizgili, zebra desenli tablo düzeni */
const zebraLayout = {
    hLineWidth: (i: number, node: ContentTable) => (i === 0 || i === node.table.body.length ? 0 : i === 1 ? 1 : 0.5),
    vLineWidth: () => 0,
    hLineColor: (i: number) => (i === 1 ? C.ink : C.line),
    fillColor: (row: number) => (row === 0 ? C.paper : null),
    paddingLeft: () => 6,
    paddingRight: () => 6,
    paddingTop: () => 4,
    paddingBottom: () => 4,
};

const th = (text: string, alignment: "left" | "right" | "center" = "left"): TableCell => ({ text, bold: true, fontSize: 8, color: C.muted, alignment });

const typeLabel: Record<NonNullable<CompensationRow["type"]>, [string, string]> = {
    active: ["Aktif", C.active],
    passive: ["Pasif", C.passive],
    temp: ["Geçici", C.temp],
    perm: ["Bilinen", C.known],
    caretaker: ["Bakıcı", C.care],
};

function compensationTable(title: string, rows: CompensationRow[], total: number, wageLabel: string): Content[] {
    if (rows.length === 0) return [];
    const body: TableCell[][] = [
        [th("Dönem"), th("Tür"), th("Gün", "right"), th(wageLabel, "right"), th("Tutar (TL)", "right")],
        ...rows.map((r): TableCell[] => {
            const tags = [r.type ? typeLabel[r.type][0] : "", r.agiExcluded ? "AGİ hariç" : "", r.projected ? "Güncel ücretle" : ""].filter(Boolean).join(", ");
            return [
                { text: `${d(r.start)} – ${d(r.end)}` },
                { text: tags, color: r.type ? typeLabel[r.type][1] : C.muted, fontSize: 7.5 },
                { text: String(r.days), alignment: "right" },
                { text: tl(r.wage), alignment: "right" },
                { text: tl(r.amount), alignment: "right", bold: true },
            ];
        }),
        [
            { text: "Toplam", bold: true, colSpan: 4 },
            {},
            {},
            {},
            { text: tl(total), alignment: "right", bold: true, color: C.brand },
        ],
    ];
    return [
        subTitle(title, `${tl(total)} TL`),
        {
            table: { headerRows: 1, keepWithHeaderRows: 1, dontBreakRows: true, widths: ["*", 80, 36, 80, 80], body },
            layout: {
                ...zebraLayout,
                hLineWidth: (i: number, node: ContentTable) => (i === 0 ? 0 : i === 1 || i === node.table.body.length - 1 ? 1 : i === node.table.body.length ? 0 : 0.5),
                hLineColor: (i: number, node: ContentTable) => (i === 1 || i === node.table.body.length - 1 ? C.ink : C.line),
                fillColor: (row: number, node: ContentTable) => (row === 0 ? C.paper : row === node.table.body.length - 1 ? C.brandSoft : null),
            },
            fontSize: 8.5,
        } as Content,
    ];
}

/** Oransal yatay çubuk (tazminat dağılımı ve dönem çubukları için) */
function stackedBar(parts: { value: number; color: string }[], height = 10, width = CONTENT_W): Content {
    const sum = parts.reduce((a, p) => a + p.value, 0) || 1;
    let x = 0;
    const gap = 1.5;
    const shown = parts.filter((p) => p.value > 0);
    return {
        canvas: [
            { type: "rect", x: 0, y: 0, w: width, h: height, r: height / 2, color: C.paper },
            ...shown.map((p, i) => {
                const w = Math.max(2, (p.value / sum) * width - (i < shown.length - 1 ? gap : 0));
                const rect = { type: "rect" as const, x, y: 0, w, h: height, color: p.color, r: 0 };
                x += w + gap;
                return rect;
            }),
        ],
    };
}

function dot(color: string): Content {
    return { canvas: [{ type: "ellipse", x: 4, y: 5.5, r1: 3, r2: 3, color }] };
}

function formulaBlock(no: number, title: string, formula: Content, example?: Content): Content {
    return {
        unbreakable: true,
        margin: [0, 0, 0, 10],
        table: {
            widths: ["*"],
            body: [
                [{ text: [{ text: `${no}. `, color: C.brand, bold: true }, { text: title, bold: true }], fontSize: 10, margin: [2, 2, 2, 0] }],
                [{ stack: [formula], fillColor: C.paper, margin: [8, 6, 8, 6], fontSize: 11 }],
                ...(example ? [[{ stack: [example], fontSize: 8.5, color: C.muted, margin: [2, 0, 2, 2] }]] : []),
            ],
        },
        layout: {
            hLineWidth: () => 0,
            vLineWidth: () => 0,
            paddingTop: () => 4,
            paddingBottom: () => 4,
            paddingLeft: () => 0,
            paddingRight: () => 0,
        },
    } as Content;
}

const it = (text: string) => ({ text, italics: true });
const sub = (text: string) => ({ text, sub: true, fontSize: 8 });

/* ---------- rapor ---------- */

export function buildReport(inputs: ActuarialInputs, r: CalculationResult): TDocumentDefinitions {
    const x = r.exactAge;
    const fl = Math.floor(x);
    const t = x - fl;
    const table = TRH2010[inputs.gender];
    const eFloor = table[fl];
    const eCeil = table[fl + 1];
    const sample = r.permRows[0] ?? r.futureRows[0];
    const calcWage = wageAt(inputs.calcDate);
    const today = d(new Date());

    const parts = [
        { label: "Geçici iş göremezlik", value: r.tempTotal, color: C.temp },
        { label: "Geçici bakıcı gideri", value: r.caretakerTotal, color: C.care },
        { label: "Sürekli iş göremezlik, bilinen dönem", value: r.permTotal, color: C.known },
        { label: "Sürekli iş göremezlik, bilinmeyen aktif dönem", value: r.futureActiveTotal, color: C.active },
        { label: "Sürekli iş göremezlik, bilinmeyen pasif dönem", value: r.futurePassiveTotal, color: C.passive },
    ];
    const total = r.grandTotal;

    const fileInfo: [string, string][] = [
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
    const infoCell = ([k, v]: [string, string]): TableCell => ({
        stack: [
            { text: k, fontSize: 7.5, color: C.muted },
            { text: v, fontSize: 10, bold: true, margin: [0, 1, 0, 0] },
        ],
    });
    const infoRows: TableCell[][] = [];
    for (let i = 0; i < fileInfo.length; i += 3) infoRows.push(fileInfo.slice(i, i + 3).map(infoCell));

    const content: Content[] = [
        /* Kapak başlığı */
        {
            columns: [
                {
                    width: "*",
                    stack: [
                        { columns: [{ svg: LOGO_SVG, width: 22 }, { text: [{ text: "Claym", color: C.ink }, { text: "Hero", color: C.brand }], bold: true, fontSize: 14, margin: [6, 3, 0, 0] }] },
                        { text: "Sürekli maluliyet tazminatı hesap raporu", fontSize: 18, bold: true, margin: [0, 12, 0, 2] },
                        { text: "TRH-2010 yaşam tablosu, dönemsel asgari ücretler ve Yargıtay içtihadı esas alınarak hazırlanmıştır.", fontSize: 9, color: C.muted },
                    ],
                },
                { width: 90, stack: [{ text: "Rapor tarihi", fontSize: 8, color: C.muted, alignment: "right" }, { text: today, bold: true, alignment: "right" }], margin: [0, 4, 0, 0] },
            ],
        },
        { canvas: [{ type: "line", x1: 0, y1: 8, x2: CONTENT_W, y2: 8, lineWidth: 2, lineColor: C.ink }], margin: [0, 0, 0, 12] },

        /* Dosya bilgileri */
        { text: "DOSYA BİLGİLERİ", fontSize: 8, bold: true, color: C.muted, characterSpacing: 0.6, margin: [0, 0, 0, 5] },
        {
            table: { widths: ["*", "*", "*"], body: infoRows },
            layout: {
                hLineWidth: () => 0.6,
                vLineWidth: () => 0.6,
                hLineColor: () => C.line,
                vLineColor: () => C.line,
                paddingLeft: () => 8,
                paddingRight: () => 8,
                paddingTop: () => 5,
                paddingBottom: () => 5,
            },
        },

        /* Sorumluluk reddi */
        {
            margin: [0, 10, 0, 0],
            table: {
                widths: ["*"],
                body: [
                    [
                        {
                            fillColor: C.amberSoft,
                            margin: [10, 7, 10, 7],
                            text: [{ text: "Sorumluluk reddi: ", bold: true }, DISCLAIMER_FULL],
                            fontSize: 7.5,
                            color: C.amber,
                            lineHeight: 1.25,
                        },
                    ],
                ],
            },
            layout: { hLineWidth: () => 0.6, vLineWidth: () => 0.6, hLineColor: () => "#fcd34d", vLineColor: () => "#fcd34d" },
        },

        /* Toplam */
        {
            margin: [0, 16, 0, 0],
            table: {
                widths: ["*"],
                body: [
                    [
                        {
                            fillColor: C.ink,
                            margin: [14, 12, 14, 12],
                            stack: [
                                { text: "Toplam maddi tazminat", color: "#c7d2e6", fontSize: 9 },
                                { text: [{ text: tl(total), fontSize: 26, bold: true }, { text: "  TL", fontSize: 14, color: "#c7d2e6" }], color: "#ffffff", margin: [0, 2, 0, 0] },
                            ],
                        },
                    ],
                ],
            },
            layout: "noBorders",
        },
        { ...(stackedBar(parts) as object), margin: [0, 10, 0, 6] } as Content,
        {
            table: {
                widths: [12, "*", 90, 40],
                body: [
                    [{ text: "" }, th("Kalem"), th("Tutar (TL)", "right"), th("Pay", "right")],
                    ...parts.map((p): TableCell[] => [
                        dot(p.color) as TableCell,
                        { text: p.label },
                        { text: tl(p.value), alignment: "right", bold: true },
                        { text: total > 0 ? `%${n2((p.value / total) * 100, 1)}` : "%0", alignment: "right", color: C.muted },
                    ]),
                ],
            },
            layout: zebraLayout,
            fontSize: 9,
        } as Content,
        ...(r.minorWarning
            ? [{ table: { widths: ["*"], body: [[{ text: r.minorWarning, fontSize: 8, color: C.amber, fillColor: C.amberSoft, margin: [8, 6, 8, 6] }]] }, layout: "noBorders", margin: [0, 8, 0, 0] } as Content]
            : []),
        ...(r.agiNote
            ? [{ table: { widths: ["*"], body: [[{ text: r.agiNote, fontSize: 8, color: "#0c4a6e", fillColor: "#f0f9ff", margin: [8, 6, 8, 6] }]] }, layout: "noBorders", margin: [0, 6, 0, 0] } as Content]
            : []),

        /* Yaş ve ömür */
        {
            margin: [0, 14, 0, 0],
            table: {
                widths: ["*", "*", "*"],
                body: [
                    [
                        { stack: [{ text: "Kaza tarihindeki yaş", fontSize: 8, color: C.muted }, { text: `${n2(r.exactAge)} yaş`, fontSize: 13, bold: true }] },
                        { stack: [{ text: "Bakiye ömür (TRH-2010)", fontSize: 8, color: C.muted }, { text: `${n2(r.lifeExpectancy)} yıl`, fontSize: 13, bold: true }] },
                        { stack: [{ text: "Beklenen ömür sonu", fontSize: 8, color: C.muted }, { text: `${n2(r.deathAge)} yaş · ${d(r.deathDate)}`, fontSize: 13, bold: true }] },
                    ],
                ],
            },
            layout: {
                hLineWidth: () => 0.6,
                vLineWidth: () => 0.6,
                hLineColor: () => C.line,
                vLineColor: () => C.line,
                paddingLeft: () => 8,
                paddingTop: () => 6,
                paddingBottom: () => 6,
            },
        },

        /* Dönem analizi: başlığı, çubukları ve tablosuyla tek parça kalır */
        {
            unbreakable: true,
            stack: [
        sectionTitle("Dönem analizi"),
        { text: "Hesap tarihine göre", fontSize: 8.5, color: C.muted, margin: [0, 0, 0, 4] },
        { ...(stackedBar([{ value: r.knownDays, color: C.known }, { value: r.futureDays, color: C.future }], 12) as object), margin: [0, 0, 0, 10] } as Content,
        { text: "Çalışma çağına göre", fontSize: 8.5, color: C.muted, margin: [0, 0, 0, 4] },
        { ...(stackedBar([{ value: r.activeDays, color: C.active }, { value: r.passiveDays, color: C.passive }], 12) as object), margin: [0, 0, 0, 10] } as Content,
        {
            table: {
                headerRows: 1,
                widths: [12, "*", 70, 70, 50],
                body: [
                    [{ text: "" }, th("Dönem"), th("Başlangıç", "right"), th("Bitiş", "right"), th("Süre (yıl)", "right")],
                    ...[
                        { l: "Bilinen dönem", c: C.known, f: r.knownStart, to: r.knownEnd, days: r.knownDays },
                        { l: "Bilinmeyen dönem", c: C.future, f: r.futureStart, to: r.deathDate, days: r.futureDays },
                        { l: "Aktif dönem", c: C.active, f: r.activeStart, to: r.activeEnd, days: r.activeDays },
                        { l: "Pasif dönem", c: C.passive, f: r.passiveStart, to: r.passiveEnd, days: r.passiveDays },
                    ]
                        .filter((p) => p.days > 0)
                        .map((p): TableCell[] => [
                            dot(p.c) as TableCell,
                            { text: p.l },
                            { text: d(p.f), alignment: "right" },
                            { text: d(p.to), alignment: "right" },
                            { text: years(p.days), alignment: "right", bold: true },
                        ]),
                ],
            },
            layout: zebraLayout,
            fontSize: 9,
        } as Content,
        {
            text: `Bilinmeyen dönemde esas alınan net asgari ücret: ${tl(calcWage.amount)} TL (hesap tarihi ${d(inputs.calcDate)}).`,
            fontSize: 8.5,
            color: C.muted,
            margin: [0, 6, 0, 0],
        },

            ],
        } as Content,

        /* Hesap tabloları */
        sectionTitle("Hesap tabloları"),
        ...compensationTable("Geçici iş göremezlik", r.tempRows, r.tempTotal, "Net asgari ücret"),
        ...compensationTable("Geçici bakıcı gideri", r.caretakerRows, r.caretakerTotal, "Brüt asgari ücret"),
        ...compensationTable("Sürekli iş göremezlik, bilinen dönem", r.permRows, r.permTotal, "Net asgari ücret"),
        ...compensationTable("Sürekli iş göremezlik, bilinmeyen dönem", r.futureRows, r.futureTotal, "Net asgari ücret"),

        /* Formüller */
        sectionTitle("Formüller ve bu dosyadaki uygulaması", { pageBreak: true }),
        formulaBlock(
            1,
            "Kaza tarihindeki tam yaş",
            { text: [it("x"), " = (kaza tarihi − doğum tarihi) / 365,2425"] },
            { text: [`x = (${d(inputs.accidentDate)} − ${d(inputs.birthDate)}) / 365,2425 = `, { text: `${n2(x, 4)} yaş`, bold: true, color: C.ink }] }
        ),
        formulaBlock(
            2,
            "Bakiye ömür: TRH-2010 doğrusal enterpolasyon",
            {
                stack: [
                    { text: [it("E"), "(", it("x"), ") = (1 − ", it("t"), ") · ", it("E"), sub("[x]"), " + ", it("t"), " · ", it("E"), sub("[x]+1")] },
                    { text: [it("t"), " = ", it("x"), " − [", it("x"), "]    ([x]: x'in tam sayı kısmı)"], fontSize: 8.5, color: C.muted, margin: [0, 3, 0, 0] },
                ],
            },
            {
                stack: [
                    { text: [`[x] = ${fl}, t = ${n2(t, 4)}; E`, sub(String(fl)), ` = ${n2(eFloor)}, E`, sub(String(fl + 1)), ` = ${eCeil !== undefined ? n2(eCeil) : "-"} (${inputs.gender === "F" ? "kadın" : "erkek"} tablosu)`] },
                    { text: [`E = (1 − ${n2(t, 4)}) × ${n2(eFloor)} + ${n2(t, 4)} × ${eCeil !== undefined ? n2(eCeil) : "-"} = `, { text: `${n2(r.lifeExpectancy)} yıl`, bold: true, color: C.ink }] },
                ],
            }
        ),
        formulaBlock(
            3,
            "Beklenen ömür sonu",
            { text: ["ömür sonu = kaza tarihi + ", it("E"), "(", it("x"), ") × 365,2425 gün"] },
            { text: [`${d(inputs.accidentDate)} + ${n2(r.lifeExpectancy)} yıl = `, { text: d(r.deathDate), bold: true, color: C.ink }, ` (${n2(r.deathAge)} yaş)`] }
        ),
        formulaBlock(
            4,
            "Pasif dönem başlangıç yaşı (aktif / pasif dönem sınırı)",
            {
                stack: [
                    { text: "Yargıtay: kadın ve erkek için 60" },
                    {
                        text: "Genel Şartlar (01.04.2020 sonrası): 01.01.1990 ve sonrası doğanlar için 65; AYM 2019/40 E. 2020/40 K. sonrası mahkemeyi bağlamaz",
                        fontSize: 8.5,
                        color: C.muted,
                        margin: [0, 3, 0, 0],
                    },
                ],
            },
            { text: ["Bu dosyada emeklilik yaşı ", { text: String(inputs.retirementAge), bold: true, color: C.ink }, `; pasif dönem ${d(r.retirementDate)} tarihinde başlar.`] }
        ),
        formulaBlock(
            5,
            "Geçici iş göremezlik ve geçici bakıcı gideri",
            {
                stack: [
                    { text: [it("T"), " = Σ ay", sub("i"), " × ", it("Ü"), sub("i"), " × kusur oranı"] },
                    { text: "Ü: iş göremezlikte aylık net, bakıcı giderinde aylık brüt asgari ücret", fontSize: 8.5, color: C.muted, margin: [0, 3, 0, 0] },
                ],
            },
            {
                text: [
                    `Geçici iş göremezlik ${pct(inputs.tempIncapacityMonths)} ay: `,
                    { text: `${tl(r.tempTotal)} TL`, bold: true, color: C.ink },
                    `; geçici bakıcı ${pct(inputs.tempCaretakerMonths)} ay: `,
                    { text: `${tl(r.caretakerTotal)} TL`, bold: true, color: C.ink },
                ],
            }
        ),
        formulaBlock(
            6,
            "Sürekli iş göremezlik (her dönem satırı)",
            {
                stack: [
                    { text: [it("S"), " = gün × (", it("Ü"), " × 12 / 365) × maluliyet oranı × kusur oranı"] },
                    { text: "gün: takvim günü; artık yıllarda 29 Şubat hariç", fontSize: 8.5, color: C.muted, margin: [0, 3, 0, 0] },
                ],
            },
            sample
                ? {
                      text: [
                          `Örnek satır ${d(sample.start)} – ${d(sample.end)}: ${sample.days} × (${tl(sample.wage)} × 12 / 365) × %${pct(inputs.disabilityRate)} × %${pct(inputs.faultRate)} = `,
                          { text: `${tl(sample.amount)} TL`, bold: true, color: C.ink },
                      ],
                  }
                : undefined
        ),
        formulaBlock(
            7,
            "Bilinen ve bilinmeyen dönem",
            { text: ["bilinen dönem: dönemin kendi ", it("Ü"), "'sü  ·  bilinmeyen dönem: hesap tarihindeki ", it("Ü")] },
            {
                text: [
                    `Bilinen ${d(r.knownStart)} – ${d(r.knownEnd)}, bilinmeyen ${d(r.futureStart)} – ${d(r.deathDate)}; bilinmeyen dönemde `,
                    { text: `${tl(calcWage.amount)} TL`, bold: true, color: C.ink },
                    " esas alınır.",
                ],
            }
        ),
        formulaBlock(
            8,
            "Toplam maddi tazminat",
            { text: ["Toplam = ", it("T"), sub("geçici"), " + ", it("T"), sub("bakıcı"), " + ", it("S"), sub("bilinen"), " + ", it("S"), sub("aktif"), " + ", it("S"), sub("pasif")] },
            {
                text: [
                    `${tl(r.tempTotal)} + ${tl(r.caretakerTotal)} + ${tl(r.permTotal)} + ${tl(r.futureActiveTotal)} + ${tl(r.futurePassiveTotal)} = `,
                    { text: `${tl(total)} TL`, bold: true, color: C.ink },
                ],
            }
        ),

        /* Esaslar */
        sectionTitle("Hesaplama esasları"),
        { ul: METHOD_NOTES.map((n) => ({ text: n, margin: [0, 0, 0, 4] })), fontSize: 9.5, lineHeight: 1.2, markerColor: C.brand } as Content,

        /* Kararlar */
        sectionTitle("Dayanılan Yargıtay kararları", { pageBreak: true }),
        ...PRECEDENTS.map(
            (p): Content => ({
                unbreakable: true,
                margin: [0, 0, 0, 10],
                table: {
                    widths: [3, "*"],
                    body: [
                        [
                            { text: "", fillColor: C.brand, rowSpan: 3 },
                            {
                                stack: [
                                    { text: `Yargıtay ${p.division}`, bold: true, fontSize: 10.5 },
                                    { text: `E. ${p.esas}, K. ${p.karar}${p.tarih ? `, T. ${p.tarih}` : ""}`, fontSize: 8.5, color: C.muted, margin: [0, 1, 0, 0] },
                                ],
                                margin: [8, 2, 0, 0],
                            },
                        ],
                        [{}, { text: p.text, italics: true, fontSize: 9, color: "#334155", lineHeight: 1.25, margin: [8, 4, 0, 4] }],
                        [
                            {},
                            {
                                text: [{ text: "Hesaba yansıması: ", bold: true }, p.systemNote],
                                fontSize: 8.5,
                                color: C.green,
                                fillColor: C.greenSoft,
                                margin: [8, 5, 8, 5],
                            },
                        ],
                    ],
                },
                layout: "noBorders",
            })
        ),

        /* Ek */
        sectionTitle("Ek: Hesapta kullanılan asgari ücretler", { pageBreak: true }),
        {
            text: "16 yaş üstü işçiler için aylık tutarlar (TL). 2012 ile 2021 arasındaki net tutarlar bekar AGİ dahildir; 2022'den itibaren AGİ uygulanmadığından iki sütun eşittir.",
            fontSize: 8.5,
            color: C.muted,
            margin: [0, 0, 0, 8],
        },
        {
            table: {
                headerRows: 1,
                dontBreakRows: true,
                widths: ["*", 80, 90, 90],
                body: [
                    [th("Dönem"), th("Brüt", "right"), th("Net (AGİ dahil)", "right"), th("Net (AGİ hariç)", "right")],
                    ...[...MIN_WAGES].reverse().map((w): TableCell[] => {
                        const latest = w === LATEST_MIN_WAGE;
                        const f = (s: string) => s.split("-").reverse().join(".");
                        return [
                            { text: `${f(w.start)} – ${f(w.end)}${latest ? "  (güncel)" : ""}`, bold: latest },
                            { text: tl(w.gross), alignment: "right" },
                            { text: tl(w.amount), alignment: "right", bold: latest },
                            { text: tl(w.amountWithoutAgi), alignment: "right" },
                        ];
                    }),
                ],
            },
            layout: zebraLayout,
            fontSize: 8.5,
        } as Content,
        sectionTitle("Sorumluluk reddi"),
        { text: DISCLAIMER_FULL, fontSize: 9, color: C.muted, lineHeight: 1.3 },
    ];

    return {
        pageSize: "A4",
        pageMargins: [MARGIN_X, 48, MARGIN_X, 50],
        info: { title: "Sürekli maluliyet tazminatı hesap raporu", author: "ClaymHero", subject: "Tazminat hesabı" },
        defaultStyle: { font: "Roboto", fontSize: 9.5, color: C.ink, lineHeight: 1.15 },
        header: (page: number) =>
            page === 1
                ? { text: "" }
                : {
                      margin: [MARGIN_X, 20, MARGIN_X, 0],
                      columns: [
                          { text: [{ text: "Claym", bold: true }, { text: "Hero", bold: true, color: C.brand }, { text: "  ·  Sürekli maluliyet tazminatı hesap raporu", color: C.muted }], fontSize: 8 },
                          { text: `Kaza ${d(inputs.accidentDate)} · Hesap ${d(inputs.calcDate)}`, alignment: "right", fontSize: 8, color: C.muted },
                      ],
                  },
        footer: (page: number, pages: number) => ({
            margin: [MARGIN_X, 10, MARGIN_X, 0],
            stack: [
                { canvas: [{ type: "line", x1: 0, y1: 0, x2: CONTENT_W, y2: 0, lineWidth: 0.5, lineColor: C.line }] },
                {
                    margin: [0, 5, 0, 0],
                    columns: [
                        { width: "*", text: DISCLAIMER_SHORT, fontSize: 7, color: C.muted },
                        { width: 110, text: `Rapor tarihi ${today}  ·  ${page} / ${pages}`, alignment: "right", fontSize: 7, color: C.muted },
                    ],
                },
            ],
        }),
        // Başlık sayfanın en altında tek başına kalmasın
        // pdfmake 0.2 ikinci argüman olarak aynı sayfadaki sonraki düğümlerin dizisini verir
        // (tip tanımları 0.3 API'sini anlatıyor)
        pageBreakBefore: (node, following) =>
            !!node.headlineLevel && (following as unknown as unknown[]).length === 0,
        content,
    };
}

export function downloadReport(inputs: ActuarialInputs, r: CalculationResult) {
    const stamp = d(inputs.calcDate).split(".").reverse().join("-");
    pdfMake.createPdf(buildReport(inputs, r)).download(`ClaymHero-tazminat-raporu-${stamp}.pdf`);
}
