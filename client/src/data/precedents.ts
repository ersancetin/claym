export interface Precedent {
    division: string;
    esas: string;
    karar: string;
    tarih?: string;
    text: string;
    systemNote: string;
}

export const PRECEDENTS: Precedent[] = [
    {
        division: "4. Hukuk Dairesi",
        esas: "2024/5497",
        karar: "2024/6426",
        tarih: "25.06.2024",
        text: "Dosya kapsamına göre; Kaza tarihinde 18 yaşından küçük olan davacının (kazada 16 yaşında olduğu), gelir getirici bir işte çalışmadığı, dolayısıyla geçici iş göremezlik süresince mahrum kaldığı herhangi bir kazancı bulunmadığı anlaşılmakla, geçici iş göremezlik zararı da doğmamıştır. Uyuşmazlık Hakem Heyetince hükme esas alınan bilirkişi raporunda ise kaza tarihinde 18 yaşından küçük olan ve gelir getirici bir işte çalıştığı tespit edilemeyen davacı hakkında, geçici iş göremezlik tazminatı hesaplandığı anlaşılmaktadır. İtiraz Hakem Heyetince geçici iş göremezlik yönünden davacının itirazının kabulü yerine reddi isabetli olmadığından kararın bozulması gerekmiştir.",
        systemNote: "Kaza tarihinde 18 yaşından küçük ve çalışmayan kişiler için geçici iş göremezlik kaleminde uyarı gösterilir.",
    },
    {
        division: "17. Hukuk Dairesi",
        esas: "2017/5154",
        karar: "2018/5443",
        text: "...bir aylık asgari ücretin miktarı ayın kaç gün çektiğine göre değişmemekte olup... 28 gün çeken ayda da 31 gün çeken ayda da çalışana aynı miktarda aylık ödeme yapılmakta... bilirkişi tarafından her yıl için fazladan hesaplama yapılmış olması doğru görülmemiş...",
        systemNote: "Hesaplamalar aylık net kazanç metodolojisine göre yapılır; artık yıllardaki 29 Şubat günü dışlanır.",
    },
    {
        division: "4. Hukuk Dairesi",
        esas: "2023/13132",
        karar: "2024/524",
        text: "...davacıların kaza tarihinde bulunduğu yaşa göre bakiye ömrün belirlenmesi... gerekirken yazılı şekilde verilen karar hatalıdır.",
        systemNote: "Bakiye ömür, kaza tarihindeki tam yaşa göre belirlenir.",
    },
    {
        division: "4. Hukuk Dairesi",
        esas: "2022/16229",
        karar: "2024/13018",
        text: "...Davacının doğum tarihi doğru olarak tespit edilerek ve kaza tarihindeki yaşı esas alınarak TRH 2010 Yaşam Tablosuna göre bakiye ömrünün belirlenmesi... gerekir.",
        systemNote: "Bakiye ömür TRH-2010 tablosundan, kaza tarihindeki tam yaşa göre doğrusal enterpolasyonla bulunur.",
    },
    {
        division: "Hukuk Genel Kurulu",
        esas: "1994/9-628",
        karar: "1995/694",
        text: "Hesaplama yapılırken, davacının kaza tarihinden hesap tarihine kadar işlemiş (bilinen) dönem zarar hesabının yapılması; hesap tarihinden sonra da işleyecek dönem hesabı yapılması gereklidir...",
        systemNote: "Tazminat, bilinen dönem (kaza tarihinden hesap tarihine) ve bilinmeyen dönem (hesap tarihinden bakiye ömür sonuna) olarak ayrı hesaplanır.",
    },
    {
        division: "4. Hukuk Dairesi",
        esas: "2023/9773",
        karar: "2025/5472",
        text: "...Somut dosyada mükerrer olacak şekilde 270 günlük geçici iş göremezlik süresi de bilinen dönem içine dahil edilerek hesaplanmış olup... geçici iş göremezlik süresi hesaplamadan dışlanmak suretiyle bilinen dönem süresi belirlenip sonucuna göre karar verilmesi gerekirken...",
        systemNote: "Geçici iş göremezlik süresi, mükerrerliği önlemek için sürekli iş göremezlik hesabından otomatik olarak çıkarılır.",
    },
];
