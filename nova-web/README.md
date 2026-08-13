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

## Контракт enum — РЯДКИ ✅

Бекенд оновлено (JsonStringEnumConverter). Усі enum ходять рядками — фронт мігровано
відповідно (`src/lib/enums.ts` — string-first):

| enum | значення |
|---|---|
| Currency | `"UAH"` / `"USD"` / `"EUR"` |
| CardType | `"White"` / `"Black"` / `"Platinum"` |
| TransactionType | `"Transfer"` / `"TopUp"` / `"Payment"` / `"Withdrawal"` |
| TransactionStatus | `"Pending"` / `"Completed"` / `"Failed"` |

## Нові ендпоінти v2 (підключено)

- `GET /api/cards/{id}/cvv` → `{ cvv }` — CVV тягнеться **лише на тап** «показати» на звороті
  картки (не наперед), тоді blur→sharp.
- `POST /api/transactions/transfer-by-card` `{ fromAccountId, cardNumber, amount, description, idempotencyKey }`
  — **первинний** переказ за номером картки. Помилки ProblemDetails показуються юзеру як `detail`.

### ⚠️ Дрібниці, які лишаю тобі (бекенд не чіпав)
- **`detail` помилок transfer-by-card — англійською** («Card not found», «Insufficient funds»…).
  Фронт показує `detail` як є (за контрактом). Якщо хочеш українською — локалізуй на бекенді.
- **IBAN / «Основний»** — реальних полів немає, тому на звороті картки псевдо-IBAN
  синтезовано з `id` (`UA••NNNN`, `src/lib/format.ts → pseudoIban`), «Основний» = перший рахунок. Косметика.
- **Ліміти** (кнопка на звороті) — бекенду немає, показую заглушку-шторку «скоро».

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
