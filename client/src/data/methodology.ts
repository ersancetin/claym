/** Hesaplama esasları; hem ekranda hem PDF çıktısında kullanılır */
export const METHOD_NOTES: string[] = [
    "Bakiye ömür, Yargıtay 4. HD 2023/13132 E., 2024/524 K. ve 2022/16229 E., 2024/13018 K. kararları uyarınca TRH-2010 yaşam tablosundan kaza tarihindeki tam yaşa göre doğrusal enterpolasyonla bulunur; beklenen ömür sonu kaza tarihine eklenerek belirlenir.",
    "Geçici iş göremezlik, her ay için bir aylık net asgari ücret ve %100 gelir kaybı esasıyla hesaplanır. Süre ücret dönemlerine paylaştırılırken kaza günü sayılmaz; kaza ayında kalan günler (ayın gün sayısı − kaza günü) 30'a bölünerek ay kesrine çevrilir. Kaza tarihinde 18 yaşından küçük ve çalışmayan kişide bu kalem uyarıyla birlikte hesaplanır ve toplama dahil edilir.",
    "Kişinin 18 yaşından küçük olduğu günler için AGİ hariç net asgari ücret esas alınır (Yargıtay 4. HD 2022/16716 E.). Dönem 18. yaş gününe denk gelirse ikiye bölünür. 2022'den itibaren AGİ uygulanmadığından fark yalnızca 2012 ile 2021 arasındaki dönemlerde doğar.",
    "Geçici bakıcı gideri, her ay için bir aylık brüt asgari ücret üzerinden hesaplanır.",
    "Bilinen dönemde her dönemin kendi net asgari ücreti kullanılır. Hesap tarihi bilinen döneme dahildir; bilinmeyen dönem ertesi gün başlar ve hesap tarihinde yürürlükteki net asgari ücretle sabit projeksiyonla hesaplanır.",
    "Henüz açıklanmamış yıllara düşen günler en güncel asgari ücretle hesaplanır ve tablolarda \"Güncel ücretle\" olarak işaretlenir.",
    "Aktif dönem 18 yaşında başlar ve emeklilik yaşında sona erer; sonrası pasif dönemdir. Emeklilik yaşı varsayılan olarak 60 alınır, dosyanın durumuna göre değiştirilebilir.",
    "Pasif dönem geliri de asgari ücret üzerinden hesaplanır.",
    "Geçici iş göremezlik süresi, sürekli iş göremezlik bilinen döneminden düşülür.",
];

/** Marka bilgileri; sitede ve PDF çıktısında kullanılır */
export const BRAND = {
    org: "Cumhuriyet Avukatları",
    orgUpper: "CUMHURİYET AVUKATLARI",
    app: "Maluliyet Tazminatı Hesaplama",
    url: "https://cumhuriyetavukatlari.com",
} as const;

/** Bilgilendirme başlığı; altbilgide ve PDF'in ilk ve son sayfasında kullanılır */
export const DISCLAIMER_TITLE = "Bilgilendirme";

/** Kısa bilgilendirmenin vurgulu ilk cümlesi */
export const DISCLAIMER_LEAD = "Bu araç bir eğitim çalışmasıdır.";

/** Kısa bilgilendirmenin devamı; sitenin üst şeridinde, giriş ekranında ve PDF'in her sayfasının üstünde gösterilir */
export const DISCLAIMER_SHORT =
    "Cumhuriyet Avukatları tarafından meslektaş dayanışması amacıyla, Yargıtay içtihatları ışığında hazırlanmıştır. Bilirkişi raporu veya uzman görüşü niteliği taşımaz; delil olarak kullanılamaz.";

/** Ayrıntılı bilgilendirme; altbilgide ve PDF'in ilk ve son sayfasında paragraflar halinde gösterilir */
export const DISCLAIMER_PARAGRAPHS: string[] = [
    "Bu araç, Cumhuriyet Avukatları tarafından meslektaş dayanışması amacıyla hazırlanmış ücretsiz bir eğitim çalışmasıdır. Sürekli iş göremezlik, geçici iş göremezlik ve geçici bakıcı gideri kalemlerinin Yargıtay kararlarında benimsenen yöntemle nasıl hesaplandığını göstermeyi amaçlar.",
    "Elde edilen sonuçlar bilirkişi raporu, uzman görüşü veya hukuki mütalaa niteliği taşımaz ve delil olarak kullanılamaz. Somut bir uyuşmazlıkta tazminat miktarı, mahkemece görevlendirilen bilirkişinin hesabıyla belirlenir.",
    "Hesaplama yalnızca girilen verilere dayanır. Dosyaya özgü koşullar, belgelenen gerçek gelir, mahsup ve indirim sebepleri ile mevzuat ve içtihat değişiklikleri sonucu etkileyebilir. Sonuçlara dayanılarak yapılan işlemlerden Cumhuriyet Avukatları sorumlu tutulamaz.",
    "Girilen bilgiler yalnızca tarayıcınızda işlenir; hiçbir sunucuya gönderilmez ve saklanmaz.",
];

/** Altbilgi ve PDF alt satırında kullanılan tek cümlelik hatırlatma */
export const DISCLAIMER_LINE = "Eğitim çalışmasıdır; bilirkişi raporu veya uzman görüşü yerine geçmez.";
