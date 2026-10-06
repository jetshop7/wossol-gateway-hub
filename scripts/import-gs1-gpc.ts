import { readFile } from "node:fs/promises";
import {
  parseGpcImportXmlDocument,
  importGpcMultilingualRelease,
} from "../src/server/catalog/gs1-gpc-import.ts";

function option(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const englishPath = option("--input-en");
const frenchPath = option("--input-fr");
const version = option("--version");
if (!englishPath || !frenchPath || !version) {
  console.error(
    "Usage: bun run taxonomy:import-gpc -- --input-en <official-gpc-en.xml> --input-fr <official-gpc-fr.xml> --version YYYY-MM",
  );
  process.exitCode = 2;
} else {
  try {
    const [englishXml, frenchXml] = await Promise.all([
      readFile(englishPath, "utf8"),
      readFile(frenchPath, "utf8"),
    ]);
    const english = parseGpcImportXmlDocument(englishXml);
    const french = parseGpcImportXmlDocument(frenchXml);
    if (english.languageCode !== "EN" || french.languageCode !== "FR")
      throw new Error(
        "Use an EN official XML for --input-en and an FR official XML for --input-fr.",
      );
    if (english.sourceVersion !== version || french.sourceVersion !== version)
      throw new Error("The supplied version must match both files' GS1 dateUtc metadata.");
    if (english.sourceDate !== french.sourceDate)
      throw new Error("The English and French GS1 files must have the same source date.");
    const expected = { segments: 45, families: 162, classes: 938, bricks: 5318 };
    const actual = {
      segments: english.rows.filter((row) => row.level === "SEGMENT").length,
      families: english.rows.filter((row) => row.level === "FAMILY").length,
      classes: english.rows.filter((row) => row.level === "CLASS").length,
      bricks: english.rows.filter((row) => row.level === "BRICK").length,
    };
    if (version === "2026-05" && JSON.stringify(actual) !== JSON.stringify(expected))
      throw new Error(
        `Official 2026-05 GPC node totals do not match acceptance counts: ${JSON.stringify(actual)}.`,
      );
    const result = await importGpcMultilingualRelease(version, [
      { languageCode: english.languageCode, rows: english.rows },
      { languageCode: french.languageCode, rows: french.rows },
    ]);
    console.log(JSON.stringify(result, null, 2));
    if (result.errors.length) process.exitCode = 1;
  } catch (error) {
    console.error(error instanceof Error ? error.message : "GPC import failed.");
    process.exitCode = 1;
  }
}
