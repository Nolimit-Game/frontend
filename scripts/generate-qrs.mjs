import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import QRCode from "qrcode";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first.");
}

const response = await fetch(
  `${supabaseUrl}/rest/v1/checkpoints?select=sequence_order,title,qr_secret&order=sequence_order.asc`,
  {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
  },
);

if (!response.ok) {
  throw new Error(`Could not load checkpoints: ${response.status} ${await response.text()}`);
}

const checkpoints = await response.json();
const outputDirectory = path.join(process.cwd(), "public", "generated-qrs");
await mkdir(outputDirectory, { recursive: true });

for (const checkpoint of checkpoints) {
  const scanUrl = `${appUrl}/scan?token=${encodeURIComponent(checkpoint.qr_secret)}`;
  const filename = `checkpoint-${checkpoint.sequence_order}.svg`;
  await writeFile(
    path.join(outputDirectory, filename),
    await QRCode.toString(scanUrl, { type: "svg", margin: 2, width: 800 }),
  );
  console.log(`${filename}: ${checkpoint.title} -> ${scanUrl}`);
}

console.log(`Generated ${checkpoints.length} QR codes in ${outputDirectory}`);
