# MyCar.az — maşın al-sat + virtual qaraj

Mobile-first Next.js 16 tətbiqi.

```bash
npm install
npm run dev   # http://localhost:3000
```

## Bölmələr
- `/` — əsas səhifə, son elanlar
- `/elanlar` — axtarış və filtrlər (marka, kuzov, qiymət aralığı, il, yürüş, qutu, yanacaq, rəng, şəhər); filtrlər linkdə saxlanır, axtarışı yadda saxlamaq olur (`lib/search.ts`)
- `/elan/[id]` — elan: bazar qiyməti aralığı + etibarlılıq, qiymət tarixçəsi, oxşar elanlar, kredit kalkulyatoru, paylaş, WhatsApp, şikayət, xroniki problemlər, "Aldım → qaraja əlavə et"
- `/muqayise` — 3 maşına qədər yan-yana müqayisə (ən yaxşı göstərici işarələnir)
- `/secilmisler` — bəyənilən elanlar və yadda saxlanmış axtarışlar (yeni elan sayı ilə)
- `/bildirisler` — xatırlatmalar (baxış, sənəd bitmə tarixi, köhnə yürüş, axtarışa düşən yeni elan) + telefon bildirişləri (`lib/reminders.ts`, `lib/notify.ts`, `public/sw.js`, `app/manifest.ts` — sayt PWA kimi quraşdırılır)
- `/elan-yerlesdir` — elan yerləşdirmə (şəkil yükləmə, avtomatik qiymət təklifi)
- `/qaraj` — 3D virtual qaraj: maşınlar yan-yana park yerlərində, sağa-sola sürüşdürərək baxılır (`GarageCarousel3D`); `/qaraj/elave-et` — mövcud maşını əlavə et
- `/qaraj/[id]` — işıqlı realistik qarajda 3D maşın (`GarageRoom`) (detala toxun → təmir qeyd et, X-ray rejimi), baxış cədvəli, təmir tarixçəsi, məsləhət satış qiyməti, xroniki problemlər + videolar, qarajdan satış; **Xərclər** (yanacaq jurnalı, L/100 km, aylıq xərc qrafiki), **Sənədlər** (sığorta, texniki baxış, KASKO, yol vergisi — bitmə tarixi və şəkil). Qəbzin şəklindən məbləğ/tarix/litr avtomatik oxunur (`lib/ocr.ts`, brauzerdə Tesseract.js; dil faylları ilk istifadədə CDN-dən yüklənir)

## Struktur
- `src/lib/data/models.ts` — model kataloqu, xroniki problemlər, video axtarış sorğuları
- `src/lib/maintenance.ts` — baxış intervalları və status hesablaması
- `src/lib/pricing.ts` — amortizasiya + oxşar elanlar + baxış balı → satış qiyməti
- `src/lib/store.ts` — zustand store (hələlik brauzerin localStorage-ında saxlanılır)
- `src/components/garage/` — 3D səhnə (react-three-fiber) və qaraj tabları

## Real vizuallar

**3D modellər** — `public/models/*.glb`, qeydiyyat `src/lib/data/models3d.ts`.
- Hazırda bütün maşınlar üçün ümumi real model işləyir: Khronos *Car Concept* (Eric Chadwick, CC BY 4.0 — atribusiya qarajda göstərilir).
- Konkret model əlavə etmək: `.glb` faylını `public/models/<modelId>.glb`-ə qoy, `MODEL_3D`-yə yaz. Əvvəlcə optimallaşdır:
  ```bash
  npx @gltf-transform/cli optimize in.glb public/models/bmw-5-f10.glb \
    --compress meshopt --texture-compress webp --texture-size 1024 \
    --join false --flatten false --palette false --instance false
  ```
- Rəng: `models3d.ts`-də `OVERRIDES` — kuzov materialının adı (`paint`). Bütün maşın tək palitra-teksturadan rənglənirsə (məs. Kia Optima), `paletteKey` ilə kuzov rəngi seçilir və həmin üçbucaqlar yüklənəndə ayrıca boya materialına ayrılır.
- Detallar mesh adlarından avtomatik tanınır (hood, door, bumper, wheel, headlight…); adı olmayan hissələrə toxunanda ən yaxın detal seçilir.

**2D foto** — `.env.local`-da `NEXT_PUBLIC_CAR_IMAGES_PROVIDER` və `NEXT_PUBLIC_CAR_IMAGES_KEY` (bax `.env.example`). Açar yoxdursa SVG göstərilir.

## Nümunə elan şəkilləri

`public/listings/seed-*.jpg` — Wikimedia Commons-dan sərbəst lisenziyalı fotolar (CC0, public domain, CC BY, CC BY-SA). Bir neçə elanda eyni maşının əlavə şəkilləri var (`seed-N-2.jpg`, `-3`) — kartda şəkillər arasında keçmək olur. Müəllif və lisenziya `src/lib/data/seedPhotos.json`-dadır və elan səhifəsində şəklin altında göstərilir (CC BY/BY-SA bunu tələb edir). Elandakı rəng fotodakı maşının rənginə uyğunlaşdırılıb.

## Növbəti addımlar
- Real verilənlər bazası + istifadəçi hesabları (indi data yalnız brauzerdədir)
- Şəkillər üçün obyekt saxlama (Blob)
- Server tərəfli push/SMS (indi bildirişlər tətbiq açılanda göndərilir)
- Real GLB modellər (hər marka üçün)
