export interface MinWage {
    start: string;
    end: string;
    amount: number;           // Net wage with AGİ (AGİ dahil net ücret)
    amountWithoutAgi: number; // Net wage without AGİ (AGİ hariç net ücret) - for minors per Yargıtay 2022/16716 E.
    gross: number;
}

// AGİ hariç net ücret = Net ücret - AGİ tutarı (bekar)
// Yargıtay 4. HD 2022/16716 E. kararı: 18 yaş altı dönemler için AGİ hariç hesap yapılır (motor: netWage())
// 2022 sonrasında AGİ kaldırıldığı için amount = amountWithoutAgi
// Bekar AGİ tutarları: 2012: 66.49 TL, 2013: 73.40 TL, 2014: 80.33 TL, 2015: 90.11 TL
// 2016: 123.53 TL, 2017: 133.31 TL, 2018: 152.21 TL, 2019: 191.88 TL, 2020: 220.73 TL, 2021: 268.31 TL
export const MIN_WAGES: MinWage[] = [
    { start: '2012-01-01', end: '2012-06-30', amount: 701.14, amountWithoutAgi: 634.65, gross: 886.50 },
    { start: '2012-07-01', end: '2012-12-31', amount: 739.80, amountWithoutAgi: 673.31, gross: 940.50 },
    { start: '2013-01-01', end: '2013-06-30', amount: 773.01, amountWithoutAgi: 699.61, gross: 978.60 },
    { start: '2013-07-01', end: '2013-12-31', amount: 803.68, amountWithoutAgi: 730.28, gross: 1021.50 },
    { start: '2014-01-01', end: '2014-06-30', amount: 846.00, amountWithoutAgi: 765.67, gross: 1071.00 },
    { start: '2014-07-01', end: '2014-12-31', amount: 891.00, amountWithoutAgi: 810.67, gross: 1134.00 },
    { start: '2015-01-01', end: '2015-06-30', amount: 949.07, amountWithoutAgi: 858.96, gross: 1201.50 },
    { start: '2015-07-01', end: '2015-12-31', amount: 1000.54, amountWithoutAgi: 910.43, gross: 1273.50 },
    { start: '2016-01-01', end: '2016-12-31', amount: 1300.99, amountWithoutAgi: 1177.46, gross: 1647.00 },
    { start: '2017-01-01', end: '2017-12-31', amount: 1404.06, amountWithoutAgi: 1270.75, gross: 1777.50 },
    { start: '2018-01-01', end: '2018-12-31', amount: 1603.12, amountWithoutAgi: 1450.91, gross: 2029.50 },
    { start: '2019-01-01', end: '2019-12-31', amount: 2020.90, amountWithoutAgi: 1829.02, gross: 2558.40 },
    { start: '2020-01-01', end: '2020-12-31', amount: 2324.70, amountWithoutAgi: 2103.97, gross: 2943.00 },
    { start: '2021-01-01', end: '2021-12-31', amount: 2825.90, amountWithoutAgi: 2557.59, gross: 3577.50 },
    { start: '2022-01-01', end: '2022-06-30', amount: 4253.40, amountWithoutAgi: 4253.40, gross: 5004.00 },
    { start: '2022-07-01', end: '2022-12-31', amount: 5500.35, amountWithoutAgi: 5500.35, gross: 6471.00 },
    { start: '2023-01-01', end: '2023-06-30', amount: 8506.80, amountWithoutAgi: 8506.80, gross: 10008.00 },
    { start: '2023-07-01', end: '2023-12-31', amount: 11402.32, amountWithoutAgi: 11402.32, gross: 13414.50 },
    { start: '2024-01-01', end: '2024-12-31', amount: 17002.12, amountWithoutAgi: 17002.12, gross: 20002.50 },
    { start: '2025-01-01', end: '2025-12-31', amount: 22104.67, amountWithoutAgi: 22104.67, gross: 26005.50 },
    // 2026: Asgari Ücret Tespit Komisyonu kararı (RG 26.12.2025), %27 artış, yıl içinde ara zam yapılmadı
    { start: '2026-01-01', end: '2026-12-31', amount: 28075.50, amountWithoutAgi: 28075.50, gross: 33030.00 }
];

/** Tabloda yer alan en güncel asgari ücret dönemi */
export const LATEST_MIN_WAGE = MIN_WAGES[MIN_WAGES.length - 1];
