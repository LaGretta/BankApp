# Nova — фронтенд (React + TypeScript PWA)

Клієнт цифрового банку **Nova**. Тільки фронтенд — бекенд (BankApp.API) твій, я його не чіпав.
Темна тема, tech-мінімалізм, iridescent-матеріал, маскот Nova, PWA (офлайн-shell).

---

## Запуск

```bash
cd nova-web
npm install
npm run dev
```

Відкриється на **http://localhost:5173** (порт зафіксовано навмисно — саме його дозволяє
CORS твого бекенду: `WithOrigins("http://localhost:5173")` у `Program.cs`).

Спочатку підніми свій бекенд на `http://localhost:5203`, тоді фронтенд.

### Прод-збірка

```bash
npm run build      # → dist/  (tsc + vite + service worker)
npm run preview    # локальний перегляд зібраного
```

### Іконки застосунку

Майстер 1024×1024 + PWA-розміри + maskable + apple-touch генеруються з liquid-metal
краплини (NOVA_HANDOFF §9):

```bash
node scripts/gen-icons.mjs   # → public/icons/*
```

---

## Налаштування API

Базовий URL береться з `VITE_API_BASE_URL`.

- `.env` — уже створено з дефолтом `http://localhost:5203`.
- `.env.example` — шаблон.

Щоб змінити адресу бекенду — відредагуй `.env` і перезапусти `npm run dev`.

---

## Що всередині

- **Стек:** React 19 + TypeScript, Vite, `react-router-dom`, `zustand`, `lucide-react`,
  `vite-plugin-pwa`. Шрифти самохостовані (`@fontsource`) — без CDN, працює офлайн.
- **JWT:** токен зберігається в `localStorage`, відновлюється при завантаженні,
  автоматично додається в `Authorization: Bearer <token>`. На **401** — токен чиститься,
  редірект на `/login`.
- **Ідемпотентність:** новий GUID на кожну нову операцію переказу/поповнення; при повторі
  тієї самої операції ключ переви­користовується (бекенд дедуплікує).
- **Reusable-компоненти:** `Button variant="material"` (iridescent, один на всі CTA/таб/чіпи),
  `BankCard tier`, `Nova state`, `FlagBadge`, скелетони, `PullToRefresh`, `SuccessOverlay`.
- **Екрани:** Login, Register, Dashboard, Accounts, AccountDetail, CardDetail, CreateCard,
  Transfer, TopUp, History (пагінація), TransactionDetail. Empty-стани всюди з позою Nova.

### Структура

```
src/
  api/         auth, accounts, cards, transactions  (обгортки над контрактом)
  lib/         apiClient (Bearer/401/ProblemDetails), enums, types, format, idempotency
  store/       authStore (persist токена), toastStore
  components/  material Button, BankCard, Nova, FlagBadge, BottomNav, PullToRefresh, ...
  screens/     усі екрани
  hooks/       useCountUp (баланс), useAsync
  styles/      tokens.css (усі токени з хендофу), global.css (матеріал + keyframes)
public/
  flags/       Twemoji SVG (ua/us/eu) — локально, для офлайну
  icons/       app icon 1024 + PWA-розміри + maskable
```

---

## ⚠️ ВАЖЛИВО — знайдені розбіжності в бекенді (виправляєш ти, я туди не ліз)

Під час підключення я **лише читав** твої DTO/контролери/enums, щоб знати форму JSON.
Нічого в бекенді не змінював. Ось що варто поправити:

### 1. `CardType` enum — ПОРОЖНІЙ 🔴
`BankApp.Domain/Enums/CardType.cs` не має жодного значення:
```csharp
public enum CardType { }   // немає White / Black / Platinum
```
Контракт очікує типи карток White/Black/Platinum. Зараз фронт шле `cardType` числом
(White=0, Black=1, Platinum=2), а `System.Text.Json` пропускає невизначені числові
значення enum — тому створення картки **працює**, але бекенд не розрізняє тарифи.

**Що зробити:**
```csharp
public enum CardType { White, Black, Platinum }
```
Порядок значень має збігатися з `src/lib/enums.ts` (`TIER_TO_NUM`).

### 2. Немає `JsonStringEnumConverter` 🟠
У `Program.cs` не зареєстровано string-конвертер для enum, тому всі enum'и ходять по
дроту **числами** — і у відповідях, і в тілах запитів. Твій контракт у ТЗ казав слати
рядки (`{ currency: "UAH" }`, `{ cardType: "White" }`) — так бекенд повернув би **400**.

Тому фронт свідомо шле/читає **числа** (єдине джерело — `src/lib/enums.ts`):

| enum | значення |
|---|---|
| Currency | UAH=0, USD=1, EUR=2 |
| CardType | White=0, Black=1, Platinum=2 |
| TransactionType | Transfer=0, TopUp=1, Payment=2, Withdrawal=3 |
| TransactionStatus | Pending=0, Completed=1, Failed=2 |

**Якщо хочеш рядки** (читабельніший API) — додай у `Program.cs`:
```csharp
builder.Services.AddControllers().AddJsonOptions(o =>
    o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
```
…і скажи мені — я за 2 хвилини переведу `src/lib/enums.ts` на рядкові значення.

### 3. `AccountController` без `[Authorize]` 🟡
`Cards`/`Transactions` контролери мають `[Authorize]`, а `AccountController` — ні, хоча
всередині викликає `GetUserId()` з клеймів токена. З валідним токеном усе працює
(middleware наповнює `User`), але **без** токена буде `500` (бо `int.Parse(null)`) замість
`401`. Не блокер, але для консистентності додай `[Authorize]` на `AccountController`.

---

## Примітки щодо поведінки клієнта

- **Загальний баланс** на головній рахується у «головній» валюті (UAH, якщо є; інакше —
  валюта першого рахунку). Інші валюти показані окремими пігулками. FX-конвертації немає
  (бекенд її не надає), тож суми різних валют не додаються.
- **Напрям операції** в історії визначається евристикою (глобальна історія без прив'язки до
  рахунку): TopUp → «+», Transfer з `fromAccountId=null` → «+», решта → «−».
- **Переказ** — лише в межах однієї валюти (як у контракті). Призначення можна вибрати серед
  своїх рахунків тієї ж валюти або ввести номер рахунку вручну.
- **Поповнення** — за номером картки (як у банкоматі), без вибору рахунку.
- **CVV** показується **один раз** при створенні картки й більше ніде не зберігається.

---

*Git я не чіпав (не робив add/commit/push) — усе на тобі.*
