#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

function printUsageAndExit() {
  const scriptName = path.basename(process.argv[1] || "split_chapters.js");
  console.error(
    `Usage: node ${scriptName} <input.txt> [--out output.json]\n\n` +
      `Splits a plain text ebook into chapters. Chapters start when a heading line is encountered:` +
      ` PREFACE, CHAPTER <roman numerals>, or CONCLUSION. The very first section is named TITLE.`
  );
  process.exit(1);
}

function parseArgs(argv) {
  const args = argv.slice(2);
  if (args.length < 1) {
    printUsageAndExit();
  }
  const options = { input: args[0], out: null };
  for (let i = 1; i < args.length; i += 1) {
    const token = args[i];
    if (token === "--out") {
      if (i + 1 >= args.length) {
        console.error("--out requires a file path");
        process.exit(1);
      }
      options.out = args[i + 1];
      i += 1;
    } else {
      console.error(`Unknown argument: ${token}`);
      printUsageAndExit();
    }
  }
  return options;
}

function isHeadingLine(rawLine) {
  const line = rawLine.trim();
  if (line.length === 0) return null;

  // Exact, case-sensitive matches for these book-level sections
  const upper = line.toUpperCase();
  if (upper === "PREFACE" || upper === "CONCLUSION") {
    return upper; // normalize to canonical upper-case label
  }

  // CHAPTER <roman numerals> [optional punctuation/subtitle]
  // Accepts forms like: "CHAPTER I", "CHAPTER II.", "CHAPTER V: A New Friend", etc.
  const chapterMatch = /^CHAPTER\s+[IVXLCDM]+(?:\b|\.|:)(?:.*)?$/i; // case-insensitive for safety
  if (chapterMatch.test(line)) {
    // Preserve the original trimmed heading as the chapterName
    return line;
  }

  return null;
}

function splitIntoChapters(text) {
  const lines = text.split(/\r?\n/);

  /** @type {{chapterName: string, text: string}[]} */
  const chapters = [];
  let currentChapter = { chapterName: "TITLE", text: "" };
  let buffer = [];
  chapters.push(currentChapter);

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const heading = isHeadingLine(line);

    if (heading) {
      // Close out the previous chapter
      currentChapter.text = buffer.join("\n");
      buffer = [];

      // Start a new chapter with this heading as the name
      currentChapter = { chapterName: heading, text: "" };
      chapters.push(currentChapter);
      continue; // Do not include heading line inside text
    }

    buffer.push(line);
  }

  // Finalize last chapter
  currentChapter.text = buffer.join("\n");

  return chapters;
}

function main() {
  const { input, out } = parseArgs(process.argv);
  const content = fs.readFileSync(input, "utf8");
  const chapters = splitIntoChapters(content);
  const json = JSON.stringify(chapters, null, 2);

  if (out) {
    fs.writeFileSync(out, json, "utf8");
  } else {
    process.stdout.write(json);
  }
}

if (require.main === module) {
  main();
}


