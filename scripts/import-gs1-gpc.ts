import { readFile } from "node:fs/promises";
import {
  parseGpcImportJson,
  parseGpcImportXml,
  importGpcRelease,
} from "../src/server/catalog/gs1-gpc-import.ts";

function option(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const inputPath = option("--input");
const version = option("--version");
if (!inputPath || !version) {
  console.error(
    "Usage: bun run taxonomy:import-gpc -- --input <reviewed-official-gpc.xml|json> --version YYYY-MM",
  );
  process.exitCode = 2;
} else {
  try {
    const source = await readFile(inputPath, "utf8");
    const rows = inputPath.toLowerCase().endsWith(".xml")
      ? parseGpcImportXml(source)
      : parseGpcImportJson(JSON.parse(source) as unknown);
    const result = await importGpcRelease(version, rows);
    console.log(JSON.stringify(result, null, 2));
    if (result.errors.length) process.exitCode = 1;
  } catch (error) {
    console.error(error instanceof Error ? error.message : "GPC import failed.");
    process.exitCode = 1;
  }
}
