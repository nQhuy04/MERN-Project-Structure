#!/usr/bin/env node
/**
 * Kiểm tra các quy ước của dự án mà Prettier không kiểm được.
 *
 * Dự án cố ý KHÔNG dùng ESLint (xem README), nên những quy ước trước đây do lint giữ phải có
 * một công cụ nhỏ thay thế — nếu không, chúng chỉ tồn tại trong tài liệu. Script này dùng Node
 * thuần, không thêm dependency.
 *
 * Quy ước được kiểm:
 * 1. Không `console.*` trong code ứng dụng (dùng `logger` ở backend).
 * 2. Backend import `z` từ `shared/lib/zod.js`, không import thẳng `zod`.
 * 3. `backend/src/shared/` không import `backend/src/modules/`;
 *    `frontend/src/shared/` không import `frontend/src/features/`.
 * 4. Không để import thừa (tên đã import nhưng không dùng tới).
 * 5. Frontend không dùng class màu thô của Tailwind (`bg-blue-600`, `text-white`...) — chỉ dùng
 *    design token theo vai trò (`bg-primary`, `text-fg-muted`...) khai báo ở `src/index.css`.
 *
 * Bỏ qua quy ước 4 cho một file bằng dòng chú thích `check-conventions: allow-unused-imports`
 * (nhánh `practice` giữ lại import mà lời giải cần, làm gợi ý cho người học).
 *
 * Chạy: `npm run check` — thoát với mã 1 nếu có vi phạm.
 */
import { readFileSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const SOURCE_DIRS = ['backend/src', 'frontend/src'];
const SOURCE_EXTENSIONS = ['.js', '.jsx', '.mjs'];

/** File được phép vi phạm, kèm lý do (giữ danh sách này càng ngắn càng tốt). */
const EXCEPTIONS = {
  'no-raw-zod': {
    'backend/src/shared/lib/zod.js': 'chính là nơi bọc zod cho cả backend',
  },
};

const ALLOW_UNUSED_IMPORTS_MARKER = 'check-conventions: allow-unused-imports';

const TAILWIND_PALETTE =
  'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';
/** Class màu thô: `bg-blue-600`, `hover:text-slate-500/80`, `border-white`... */
const RAW_COLOR_CLASS = new RegExp(
  `\\b(?:bg|text|border(?:-[trblxyse])?|ring|ring-offset|outline|divide|fill|stroke|from|via|to|placeholder|decoration|accent|caret|shadow)-(?:(?:${TAILWIND_PALETTE})-\\d{2,3}|white|black)\\b`,
  'g',
);

/**
 * Thay mọi chú thích và nội dung chuỗi bằng khoảng trắng, giữ nguyên số dòng và vị trí cột. Nhờ
 * vậy các bước sau chỉ nhìn thấy code thật (không báo nhầm vì một chữ trong chú thích).
 *
 * Biểu thức `${...}` trong template literal ĐƯỢC giữ lại — đó là code thật, và nhiều tên chỉ được
 * dùng ở trong đó (vd. `` `users/${ownerId}/${randomUUID()}` ``).
 * @param {string} source nội dung file
 * @returns {string} nội dung cùng độ dài, phần không phải code đã bị xoá trắng
 */
function blankNonCode(source) {
  const output = [...source];
  const blank = (from, to) => {
    for (let i = from; i < to; i += 1) if (output[i] !== '\n') output[i] = ' ';
  };

  // Mỗi mức là một ngữ cảnh: code (kèm độ sâu ngoặc nhọn) hoặc thân template literal.
  const stack = [{ kind: 'code', braceDepth: 0 }];
  let index = 0;

  while (index < source.length) {
    const context = stack.at(-1);
    const char = source[index];
    const next = source[index + 1];

    if (context.kind === 'template') {
      if (char === '\\') {
        blank(index, index + 2);
        index += 2;
      } else if (char === '`') {
        stack.pop();
        index += 1;
      } else if (char === '$' && next === '{') {
        stack.push({ kind: 'code', braceDepth: 0 });
        index += 2;
      } else {
        blank(index, index + 1);
        index += 1;
      }
      continue;
    }

    if (char === '/' && next === '/') {
      const end = source.indexOf('\n', index);
      const stop = end === -1 ? source.length : end;
      blank(index, stop);
      index = stop;
    } else if (char === '/' && next === '*') {
      const end = source.indexOf('*/', index + 2);
      const stop = end === -1 ? source.length : end + 2;
      blank(index, stop);
      index = stop;
    } else if (char === '"' || char === "'") {
      let cursor = index + 1;
      while (cursor < source.length) {
        if (source[cursor] === '\\') cursor += 2;
        else if (source[cursor] === char) break;
        else cursor += 1;
      }
      blank(index + 1, Math.min(cursor, source.length));
      index = cursor + 1;
    } else if (char === '`') {
      stack.push({ kind: 'template' });
      index += 1;
    } else if (char === '{') {
      context.braceDepth += 1;
      index += 1;
    } else if (char === '}') {
      // Ngoặc đóng khi đang ở độ sâu 0 và không phải mức ngoài cùng = kết thúc một `${...}`.
      if (context.braceDepth === 0 && stack.length > 1) stack.pop();
      else context.braceDepth -= 1;
      index += 1;
    } else {
      index += 1;
    }
  }
  return output.join('');
}

/**
 * @param {string} code nội dung đã qua `blankNonCode`
 * @param {number} offset vị trí ký tự trong file
 * @returns {number} số dòng (bắt đầu từ 1)
 */
function lineOf(code, offset) {
  let line = 1;
  for (let i = 0; i < offset; i += 1) if (code[i] === '\n') line += 1;
  return line;
}

/**
 * Các tên được gán bởi một câu lệnh import, kèm nguồn import.
 *
 * Tìm câu lệnh trên bản đã xoá trắng (không dính câu lệnh giả trong chú thích), nhưng đọc đường
 * dẫn module từ bản gốc — `blankNonCode` xoá cả nội dung chuỗi nên bản đã xoá không còn đường dẫn.
 * Hai bản trùng khít từng ký tự nên dùng chung vị trí được.
 * @param {string} code nội dung đã qua `blankNonCode`
 * @param {string} original nội dung gốc của file
 * @returns {Array} mảng `{ names, source, start, end }`
 */
function parseImports(code, original) {
  const statements = [];
  const pattern = /^import\s+([^;]*?)\s+from\s+['"]([^'"]*)['"]/gm;

  for (const match of code.matchAll(pattern)) {
    const [statement, clause] = match;
    const source =
      original
        .slice(match.index, match.index + statement.length)
        .match(/['"]([^'"]*)['"]\s*$/)?.[1] ?? '';
    const names = [];
    const namedPart = clause.match(/\{([^}]*)\}/)?.[1] ?? '';
    for (const entry of namedPart.split(',')) {
      const name = entry
        .trim()
        .split(/\s+as\s+/)
        .at(-1)
        ?.trim();
      if (name) names.push(name);
    }
    for (const entry of clause.replace(/\{[^}]*\}/, '').split(',')) {
      const name = entry
        .trim()
        .replace(/^\*\s+as\s+/, '')
        .trim();
      if (name && /^[A-Za-z_$][\w$]*$/.test(name)) names.push(name);
    }
    statements.push({
      names,
      source,
      start: match.index,
      end: match.index + statement.length,
    });
  }
  return statements;
}

/**
 * @param {string} file đường dẫn tương đối so với gốc repo
 * @param {string} rule mã quy ước
 * @returns {boolean} true nếu file được miễn quy ước này
 */
function isException(file, rule) {
  return Boolean(EXCEPTIONS[rule]?.[file]);
}

/**
 * @param {string} file đường dẫn tương đối so với gốc repo
 * @returns {Array} mảng vi phạm `{ file, line, rule, message }`
 */
function checkFile(file) {
  const source = readFileSync(join(ROOT, file), 'utf8');
  const code = blankNonCode(source);
  const problems = [];
  const report = (offset, rule, message) =>
    problems.push({ file, line: lineOf(code, offset), rule, message });

  for (const match of code.matchAll(/\bconsole\s*\./g)) {
    report(
      match.index,
      'no-console',
      'Dùng logger (backend) thay cho console.* trong code ứng dụng',
    );
  }

  if (file.startsWith('frontend/src/')) {
    // Class nằm trong chuỗi → tìm trên bản gốc (bản đã xoá trắng không còn nội dung chuỗi).
    for (const match of source.matchAll(RAW_COLOR_CLASS)) {
      report(
        match.index,
        'no-raw-color',
        `Class màu thô \`${match[0]}\` — dùng design token (bg-primary, text-fg-muted...), xem docs/09-giao-dien.md`,
      );
    }
  }

  const imports = parseImports(code, source);

  for (const statement of imports) {
    if (
      statement.source === 'zod' &&
      file.startsWith('backend/') &&
      !isException(file, 'no-raw-zod')
    ) {
      report(
        statement.start,
        'no-raw-zod',
        "Backend import `z` từ 'shared/lib/zod.js', không từ 'zod'",
      );
    }
    if (file.startsWith('backend/src/shared/') && /(^|\/)modules\//.test(statement.source)) {
      report(statement.start, 'layer-boundary', 'backend/src/shared/ không được import modules/');
    }
    if (file.startsWith('frontend/src/shared/') && /(^|\/)features\//.test(statement.source)) {
      report(statement.start, 'layer-boundary', 'frontend/src/shared/ không được import features/');
    }
  }

  if (!source.includes(ALLOW_UNUSED_IMPORTS_MARKER)) {
    // Xoá trắng mọi câu lệnh import rồi tìm tên trong phần còn lại: tên chỉ xuất hiện ở dòng
    // import là import thừa.
    let body = code;
    for (const statement of imports) {
      body =
        body.slice(0, statement.start) +
        ' '.repeat(statement.end - statement.start) +
        body.slice(statement.end);
    }
    for (const statement of imports) {
      for (const name of statement.names) {
        if (!new RegExp(`\\b${name}\\b`).test(body)) {
          report(statement.start, 'no-unused-import', `Import thừa: \`${name}\``);
        }
      }
    }
  }

  return problems;
}

/**
 * @param {string} dir đường dẫn tuyệt đối
 * @returns {Promise} resolve mảng đường dẫn file tương đối so với gốc repo
 */
async function listSourceFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true, recursive: true });
  return entries
    .filter(
      (entry) =>
        entry.isFile() && SOURCE_EXTENSIONS.some((extension) => entry.name.endsWith(extension)),
    )
    .map((entry) => relative(ROOT, join(entry.parentPath, entry.name)));
}

const files = (
  await Promise.all(SOURCE_DIRS.map((dir) => listSourceFiles(join(ROOT, dir))))
).flat();
const problems = files.flatMap(checkFile).sort((a, b) => a.file.localeCompare(b.file));

if (problems.length > 0) {
  for (const problem of problems) {
    process.stderr.write(`${problem.file}:${problem.line}  [${problem.rule}] ${problem.message}\n`);
  }
  process.stderr.write(`\n${problems.length} vi phạm quy ước trong ${files.length} file.\n`);
  process.exit(1);
}

process.stdout.write(`Quy ước: không phát hiện vi phạm (${files.length} file).\n`);
