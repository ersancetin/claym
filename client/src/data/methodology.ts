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

/** Kısa uyarı; sitenin üst şeridinde, giriş ekranında ve PDF'in her sayfasının üstünde gösterilir */
export const DISCLAIMER_SHORT =
    "Bu çalışma, Cumhuriyet Avukatları tarafından meslektaş dayanışması amacıyla Yargıtay kararları doğrultusunda hazırlanmış bir eğitim çalışmasıdır. Aktüerya raporu değildir; bilirkişi raporu yerine geçmez.";

/** Ayrıntılı uyarı; sitenin altbilgisinde ve PDF'in ilk ve son sayfasında gösterilir */
export const DISCLAIMER_FULL =
    "Bu hesaplama, Cumhuriyet Avukatları tarafından meslektaş dayanışması amacıyla, Yargıtay kararları doğrultusunda hazırlanmış bir eğitim çalışmasıdır. Aktüerya raporu, bilirkişi raporu veya hukuki görüş niteliği taşımaz, bunların yerine geçmez ve delil olarak kullanılmak üzere hazırlanmamıştır. Sonuçlar yalnızca kullanıcının girdiği verilere göre otomatik olarak üretilir; dosyaya özgü koşullar, yargı kararlarındaki değişiklikler ve güncellenen asgari ücret verileri sonucu değiştirebilir. Somut dosyada tazminat hesabı, mahkemece görevlendirilen bilirkişi tarafından yapılır. Bu çalışmaya dayanılarak yapılan işlem ve verilen kararlardan Cumhuriyet Avukatları sorumlu tutulamaz.";
