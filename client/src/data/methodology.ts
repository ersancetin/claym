/** Hesaplama esasları; hem ekranda hem PDF raporunda kullanılır */
export const METHOD_NOTES: string[] = [
    "Bakiye ömür, TRH-2010 yaşam tablosundan kaza tarihindeki tam yaşa göre doğrusal enterpolasyonla bulunur.",
    "Geçici iş göremezlik, her ay için bir aylık net asgari ücret ve %100 gelir kaybı esasıyla hesaplanır. Kaza tarihinde 18 yaşından küçük ve çalışmayan kişide bu kalem uyarıyla birlikte hesaplanır ve toplama dahil edilir.",
    "Kişinin 18 yaşından küçük olduğu günler için AGİ hariç net asgari ücret esas alınır (Yargıtay 4. HD 2022/16716 E.). Dönem 18. yaş gününe denk gelirse ikiye bölünür. 2022'den itibaren AGİ uygulanmadığından fark yalnızca 2012 ile 2021 arasındaki dönemlerde doğar.",
    "Geçici bakıcı gideri, her ay için bir aylık brüt asgari ücret üzerinden hesaplanır.",
    "Bilinen dönemde her dönemin kendi net asgari ücreti kullanılır. Hesap tarihi bilinen döneme dahildir; bilinmeyen dönem ertesi gün başlar ve hesap tarihinde yürürlükteki net asgari ücretle sabit projeksiyonla hesaplanır.",
    "Henüz açıklanmamış yıllara düşen günler en güncel asgari ücretle hesaplanır ve tablolarda \"Güncel ücretle\" olarak işaretlenir.",
    "Pasif dönem geliri de asgari ücret üzerinden hesaplanır.",
    "Geçici iş göremezlik süresi, sürekli iş göremezlik bilinen döneminden düşülür.",
];

/** Sorumluluk reddi; site başlığında, altbilgide ve PDF raporunda gösterilir */
export const DISCLAIMER_SHORT =
    "Bu araç bilgilendirme amaçlıdır; hukuki danışmanlık, aktüerya hizmeti veya bilirkişi raporu yerine geçmez.";

export const DISCLAIMER_FULL =
    "Bu hesaplama yalnızca bilgilendirme amacıyla, kullanıcının girdiği veriler esas alınarak otomatik olarak üretilmiştir. Hukuki danışmanlık, aktüerya hizmeti veya bilirkişi raporu niteliği taşımaz ve bunların yerine geçmez. Sonuçlar; dosyaya özgü koşullara, yargı kararlarındaki değişikliklere ve güncellenen asgari ücret verilerine göre farklılık gösterebilir. Bu hesaplamaya dayanılarak yapılan işlem ve verilen kararlardan ClaymHero sorumlu tutulamaz; kesin sonuç için bir avukat veya uzman bilirkişiye başvurulmalıdır.";
