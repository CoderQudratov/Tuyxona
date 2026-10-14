import { sendKeepAlivePing } from "../lib/keepalive/cron";

async function main() {
  console.log("Keep-alive tekshiruvi boshlandi...");
  const result = await sendKeepAlivePing();
  if (result.success) {
    console.log(`Keep-alive muvaffaqiyatli! Status: ${result.status}`);
    process.exit(0);
  } else {
    console.error(`Keep-alive xatolik bilan tugadi:`, result.error || result.status);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Keep-alive script xatoligi:", err);
  process.exit(1);
});

