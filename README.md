# ali110

وب‌سایت دوزبانه (فارسی پیش‌فرض، انگلیسی) دربارهٔ فضایل، سخنان و میراث امام علی (ع)؛ کاملاً استاتیک و آمادهٔ GitHub Pages، بدون React/Vue/Tailwind و بدون بک‌اند.

- **فناوری:** HTML، CSS و JavaScript ماژولار (ES modules). هیچ وابستگی در سمت مرورگر نیست.
- **محتوا:** فایل‌های JSON در پوشهٔ `data/`، با اعتبارسنجی خودکار.
- **ویژگی‌ها:** حدیث روزانه، جست‌وجوی فارسی/عربی/انگلیسی، تم روشن/تیره، RTL/LTR، پخش‌کنندهٔ صوتی، لایت‌باکس، PWA و حالت آفلاین.
- **Node** فقط برای ابزارهای توسعه لازم است (بیلد، اعتبارسنجی، تست، خودکارسازی)، نه برای اجرای سایت.

> English quick start is at the end of this file.

---

## ۱. اجرای محلی

```bash
npm install          # فقط یک بار (cheerio برای اسکریپت حدیث روزانه)
npm run serve        # http://localhost:8080
```

اجرای شبیه GitHub Pages (زیر مسیر `/ali110/`):

```bash
node scripts/serve.js --base=/ali110 --port=8081   # http://localhost:8081/ali110/
```

سایت را نمی‌شود با دوبار کلیک روی `index.html` (آدرس `file://`) دید، چون مرورگر اجازهٔ خواندن JSON را نمی‌دهد؛ حتماً از `npm run serve` استفاده کنید.

دستورهای مفید:

| دستور | کار |
|---|---|
| `npm run validate` | اعتبارسنجی همهٔ فایل‌های `data/` و ارجاع‌های بین آن‌ها |
| `npm test` | تست‌های واحد (طرح‌واره، حدیث روزانه، جست‌وجو، استخراج و خودکارسازی) |
| `npm run check` | هر دو دستور بالا؛ دقیقاً همان چیزی که پیش از انتشار در GitHub Actions اجرا می‌شود |
| `npm run build` | بازتولید صفحه‌ها، `sitemap.xml`، `precache.json` و شمارهٔ نسخهٔ `sw.js` در همین پوشه |
| `npm run build:dist` | ساخت نسخهٔ قابل انتشار در `dist/` (بدون `node_modules`، تست‌ها و اسکریپت‌ها) |

> اگر فایل‌های `js/`، `css/` یا `data/` را عوض کردید و می‌خواهید حالت آفلاین/PWA هم به‌روز شود، یک بار `npm run build` بزنید.

---

## ۲. ساختار پروژه

```
ali110/
├── index.html, about/, virtues/, hadiths/, narrations/,
│   typography/, gallery/, audio/, articles/, search/   ← پوستهٔ هر صفحه (تولیدشده با npm run build)
├── 404.html, offline.html, manifest.json, sw.js, robots.txt, sitemap.xml
├── assets/  logo/ icons/ fonts/ images/ (audio/ و images/gallery/ را خودتان می‌سازید)
├── css/     themes.css  main.css  components.css  responsive.css
├── js/
│   ├── app.js  router.js  i18n.js  locales.js  theme.js  meta.js
│   ├── data-loader.js  schema.js  daily.js  search.js  icons.js  util.js  site-config.js
│   ├── components/  header footer hero hadith-card daily-hadith cards lightbox audio-player ...
│   └── pages/       home about collection search-page
├── data/    hadiths articles virtues narrations typography gallery audio daily about source-queue (.json)
├── scripts/ build-pages.js  validate-content.js  fetch-daily-hadith.js  serve.js  make-assets.py  lib/
├── tests/
└── .github/workflows/  deploy.yml  daily-hadith.yml  ci.yml
```

هر صفحه یک پوستهٔ HTML کوچک دارد که همان ماژول‌های JS را بارگذاری می‌کند؛ بنابراین آدرس‌ها تمیز هستند (`/hadiths/`)، عنوان و توضیحات هر صفحه در HTML موجود است (برای SEO) و به هیچ سرور یا قانون بازنویسی نیاز نیست. صفحه‌های جزئیات از `?id=` استفاده می‌کنند، مثل `/hadiths/?id=nahj-hikma-081`.

---

## ۳. لوگو

لوگوی اصلی بدون هیچ تغییری در `assets/logo/ali110-logo-original.png` نگه‌داری می‌شود. فقط این کارها روی آن انجام شده است: حذف حاشیهٔ شفاف، کوچک‌کردن با حفظ نسبت، و قرارگرفتن روی بوم مربعی برای آیکون‌ها. اسکریپت `scripts/make-assets.py` این نسخه‌ها را از فایل اصلی می‌سازد (`python3 scripts/make-assets.py`).

دو استثنا که پلتفرم‌ها اجبار می‌کنند: `apple-touch-icon.png` و `icon-maskable-512.png` باید پس‌زمینهٔ تمام‌رنگ داشته باشند؛ پس لوگو (بدون تغییر) روی سبز تیره `#063F38` قرار گرفته است.

چون لوگو زرد روشن است، هدر، هیرو و فوتر در هر دو تم روی سبز تیره‌اند تا لوگو همیشه خوانا بماند.

---

## ۴. افزودن محتوا

هر فایل `data/*.json` به این شکل است: `{ "schema": 1, "items": [ ... ] }`. هر مورد یک `id` یکتا دارد (حروف کوچک انگلیسی، عدد و `-`). فیلدهای متنی به صورت `{ "fa": "...", "en": "..." }` هستند. پس از هر تغییر `npm run validate` را بزنید؛ خطاها دقیقاً فایل و `id` را نشان می‌دهند.

### حدیث (`data/hadiths.json`)

```json
{
  "id": "nahj-hikma-081",
  "arabic": "قِيمَةُ كُلِّ امْرِئٍ مَا يُحْسِنُهُ.",
  "translation": { "fa": "…", "en": "…", "status": "draft", "translator": "نام مترجم یا منبع" },
  "source": {
    "work": { "fa": "نهج‌البلاغه", "en": "Nahj al-Balagha" },
    "reference": { "fa": "حکمت ۸۱", "en": "Saying 81" },
    "url": "https://…"
  },
  "narrator": null,
  "verification": {
    "status": "source-linked",
    "note": { "fa": "چه چیزی با چه منبعی تطبیق داده شد", "en": "…" },
    "checkedAt": "2026-11-04"
  },
  "category": "knowledge",
  "tags": ["knowledge"],
  "featured": false,
  "addedAt": "2026-11-04"
}
```

- `verification.status`: ‏`verified` (با منبع معتبر تطبیق داده شده)، `source-linked` (منبع مشخص است ولی بازبینی کامل نشده) یا `unverified`.
- `translation.status`: ‏`draft` (پیش‌نویس، در سایت با برچسب هشدار)، `reviewed` یا `sourced` (ترجمه از منبع). ترجمهٔ فارسی یا انگلیسی می‌تواند نباشد؛ سایت همان را که هست نشان می‌دهد.
- `narrator` را فقط وقتی بنویسید که منبع راوی را مشخص کرده است؛ وگرنه `null`.
- دستهٔ جدید (`category`) را اگر در `js/locales.js` به صورت `category.<نام>` ترجمه نکنید، نام خام نمایش داده می‌شود.

**هیچ حدیث، راوی، ترجمه یا مرجعی را از خودتان نسازید.** چهار حدیث نمونه از بخش حکمت‌های نهج‌البلاغه آمده‌اند و متن عربی‌شان با balagha.app تطبیق داده شده است. ترجمه‌های فارسی و انگلیسی آن‌ها **پیش‌نویس تحریریه** هستند و باید پیش از اتکا بازبینی شوند؛ در سایت هم همین‌طور برچسب خورده‌اند. شماره‌گذاری حکمت‌ها در چاپ‌های مختلف اندکی فرق می‌کند.

### حدیث روزانه

بدون هیچ کاری، سایت هر روز از میان احادیث موجود به‌صورت چرخشی یکی را نشان می‌دهد. اگر می‌خواهید برای تاریخی حدیث مشخصی نمایش داده شود، در `data/daily.json` اضافه کنید:

```json
{ "date": "2026-11-20", "hadithId": "nahj-hikma-005" }
```

حدیث «امروز» = جدیدترین ورودی با تاریخِ امروز یا قبل‌تر. اگر روزی بازیابی خودکار شکست بخورد، همان آخرین حدیث ثبت‌شده نمایش داده می‌شود.

### مقاله (`data/articles.json`) و روایت تاریخی (`data/narrations.json`)

فیلدهای مهم: `title`، `summary`، `body` (آرایه‌ای از پاراگراف‌ها به تفکیک `fa` و `en`)، `category`، `publishedAt` و `sources` (فهرست `{title, url}`؛ برای روایت‌های تاریخی حداقل یک منبع الزامی است). `cover` اختیاری است؛ نبودنش یک طرح هندسی را به‌جای عکس نشان می‌دهد.

### فضایل (`data/virtues.json`)

هر فضیلت با `links: [{ "type": "hadiths", "id": "…" }]` به احادیث، روایت‌ها و مقاله‌های مرتبط وصل می‌شود. اعتبارسنج بررسی می‌کند که همهٔ `id`ها وجود داشته باشند. آیکون‌ها در `js/icons.js` هستند (`book`، `path`، `shield`، `star`، `pen`، …).

### تایپوگرافی (`data/typography.json`)

هر قاب فقط به یک حدیث اشاره می‌کند (`hadithId`) و یکی از سبک‌های `emerald`، `gold`، `night`، `cream` را دارد. متن از همان حدیث با فونت Amiri رندر می‌شود؛ نیازی به تصویر نیست.

### تصویر (`data/gallery.json`)

1. فایل را (ترجیحاً WebP) در `assets/images/gallery/` بگذارید. نسخهٔ بندانگشتی `thumb` اختیاری است.
2. ورودی را بنویسید:

```json
{ "id": "poster-01", "src": "assets/images/gallery/poster-01.webp", "width": 1600, "height": 1000,
  "alt": { "fa": "…", "en": "…" }, "caption": { "fa": "…", "en": "…" }, "credit": "نام طراح", "addedAt": "2026-11-04" }
```

`width` و `height` (ابعاد واقعی) برای جلوگیری از پرش چیدمان لازم‌اند. مسیرها نسبی هستند، نه با `/` شروع شوند و نه `..` داشته باشند.

### صوت (`data/audio.json`)

1. فایل را در `assets/audio/` بگذارید (MP3 یا M4A). برای مخاطب کم‌اینترنت فایل‌ها را کوچک نگه دارید؛ خود GitHub Pages محدودیت اندازهٔ سایت (حدود ۱ گیگابایت) و پهنای باند دارد. فایل‌های بسیار حجیم را در میزبان دیگری بگذارید و `src` را آدرس `https://` بدهید.
2. ورودی:

```json
{ "id": "maddahi-01", "title": { "fa": "…", "en": "…" }, "kind": "maddahi",
  "speaker": { "fa": "…", "en": "…" }, "src": "assets/audio/maddahi-01.mp3", "duration": 312, "addedAt": "2026-11-04" }
```

`kind` یکی از `maddahi`، `speech`، `mawlid`، `lecture` است. فقط وقتی کاربر دکمه را بزند پخش می‌شود (خودکار هرگز).

> فعلاً `gallery.json` و `audio.json` خالی‌اند، چون هیچ تصویر یا فایل صوتی با منبع و مجوز مشخص در اختیار نداشتیم. صفحه‌ها در این حالت پیام «هنوز اضافه نشده» نشان می‌دهند. بعد از افزودن اولین مورد، بخش‌های مربوط در صفحهٔ اصلی خودکار پر می‌شوند.

### متن‌های رابط

همهٔ برچسب‌ها، دکمه‌ها و پیام‌ها در `js/locales.js` هستند (کلیدها باید در `fa` و `en` یکسان باشند؛ `npm run validate` این را هم بررسی می‌کند). متن دربارهٔ امام و سیاست منبع‌دهی در `data/about.json` است.

---

## ۵. حدیث روزانهٔ خودکار

جریان کار (`.github/workflows/daily-hadith.yml`، هر روز ساعت ۰۲:۱۷ UTC یا دستی از تب Actions):

1. اسکریپت `scripts/fetch-daily-hadith.js` اولین صفحهٔ باقی‌ماندهٔ `pending` در `data/source-queue.json` را برمی‌دارد.
2. `robots.txt` را می‌خواند و اگر اجازه نباشد (یا خوانده نشود) صفحه را رد می‌کند. با User-Agent مشخص، timeout، چند بار تلاش مجدد با تأخیر افزایشی و فاصلهٔ ۱٫۵ ثانیه بین درخواست‌ها کار می‌کند.
3. برای ویکی‌شیعه از MediaWiki Action API (مستند و فقط‌خواندنی) و برای ImamAli.net از خود صفحه استفاده می‌کند؛ فقط میزبان‌های فهرست‌شده در `scripts/sources.config.json` مجازند.
4. متن عربی و ترجمهٔ فارسی/انگلیسی کنار آن را بیرون می‌کشد، تکراری‌ها (حتی با اعراب متفاوت) را کنار می‌گذارد و آدرس صفحهٔ منبع را نگه می‌دارد.
5. نتیجه را با همان طرح‌وارهٔ سایت اعتبارسنجی می‌کند؛ اگر معتبر نبود هیچ چیز نوشته نمی‌شود.
6. حدیث با برچسب «دارای پیوند به منبع، بازبینی‌نشده» به `hadiths.json`، ورودی روز به `daily.json` و صفحه به `done` اضافه می‌شود.
7. اگر داده تغییر کرد، commit و push می‌شود و deploy دوباره اجرا می‌شود.

اگر هر مرحله‌ای شکست بخورد، داده‌های موجود دست‌نخورده می‌ماند و سایت آخرین حدیث را نشان می‌دهد؛ این فرایند هرگز مانع ساخت یا انتشار سایت نمی‌شود.

### راه‌اندازی (لازم است، چون هیچ صفحه‌ای از قبل در صف نیست)

ویکی‌شیعه و ImamAli.net API عمومی مستندی برای «حدیث روز» ندارند، و من در محیط ساخت به این سایت‌ها دسترسی نداشتم. بنابراین استخراج روی فایل‌های آزمایشی تست شده، نه روی صفحه‌های واقعی. مراحل درست:

1. صفحه‌ای را پیدا کنید که حدیث با متن عربی دارد، و آن را آزمایش کنید (چیزی نمی‌نویسد):
   ```bash
   node scripts/fetch-daily-hadith.js --dry-run --url=https://fa.wikishia.net/view/…
   ```
   خروجی فهرست متن‌های عربی پیدا‌شده و ترجمه‌های کنارشان است. اگر چیز درستی پیدا نشد، آن صفحه برای این روش مناسب نیست (ساختارش با استخراج‌کننده در `scripts/lib/extract.js` نمی‌خواند).
2. آدرس صفحه‌های خوب را به `pending` در `data/source-queue.json` اضافه کنید: `{ "url": "https://…" }`.
3. در GitHub: تب **Actions ← Daily hadith ← Run workflow** با گزینهٔ «dry run» و سپس یک اجرای واقعی.
4. حدیث‌های خودکار را حتماً با منبع مقایسه و بازبینی کنید و بعد `verification.status` را به `verified` ارتقا دهید.

هیچ کلید یا رمزی لازم نیست. اگر روزی به سرویسی با کلید نیاز شد، آن را فقط در **Settings ← Secrets and variables ← Actions** نگه دارید و در workflow با `${{ secrets.NAME }}` بخوانید؛ هرگز در JS یا فایل‌های مخزن ننویسید.

---

## ۶. انتشار روی GitHub Pages

1. مخزن را در GitHub بسازید و کد را به شاخهٔ `main` push کنید.
2. **Settings ← Pages ← Build and deployment ← Source: GitHub Actions**.
3. هر push به `main` سایت را منتشر می‌کند (`deploy.yml`: اعتبارسنجی، تست، `npm run build:dist`، انتشار). آدرس نهایی در خروجی همان workflow و در بخش Pages نمایش داده می‌شود.
4. در **Settings ← Actions ← General ← Workflow permissions** گزینهٔ «Read and write permissions» را بزنید تا workflow حدیث روزانه بتواند commit کند.

آدرس سایت (`https://<user>.github.io/<repo>/`) خودکار حساب می‌شود و در canonical، `og:url`، `sitemap.xml` و `robots.txt` قرار می‌گیرد. برای دامنهٔ اختصاصی، در **Settings ← Secrets and variables ← Actions ← Variables** متغیری به نام `SITE_URL` با مقدار مثل `https://ali110.example/` بسازید.

همهٔ مسیرها نسبی‌اند، پس سایت هم زیر `/<repo>/` و هم روی دامنهٔ اصلی بدون تغییر کار می‌کند (با `--base=/ali110` تست شده).

### تنظیم‌های دیگر

- `js/site-config.js`: نام، آدرس، و `social` (فهرست `{ name, url }`؛ تا وقتی خالی است ستون شبکه‌های اجتماعی در فوتر نمایش داده نمی‌شود).
- رنگ‌ها: `css/themes.css`. فونت‌ها: Vazirmatn و Amiri (مجوز OFL) به‌صورت محلی در `assets/fonts/`.

---

## ۷. PWA و آفلاین

`manifest.json` و `sw.js` سایت را نصب‌پذیر می‌کنند. فایل‌های اصلی (پوستهٔ صفحه‌ها، CSS، JS، فونت‌ها، داده‌ها) پیش‌ذخیره می‌شوند و در پس‌زمینه تازه می‌شوند. فایل‌های `data/*.json` اول از شبکه گرفته می‌شوند (تا حدیث تازه فوراً دیده شود) و فقط هنگام آفلاین‌بودن از نسخهٔ ذخیره‌شده استفاده می‌شود؛ نسخه‌های قدیمی‌تر از ۱۴ روز نادیده گرفته می‌شوند. صفحه‌ای که هرگز ذخیره نشده باشد `offline.html` را نشان می‌دهد.

---

## ۸. آمادگی برای بک‌اند در آینده

لایهٔ داده از نمایش جداست: همهٔ صفحه‌ها فقط از `js/data-loader.js` می‌خوانند و طرح‌واره در `js/schema.js` است (همان کدی که اسکریپت‌های Node هم استفاده می‌کنند). برای رفتن به بک‌اند:

1. API بسازید که همان قالب `{ items: [...] }` را برای هر مجموعه برگرداند (`GET /api/hadiths`، …).
2. در `data-loader.js`، تابع `fetchJson` را به آن آدرس اشاره دهید؛ بقیهٔ سایت بدون تغییر کار می‌کند.
3. پنل مدیریت (افزودن/ویرایش حدیث و مقاله، آپلود تصویر و صوت، دسته‌بندی، ویرایش ترجمه، انتخاب محتوای ویژه) باید پشت احراز هویت روی همان سرور باشد. این امکان را در نسخهٔ GitHub Pages عمداً ساختگی پیاده نکرده‌ایم، چون فرم سمت مرورگر نمی‌تواند به‌صورت امن فایل‌های مخزن را عوض کند. کار فعلی ویرایش JSON و Pull Request (یا ویرایش مستقیم در GitHub) و اعتبارسنجی با `npm run validate` است.

---

## ۹. محدودیت‌های شناخته‌شده

- ترجمه‌های نمونه پیش‌نویس‌اند و باید توسط فرد آگاه بازبینی شوند.
- گالری و کتابخانهٔ صوتی تا افزودن محتوا خالی‌اند.
- حدیث روزانهٔ خودکار نیاز به راه‌اندازی دارد (بخش ۵) و روی سایت‌های واقعی آزمایش نشده است.
- جست‌وجو در مرورگر و روی حافظهٔ داده‌هاست؛ تا چند هزار مورد مناسب است و برای ده‌ها هزار مورد باید به نمایهٔ پیش‌ساخته یا سرویس جست‌وجو رفت.
- انتقال بین صفحه‌ها با View Transitions (فقط در مرورگرهای پشتیبان)؛ در بقیه صفحه بدون افکت عوض می‌شود.
- سایت بدون جاوااسکریپت فقط پیام «جاوااسکریپت لازم است» را نشان می‌دهد؛ متن عنوان و توضیحات هر صفحه ولی در HTML هست.

---

## English quick start

```bash
npm install
npm run serve            # http://localhost:8080
npm run check            # validate data + run tests
npm run build:dist       # deployable site in ./dist
```

Deploy: push to `main`, then set **Settings → Pages → Source: GitHub Actions**. Content lives in `data/*.json` (schemas in `js/schema.js`; run `npm run validate` after editing). The daily-hadith job (`.github/workflows/daily-hadith.yml`) reads pages you list in `data/source-queue.json`, respects robots.txt, validates before writing and never overwrites data on failure; until you add pages the site rotates through the curated hadiths. Sample translations are marked as unreviewed drafts. `gallery.json` and `audio.json` are empty until you add media.
