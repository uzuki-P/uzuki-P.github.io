// Copy into tabquest/.scratch/ and run there: DB=file:/tmp/tq-demo/tabquest.db UPLOADS=/tmp/tq-demo/uploads RECEIPT=<image.webp> bun run .scratch/tabquest-seed.ts
// Throwaway: seeds a demo DB with made-up players for portfolio screenshots.
import { copyFileSync } from "node:fs"
import { Effect } from "effect"
import { applyMigrations, openDatabase } from "@/db/client"
import { createPlayer } from "@/server/services/players"
import { createFullBill, publishBill } from "@/server/services/bills"
import { collectPayment } from "@/server/services/payments"
import { refreshPlayerHoverSummaries } from "@/server/services/insights"

const run = <A, E>(e: Effect.Effect<A, E>) => Effect.runPromise(e as Effect.Effect<A, never>)
const db = await openDatabase(process.env.DB!)
await applyMigrations(db)
const deps = { db, uploadDir: process.env.UPLOADS! }

const names = ["Raka", "Sinta", "Dewi", "Bima", "Laras", "Yoga", "Nadia", "Fikri"]
const ids: Record<string, string> = {}
for (const name of names) ids[name] = (await run(createPlayer({ db }, { name }))).id

const menu = {
  "Kopi Kenangan": [["Kopi Susu Mantan", 24000], ["Caramel Latte", 29000], ["Croissant", 22000]],
  "Mie Gacoan": [["Mie Suit Lv 3", 12000], ["Udang Keju", 10000], ["Es Teh", 6000]],
  "Sate Padang Ajo": [["Sate Padang", 28000], ["Kerupuk Jangek", 8000], ["Teh Talua", 15000]],
  "Martabak Bangka": [["Martabak Coklat Keju", 65000], ["Martabak Telur", 55000]],
  "Ayam Penyet Ria": [["Ayam Penyet", 27000], ["Tempe Penyet", 15000], ["Es Jeruk", 9000]],
  "Starbucks Sun Plaza": [["Caffè Latte", 52000], ["Java Chip", 62000], ["Banana Bread", 34000]],
} as Record<string, [string, number][]>

const bills: [string, string, string, string[]][] = [
  ["Kopi Kenangan", "Monday coffee run", "2026-10-05", ["Raka", "Sinta", "Dewi", "Bima"]],
  ["Mie Gacoan", "Lunch, spicy edition", "2026-10-08", ["Raka", "Bima", "Yoga", "Fikri", "Nadia"]],
  ["Sate Padang Ajo", "Late-shift dinner", "2026-10-13", ["Sinta", "Laras", "Yoga"]],
  ["Martabak Bangka", "Sprint demo treats", "2026-10-16", ["Raka", "Sinta", "Dewi", "Bima", "Laras", "Yoga", "Nadia", "Fikri"]],
  ["Ayam Penyet Ria", "Friday lunch", "2026-10-23", ["Dewi", "Laras", "Nadia", "Fikri"]],
  ["Starbucks Sun Plaza", "Client visit", "2026-10-28", ["Raka", "Sinta", "Nadia"]],
  ["Kopi Kenangan", "Afternoon slump", "2026-10-30", ["Bima", "Yoga", "Dewi"]],
]

let n = 0
for (const [merchant, title, orderDate, people] of bills) {
  const items = menu[merchant].map(([name, unitPrice], i) => ({ id: `i${n}-${i}`, name, variantNotes: "", quantity: people.length, unitPrice, lineTotal: unitPrice * people.length, sortOrder: i }))
  const allocations = items.flatMap((item, i) => people.map((p, j) => ({ itemId: item.id, billPlayerId: `bp${n}-${j}`, quantity: 1 }))).filter((_, k) => (k * 7 + n) % 3 !== 0)
  const used = new Map<string, number>()
  for (const a of allocations) used.set(a.itemId, (used.get(a.itemId) ?? 0) + 1)
  for (const it of items) { it.quantity = used.get(it.id) ?? 0; it.lineTotal = it.quantity * it.unitPrice }
  const liveItems = items.filter((i) => i.quantity > 0)
  const subtotal = liveItems.reduce((s, i) => s + i.lineTotal, 0)
  const adjustments = [{ id: `a${n}-d`, type: "delivery" as const, label: "Delivery fee", amount: 8000, sortOrder: 0 }, { id: `a${n}-s`, type: "discount" as const, label: "Promo", amount: -Math.round(subtotal * 0.15), sortOrder: 1 }]
  const finalTotal = subtotal + adjustments.reduce((s, a) => s + a.amount, 0)
  const objectKey = `${crypto.randomUUID()}.webp`
  copyFileSync(process.env.RECEIPT!, `${deps.uploadDir}/${objectKey}`)
  const bill = await run(createFullBill(deps, { merchant, title, orderDate, currency: "IDR", sourceSubtotal: subtotal, finalTotal }, {
    items: liveItems, adjustments,
    billPlayers: people.map((p, j) => ({ id: `bp${n}-${j}`, alias: p, playerId: ids[p], sortOrder: j })),
    allocations,
  }, { objectKey, mediaType: "image/webp", byteSize: 2000 }))
  await run(publishBill(deps, bill.id))
  n++
}

// Settle up for some players, with tips.
const tips: Record<string, number> = { Raka: 5000, Sinta: 2000, Dewi: 0, Laras: 10000, Yoga: 1000, Fikri: 3000 }
for (const [p, tip] of Object.entries(tips)) {
  const { listOutstandingPayments } = await import("@/server/services/payments")
  const out: any = await run(listOutstandingPayments({ db } as any, ids[p] as any) as any).catch(() => null)
  const owed = out?.totalOwed || null
  if (owed == null) { console.log("skip", p, Object.keys(out ?? {})); continue }
  await run(collectPayment(deps, { playerId: ids[p], totalPaid: owed + tip, actor: "seed" }))
}
await db.transaction((tx: any) => refreshPlayerHoverSummaries(tx))
console.log("seeded", n, "bills")
