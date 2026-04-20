
architecture --
https://excalidraw.com/#json=PEK6tZ46iFT74lnFRAYZt,XlZu68isZTChqR8cVIx4mQ

docs -

# Maker Protection Engine (MPE)


## File Structure

```
packages/mpe/
├── package.json              ← scripts: test, test:watch, simulate, simulate:big
├── tsconfig.json
├── src/
│   ├── types.ts              ← All shapes: Order, Market, MpeContext, MpeDecision,
│   │                            FillRecord, CancelRequest, ArbitrationResult, MpeMetrics
│   ├── config.ts             ← Every numeric threshold in one place
│   ├── contextBuilder.ts     ← Pure fn: computes deviation, delay, volatility, spread, midPrice
│   ├── engine.ts             ← Runs rules in order, short-circuits on first failure → ALLOW | CANCEL
│   ├── cancelArbitration.ts  ← Post-fill: PROTECT_MAKER or TAKER_KEEPS based on cancel speed + market move
│   ├── logger.ts             ← Structured JSON log per evaluation
│   ├── metrics.ts            ← createMetrics / recordMetric / printMetrics
│   ├── index.ts              ← Public API — only import from here
│   └── rules/                ← Pure functions, no side effects
│       ├── strongStale.ts    ← deviation > 3% → hard cancel, runs first
│       ├── deviation.ts      ← deviation > 2% (tightens to 1% under high volatility)
│       ├── delay.ts          ← order age > 5000ms (tightens to 2500ms under high volatility)
│       └── volatility.ts     ← if vol > 5%, re-enforces tighter deviation + delay limits
├── tests/
│   └── engine.test.ts        ← 16 tests: one block per rule + cancel grace window (7 cases)
└── scripts/
    └── simulate.ts           ← Runs N random orders, prints JSON logs + metrics summary
```

---

## Data Flow

```
Order + Market
      ↓
  contextBuilder        computes: deviation, delay, volatility, spread, midPrice
      ↓
   engine.ts            strongStale → deviation → delay → volatility
      ↓                 (short-circuits on first failure)
 ALLOW / CANCEL
      ↓  if ALLOW → fill executes on-chain
cancelArbitration       maker sends cancel post-fill
      ↓
PROTECT_MAKER / TAKER_KEEPS
```

---

## Cancel Grace Window Logic

```
cancelDelay > 10s?          → TAKER_KEEPS  (hard deadline, window closed)
cancelDelay <= 2s?          → PROTECT_MAKER (fast cancel, always honored)
oracleMove >= 1%?           → PROTECT_MAKER (bot exploit evidence)
else                        → TAKER_KEEPS  (fair fill, taker earned it)
```

---

tests

```bash
# Tests
pnpm test

# Simulate 200 random orders (default)
node_modules/.bin/tsx scripts/simulate.ts

# Custom count
node_modules/.bin/tsx scripts/simulate.ts 1000
```
