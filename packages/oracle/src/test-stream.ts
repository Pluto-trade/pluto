import { startPriceStream, getCachedPrice } from "./index.js";

const SYMBOLS = ["SOL-USD"];

async function main() {
    console.log("Starting price stream for:", SYMBOLS.join(", "));
    console.log("Prices will update below...\n");

    await startPriceStream(SYMBOLS);

    setInterval(() => {
        for (const symbol of SYMBOLS) {
            const data = getCachedPrice(symbol);
            if (data) {
                const age = Math.round(Date.now() / 1000 - data.publishTime);
                console.log(
                    `[${new Date().toISOString()}]  ${symbol}  $${data.price.toFixed(4)}  ±${data.confidence.toFixed(4)}  age: ${age}s`
                );
            } else {
                console.log(`[${new Date().toISOString()}]  ${symbol}  waiting for first update...`);
            }
        }
    }, 1000);
}

main().catch(console.error);
