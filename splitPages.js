#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

function printUsageAndExit() {
  const scriptName = path.basename(process.argv[1] || "split_pages.js");
  console.error(
    `Usage: node ${scriptName} <chapters.json> [--out chapterPages.json]\n\n` +
      `Reads chapters (array of { chapterName, text }) and splits each chapter's text into 250-word pages.`
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

function splitChapterIntoPages(chapterText, wordsPerPage) {
  if (!chapterText || chapterText.trim().length === 0) {
    return [];
  }
  // Split on any whitespace, filter empty tokens
  const words = chapterText.split(/\s+/).filter(Boolean);
  const pages = [];
  for (let i = 0; i < words.length; i += wordsPerPage) {
    const chunk = words.slice(i, i + wordsPerPage);
    pages.push(chunk.join(" "));
  }
  return pages;
}

function main() {
  const { input, out } = parseArgs(process.argv);
  const raw = fs.readFileSync(input, "utf8");
  let chapters;
  try {
    chapters = JSON.parse(raw);
  } catch (err) {
    console.error(`Failed to parse JSON from ${input}:`, err.message);
    process.exit(1);
  }

  if (!Array.isArray(chapters)) {
    console.error("Input JSON must be an array of { chapterName, text } objects.");
    process.exit(1);
  }

  const WORDS_PER_PAGE = 250;
  const chapterPages = chapters.map((ch) => {
    const pages = splitChapterIntoPages(ch.text || "", WORDS_PER_PAGE).map((text, idx) => ({
      pageNumber: idx + 1,
      text,
    }));
    return {
      chapterName: ch.chapterName,
      pages,
    };
  });

  const json = JSON.stringify(chapterPages, null, 2);
  if (out) {
    fs.writeFileSync(out, json, "utf8");
  } else {
    process.stdout.write(json);
  }
}

if (require.main === module) {
  main();
}


