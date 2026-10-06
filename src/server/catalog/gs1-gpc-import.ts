import type { CatalogTaxonomyLevel, Prisma } from "@prisma/client";
import { createHash } from "node:crypto";
import { getWossolExportPrisma } from "./prisma.server.ts";

export type GpcImportRow = {
  sourceCode: string;
  level: CatalogTaxonomyLevel;
  name: string;
  description?: string | null;
  parentCode?: string | null;
  replacementCode?: string | null;
};

export type GpcImportError = { row: number; code?: string; message: string };
export type GpcLanguageCode = "EN" | "FR";
export type GpcXmlDocument = {
  languageCode: GpcLanguageCode;
  sourceDate: string;
  sourceVersion: string;
  rows: GpcImportRow[];
};

function decodeXmlText(value: string) {
  return value.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (entity, token: string) => {
    const lower = token.toLowerCase();
    if (lower === "amp") return "&";
    if (lower === "lt") return "<";
    if (lower === "gt") return ">";
    if (lower === "quot") return '"';
    if (lower === "apos") return "'";
    const codePoint = lower.startsWith("#x")
      ? Number.parseInt(lower.slice(2), 16)
      : Number.parseInt(lower.slice(1), 10);
    return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : entity;
  });
}

/** Read GS1's published nested GPC XML hierarchy (code/text attributes). */
export function parseGpcImportXml(xml: string): GpcImportRow[] {
  if (/<!DOCTYPE/i.test(xml))
    throw new Error("DOCTYPE declarations are not accepted in GPC import files.");
  const rows: GpcImportRow[] = [];
  const stack: GpcImportRow[] = [];
  const taxonomyTag = new Map<string, CatalogTaxonomyLevel>([
    ["segment", "SEGMENT"],
    ["family", "FAMILY"],
    ["class", "CLASS"],
    ["brick", "BRICK"],
  ]);
  const tokenPattern = /<\/?[A-Za-z_][\w:.-]*(?:\s[^<>]*?)?\s*\/?>/g;
  let token: RegExpExecArray | null;
  while ((token = tokenPattern.exec(xml))) {
    const raw = token[0];
    const closing = /^<\//.test(raw);
    const selfClosing = /\/\s*>$/.test(raw);
    const tagMatch = /^<\/?([A-Za-z_][\w:.-]*)/.exec(raw);
    const localName = tagMatch?.[1]?.split(":").at(-1)?.toLowerCase();
    const level = localName ? taxonomyTag.get(localName) : undefined;
    if (!level) continue;
    if (closing) {
      const popped = stack.pop();
      if (!popped || popped.level !== level)
        throw new Error(`Malformed GPC XML: unexpected closing ${localName} element.`);
      continue;
    }
    const attributes = new Map<string, string>();
    const attributeSource = raw.slice(
      tagMatch?.[0].length ?? 1,
      raw.length - (selfClosing ? 2 : 1),
    );
    const attrPattern = /([A-Za-z_][\w:.-]*)\s*=\s*(["'])(.*?)\2/g;
    let attr: RegExpExecArray | null;
    while ((attr = attrPattern.exec(attributeSource)))
      attributes.set(attr[1]!.split(":").at(-1)!.toLowerCase(), decodeXmlText(attr[3]!));
    const parent = stack.at(-1);
    const sourceCode = attributes.get("code") ?? attributes.get(`${localName}code`);
    const name =
      attributes.get("text") ??
      attributes.get(`${localName}text`) ??
      attributes.get("name") ??
      attributes.get(`${localName}name`) ??
      attributes.get("title");
    if (!sourceCode || !name)
      throw new Error(`Malformed GPC XML: ${localName} requires code and text/name attributes.`);
    const row: GpcImportRow = {
      sourceCode,
      level: level as CatalogTaxonomyLevel,
      name,
      description:
        attributes.get("description") ??
        attributes.get(`${localName}description`) ??
        attributes.get("definition") ??
        null,
      parentCode: parent?.sourceCode ?? null,
    };
    rows.push(row);
    if (!selfClosing) stack.push(row);
  }
  if (stack.length)
    throw new Error(`Malformed GPC XML: unclosed ${stack.at(-1)?.level.toLowerCase()} element.`);
  if (!rows.length) throw new Error("No GPC hierarchy nodes were found in the XML file.");
  return rows;
}

/** Read and validate GS1's root metadata as well as the nested hierarchy. */
export function parseGpcImportXmlDocument(xml: string): GpcXmlDocument {
  const root = /<schema\b([^>]*)>/i.exec(xml)?.[1];
  if (!root) throw new Error("GPC XML must have a schema root element.");
  const attribute = (name: string) => {
    const match = new RegExp(`(?:^|\\s)${name}\\s*=\\s*(["'])(.*?)\\1`, "i").exec(root);
    return match?.[2];
  };
  const languageCode = attribute("languageCode");
  if (languageCode !== "EN" && languageCode !== "FR")
    throw new Error("GS1 XML languageCode must be EN or FR.");
  const sourceDate = attribute("dateUtc");
  const dateMatch = sourceDate && /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(sourceDate);
  if (!dateMatch) throw new Error("GS1 XML dateUtc must use day/month/year format.");
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[1]);
  const year = Number(dateMatch[3]);
  const parsedDate = new Date(Date.UTC(year, month - 1, day));
  if (
    parsedDate.getUTCFullYear() !== year ||
    parsedDate.getUTCMonth() !== month - 1 ||
    parsedDate.getUTCDate() !== day
  )
    throw new Error("GS1 XML dateUtc is not a valid calendar date.");
  return {
    languageCode,
    sourceDate,
    sourceVersion: `${year}-${String(month).padStart(2, "0")}`,
    rows: parseGpcImportXml(xml),
  };
}

const parentLevel: Record<CatalogTaxonomyLevel, CatalogTaxonomyLevel | null> = {
  SEGMENT: null,
  FAMILY: "SEGMENT",
  CLASS: "FAMILY",
  BRICK: "CLASS",
};

/** Parse the documented interchange mapping used by this importer. */
export function parseGpcImportJson(input: unknown): GpcImportRow[] {
  if (!input || typeof input !== "object" || !Array.isArray((input as { nodes?: unknown }).nodes)) {
    throw new Error('Expected a JSON object with a "nodes" array.');
  }
  const rawNodes: unknown[] = (input as { nodes: unknown[] }).nodes;
  return rawNodes.map((value, index) => {
    if (!value || typeof value !== "object" || Array.isArray(value))
      throw new Error(`Node ${index + 1} must be an object.`);
    const row = value as Record<string, unknown>;
    const { sourceCode, level, name, description, parentCode, replacementCode } = row;
    if (typeof sourceCode !== "string" || typeof level !== "string" || typeof name !== "string") {
      throw new Error(`Node ${index + 1} requires string sourceCode, level, and name fields.`);
    }
    if (!["SEGMENT", "FAMILY", "CLASS", "BRICK"].includes(level))
      throw new Error(`Node ${index + 1} has an unsupported GPC level.`);
    for (const [key, candidate] of [
      ["description", description],
      ["parentCode", parentCode],
      ["replacementCode", replacementCode],
    ] as const) {
      if (candidate !== undefined && candidate !== null && typeof candidate !== "string")
        throw new Error(`Node ${index + 1} field ${key} must be a string or null.`);
    }
    return {
      sourceCode,
      level: level as CatalogTaxonomyLevel,
      name,
      description: description as string | null | undefined,
      parentCode: parentCode as string | null | undefined,
      replacementCode: replacementCode as string | null | undefined,
    };
  });
}

export function validateGpcImportRows(rows: readonly GpcImportRow[]): GpcImportError[] {
  const errors: GpcImportError[] = [];
  if (!rows.length) return [{ row: 0, message: "The release contains no taxonomy nodes." }];
  const byCode = new Map<string, GpcImportRow>();
  rows.forEach((row, index) => {
    if (!row.sourceCode.trim() || !row.name.trim())
      errors.push({
        row: index + 1,
        code: row.sourceCode,
        message: "Code and official name must be non-empty.",
      });
    if (row.sourceCode !== row.sourceCode.trim())
      errors.push({
        row: index + 1,
        code: row.sourceCode,
        message: "Source codes cannot have leading or trailing whitespace.",
      });
    if (byCode.has(row.sourceCode))
      errors.push({
        row: index + 1,
        code: row.sourceCode,
        message: "Duplicate source code in release.",
      });
    else byCode.set(row.sourceCode, row);
  });
  rows.forEach((row, index) => {
    const expectedParent = parentLevel[row.level];
    if (expectedParent === null) {
      if (row.parentCode)
        errors.push({
          row: index + 1,
          code: row.sourceCode,
          message: "A Segment cannot have a parent.",
        });
      return;
    }
    if (!row.parentCode) {
      errors.push({
        row: index + 1,
        code: row.sourceCode,
        message: `${row.level} must have a ${expectedParent} parent.`,
      });
      return;
    }
    const parent = byCode.get(row.parentCode);
    if (!parent)
      errors.push({
        row: index + 1,
        code: row.sourceCode,
        message: `Parent ${row.parentCode} is missing from this release.`,
      });
    else if (parent.level !== expectedParent)
      errors.push({
        row: index + 1,
        code: row.sourceCode,
        message: `Parent ${row.parentCode} must be a ${expectedParent}, not ${parent.level}.`,
      });
    if (row.replacementCode && !byCode.has(row.replacementCode))
      errors.push({
        row: index + 1,
        code: row.sourceCode,
        message: `Replacement ${row.replacementCode} is missing from this release.`,
      });
    else if (row.replacementCode && byCode.get(row.replacementCode)?.level !== row.level)
      errors.push({
        row: index + 1,
        code: row.sourceCode,
        message: "Replacement node must be at the same hierarchy level.",
      });
    if (row.replacementCode === row.sourceCode)
      errors.push({
        row: index + 1,
        code: row.sourceCode,
        message: "A node cannot replace itself.",
      });
  });
  for (const level of ["SEGMENT", "FAMILY", "CLASS", "BRICK"] as const) {
    if (!rows.some((row) => row.level === level))
      errors.push({ row: 0, message: `Release is missing ${level} nodes.` });
  }
  return errors;
}

export type GpcImportSummary = {
  source: "GS1_GPC";
  sourceVersion: string;
  created: number;
  updated: number;
  unchanged: number;
  deprecated: number;
  translationCreated: number;
  translationUpdated: number;
  translationUnchanged: number;
  languages: GpcLanguageCode[];
  errors: GpcImportError[];
  counts: { segments: number; families: number; classes: number; bricks: number };
};

export type ExistingGpcNode = {
  sourceCode: string;
  level: CatalogTaxonomyLevel;
  parentCode: string | null;
  status: string;
  deprecatedAt: Date | null;
};

export type GpcTransactionRunner = <T>(
  operation: (tx: Prisma.TransactionClient) => Promise<T>,
) => Promise<T>;

async function createInBatches<T>(
  values: readonly T[],
  createMany: (batch: T[]) => Promise<unknown>,
) {
  for (let offset = 0; offset < values.length; offset += 500)
    await createMany(values.slice(offset, offset + 500));
}

/** Stable UUIDv5-shaped identifier for a source/version/code identity. */
export function gpcNodeId(sourceVersion: string, sourceCode: string) {
  const bytes = createHash("sha1")
    .update(`wossol-catalog-taxonomy\0GS1_GPC\0${sourceVersion}\0${sourceCode}`)
    .digest()
    .subarray(0, 16);
  bytes[6] = (bytes[6]! & 0x0f) | 0x50;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function planGpcImport(rows: readonly GpcImportRow[], existing: readonly ExistingGpcNode[]) {
  const oldByCode = new Map(existing.map((node) => [node.sourceCode, node]));
  const incomingCodes = new Set(rows.map((row) => row.sourceCode));
  const created: string[] = [];
  const updated: string[] = [];
  const unchanged: string[] = [];
  for (const row of rows) {
    const previous = oldByCode.get(row.sourceCode);
    if (!previous) created.push(row.sourceCode);
    else if (
      previous.level === row.level &&
      previous.parentCode === (row.parentCode ?? null) &&
      previous.status === "ACTIVE" &&
      previous.deprecatedAt === null
    )
      unchanged.push(row.sourceCode);
    else updated.push(row.sourceCode);
  }
  const deprecated = existing
    .filter((node) => !incomingCodes.has(node.sourceCode) && node.status !== "ARCHIVED")
    .map((node) => node.sourceCode);
  return { created, updated, unchanged, deprecated };
}

/** Idempotently install bilingual GS1 data for one structural release. */
export async function importGpcMultilingualRelease(
  sourceVersion: string,
  languages: readonly { languageCode: GpcLanguageCode; rows: readonly GpcImportRow[] }[],
  transactionRunner?: GpcTransactionRunner,
): Promise<GpcImportSummary> {
  const canonical = languages.find((language) => language.languageCode === "EN")?.rows ?? [];
  const errors = languages.flatMap((language) => validateGpcImportRows(language.rows));
  if (
    languages.length !== 2 ||
    new Set(languages.map((language) => language.languageCode)).size !== 2 ||
    !languages.some((language) => language.languageCode === "EN") ||
    !languages.some((language) => language.languageCode === "FR")
  )
    errors.push({
      row: 0,
      message: "A GS1 release import requires exactly one EN and one FR file.",
    });
  const canonicalByCode = new Map(canonical.map((row) => [row.sourceCode, row]));
  for (const language of languages) {
    if (language.languageCode === "EN") continue;
    const translatedByCode = new Map(language.rows.map((row) => [row.sourceCode, row]));
    if (translatedByCode.size !== canonicalByCode.size)
      errors.push({
        row: 0,
        message: `${language.languageCode} hierarchy has a different code count from EN.`,
      });
    for (const [code, row] of canonicalByCode) {
      const translated = translatedByCode.get(code);
      if (
        !translated ||
        translated.level !== row.level ||
        (translated.parentCode ?? null) !== (row.parentCode ?? null)
      )
        errors.push({
          row: 0,
          code,
          message: `${language.languageCode} code, level, or parent does not match EN.`,
        });
    }
  }
  const rows = canonical;
  const counts = {
    segments: rows.filter((row) => row.level === "SEGMENT").length,
    families: rows.filter((row) => row.level === "FAMILY").length,
    classes: rows.filter((row) => row.level === "CLASS").length,
    bricks: rows.filter((row) => row.level === "BRICK").length,
  };
  const summary: GpcImportSummary = {
    source: "GS1_GPC",
    sourceVersion,
    created: 0,
    updated: 0,
    unchanged: 0,
    deprecated: 0,
    translationCreated: 0,
    translationUpdated: 0,
    translationUnchanged: 0,
    languages: languages.map((language) => language.languageCode),
    errors,
    counts,
  };
  if (errors.length) return summary;
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(sourceVersion))
    return {
      ...summary,
      errors: [{ row: 0, message: "Version must use YYYY-MM format, for example 2026-05." }],
    };

  const prisma = getWossolExportPrisma();
  try {
    const runTransaction: GpcTransactionRunner =
      transactionRunner ??
      ((operation) => prisma.$transaction(operation, { maxWait: 10_000, timeout: 120_000 }));
    await runTransaction(async (tx) => {
      const existing = await tx.catalogTaxonomyNode.findMany({
        where: { source: "GS1_GPC", sourceVersion },
        select: {
          id: true,
          sourceCode: true,
          level: true,
          parentId: true,
          replacementId: true,
          parent: { select: { sourceCode: true } },
          status: true,
          deprecatedAt: true,
        },
      });
      const plan = planGpcImport(
        rows,
        existing.map((node) => ({ ...node, parentCode: node.parent?.sourceCode ?? null })),
      );
      summary.created = plan.created.length;
      summary.updated = plan.updated.length;
      summary.unchanged = plan.unchanged.length;
      summary.deprecated = plan.deprecated.length;
      const existingTranslations = await tx.catalogTaxonomyTranslation.findMany({
        where: { node: { source: "GS1_GPC", sourceVersion }, languageCode: { in: ["EN", "FR"] } },
        select: {
          id: true,
          node: { select: { sourceCode: true } },
          languageCode: true,
          name: true,
          description: true,
          source: true,
        },
      });
      const oldTranslations = new Map(
        existingTranslations.map((translation) => [
          `${translation.languageCode}\0${translation.node.sourceCode}`,
          translation,
        ]),
      );
      for (const language of languages)
        for (const row of language.rows) {
          const old = oldTranslations.get(`${language.languageCode}\0${row.sourceCode}`);
          if (!old) summary.translationCreated++;
          else if (
            old.name === row.name &&
            old.description === (row.description ?? null) &&
            old.source === "GS1_GPC"
          )
            summary.translationUnchanged++;
          else summary.translationUpdated++;
        }
      const idsByCode = new Map(existing.map((node) => [node.sourceCode, node.id]));
      for (const row of rows)
        if (!idsByCode.has(row.sourceCode))
          idsByCode.set(row.sourceCode, gpcNodeId(sourceVersion, row.sourceCode));
      const release = await tx.catalogTaxonomyRelease.upsert({
        where: { source_sourceVersion: { source: "GS1_GPC", sourceVersion } },
        create: { source: "GS1_GPC", sourceVersion },
        update: { status: "IMPORTING", isActive: false },
      });
      const orderedRows = [...rows].sort(
        (left, right) =>
          ["SEGMENT", "FAMILY", "CLASS", "BRICK"].indexOf(left.level) -
          ["SEGMENT", "FAMILY", "CLASS", "BRICK"].indexOf(right.level),
      );
      const oldNodesByCode = new Map(existing.map((node) => [node.sourceCode, node]));
      const nodeCreates: Prisma.CatalogTaxonomyNodeCreateManyInput[] = [];
      const nodeUpdates: Array<{
        id: string;
        data: Prisma.CatalogTaxonomyNodeUncheckedUpdateInput;
      }> = [];
      for (const row of orderedRows) {
        const id = idsByCode.get(row.sourceCode);
        if (!id) throw new Error(`Importer failed to allocate an ID for ${row.sourceCode}.`);
        const parentId = row.parentCode ? idsByCode.get(row.parentCode) : null;
        if (row.parentCode && !parentId)
          throw new Error(`Validated parent ${row.parentCode} has no internal ID.`);
        const previous = oldNodesByCode.get(row.sourceCode);
        if (!previous) {
          nodeCreates.push({
            id,
            source: "GS1_GPC",
            sourceCode: row.sourceCode,
            sourceVersion,
            level: row.level,
            parentId,
            replacementId: null,
            status: "ACTIVE",
            deprecatedAt: null,
          });
        } else if (
          previous.level !== row.level ||
          previous.parentId !== parentId ||
          previous.replacementId !== null ||
          previous.status !== "ACTIVE" ||
          previous.deprecatedAt !== null
        ) {
          nodeUpdates.push({
            id: previous.id,
            data: {
              level: row.level,
              parentId,
              replacementId: null,
              status: "ACTIVE",
              deprecatedAt: null,
            },
          });
        }
      }
      await createInBatches(nodeCreates, (batch) =>
        tx.catalogTaxonomyNode.createMany({ data: batch }),
      );
      for (const update of nodeUpdates)
        await tx.catalogTaxonomyNode.update({ where: { id: update.id }, data: update.data });

      const translationCreates: Prisma.CatalogTaxonomyTranslationCreateManyInput[] = [];
      const translationUpdates: Array<{
        id: string;
        data: Prisma.CatalogTaxonomyTranslationUpdateInput;
      }> = [];
      for (const language of languages) {
        for (const row of language.rows) {
          const nodeId = idsByCode.get(row.sourceCode);
          if (!nodeId)
            throw new Error(`Importer failed to resolve translation node ${row.sourceCode}.`);
          const old = oldTranslations.get(`${language.languageCode}\0${row.sourceCode}`);
          if (!old) {
            translationCreates.push({
              nodeId,
              languageCode: language.languageCode,
              source: "GS1_GPC",
              name: row.name,
              description: row.description ?? null,
            });
          } else if (
            old.name !== row.name ||
            old.description !== (row.description ?? null) ||
            old.source !== "GS1_GPC"
          ) {
            translationUpdates.push({
              id: old.id,
              data: { source: "GS1_GPC", name: row.name, description: row.description ?? null },
            });
          }
        }
      }
      await createInBatches(translationCreates, (batch) =>
        tx.catalogTaxonomyTranslation.createMany({ data: batch }),
      );
      for (const update of translationUpdates)
        await tx.catalogTaxonomyTranslation.update({ where: { id: update.id }, data: update.data });
      // Resolve replacement links only after every release row exists, as GS1
      // files do not promise that replacement targets occur earlier in a file.
      for (const row of rows) {
        if (!row.replacementCode) continue;
        const id = idsByCode.get(row.sourceCode);
        const replacementId = idsByCode.get(row.replacementCode);
        if (id && replacementId)
          await tx.catalogTaxonomyNode.update({ where: { id }, data: { replacementId } });
      }
      const importedCodes = rows.map((row) => row.sourceCode);
      const stale = await tx.catalogTaxonomyNode.findMany({
        where: { source: "GS1_GPC", sourceVersion, sourceCode: { notIn: importedCodes } },
        select: { id: true, status: true },
      });
      if (stale.length)
        await tx.catalogTaxonomyNode.updateMany({
          where: { id: { in: stale.map((node) => node.id) } },
          data: { status: "ARCHIVED", deprecatedAt: new Date() },
        });

      await tx.catalogTaxonomyRelease.updateMany({
        where: { source: "GS1_GPC", isActive: true },
        data: { isActive: false, status: "SUPERSEDED" },
      });
      await tx.catalogTaxonomyRelease.update({
        where: { id: release.id },
        data: {
          status: "ACTIVE",
          isActive: true,
          segmentCount: counts.segments,
          familyCount: counts.families,
          classCount: counts.classes,
          brickCount: counts.bricks,
          importedAt: new Date(),
        },
      });
    });
  } catch {
    return {
      ...summary,
      created: 0,
      updated: 0,
      unchanged: 0,
      deprecated: 0,
      translationCreated: 0,
      translationUpdated: 0,
      translationUnchanged: 0,
      errors: [
        { row: 0, message: "The taxonomy transaction failed; no release changes were committed." },
      ],
    };
  }
  return summary;
}
