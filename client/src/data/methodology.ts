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

/** Uyarının başlığı; sitede ve PDF'te kısa ve ayrıntılı metnin önünde yer alır */
export const DISCLAIMER_TITLE = "Hukuki nitelik bildirimi";

/** Kısa uyarı; sitenin üst şeridinde, giriş ekranında ve PDF'in her sayfasının üstünde gösterilir */
export const DISCLAIMER_SHORT =
    "Bu hesap çalışması, Cumhuriyet Avukatları tarafından meslektaş dayanışması kapsamında, Yargıtay kararlarında benimsenen ilkeler esas alınarak hazırlanmış eğitim amaçlı bir modeldir. 6100 sayılı HMK m. 266 vd. uyarınca düzenlenen bilirkişi raporu veya m. 293 kapsamında uzman görüşü niteliği taşımaz; hukuki mütalaa yerine geçmez.";

/** Ayrıntılı uyarı maddeleri; sitenin altbilgisinde ve PDF'in ilk ve son sayfasında gösterilir */
export const DISCLAIMER_POINTS: { title: string; text: string }[] = [
    {
        title: "Niteliği",
        text: "Bu çalışma, sürekli ve geçici iş göremezlik zararının Yargıtay kararlarında benimsenen yöntemle (TRH-2010 yaşam tablosu, dönemsel net asgari ücret, bilinen ve bilinmeyen dönem ayrımı) nasıl hesaplandığını göstermek amacıyla, Cumhuriyet Avukatları tarafından meslektaş dayanışması kapsamında ücretsiz olarak sunulan eğitim amaçlı bir modeldir.",
    },
    {
        title: "Delil değeri",
        text: "6100 sayılı Hukuk Muhakemeleri Kanunu m. 266 vd. ve 6754 sayılı Bilirkişilik Kanunu uyarınca düzenlenen bilirkişi raporu, HMK m. 293 kapsamında uzman görüşü veya hukuki mütalaa niteliği taşımaz; yargı mercilerine ya da karşı tarafa delil olarak sunulmak üzere hazırlanmamıştır. Somut uyuşmazlıkta tazminat hesabı, mahkemece görevlendirilen bilirkişi tarafından yapılır.",
    },
    {
        title: "Veri ve varsayımlar",
        text: "Sonuçlar yalnızca kullanıcının girdiği verilere dayanır; maluliyet ve kusur oranları ile gelir bilgisi doğrulanmaz. Belgelendirilen gerçek gelir, Sosyal Güvenlik Kurumunca bağlanan gelirin mahsubu, müterafik kusur, hatır taşıması gibi indirim sebepleri ile mevzuat ve içtihat değişiklikleri sonucu değiştirebilir.",
    },
    {
        title: "Sorumluluk",
        text: "Bu çalışmaya dayanılarak yapılan işlem, verilen karar veya yapılan başvurulardan Cumhuriyet Avukatları sorumlu tutulamaz.",
    },
    {
        title: "Kişisel veriler",
        text: "Hesaplama tamamen kullanıcının tarayıcısında yapılır; girilen bilgiler herhangi bir sunucuya iletilmez ve saklanmaz.",
    },
];

/** Altbilgi ve PDF alt satırında kullanılan tek cümlelik hatırlatma */
export const DISCLAIMER_LINE = "Eğitim amaçlı modeldir; bilirkişi raporu, uzman görüşü veya hukuki mütalaa yerine geçmez.";
