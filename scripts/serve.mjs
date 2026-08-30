import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

const port = Number(process.env.PORT || 4173);
const root = process.cwd();

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".mp4": "video/mp4",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
  ".xml": "application/xml; charset=utf-8"
};

createServer((request, response) => {
  let decodedRoute;
  try {
    const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;
    const route = pathname === "/" ? "/index.html" : pathname === "/pre-construction" ? "/pre-construction.html" : pathname;
    decodedRoute = decodeURIComponent(route);
  } catch {
    response.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Bad request");
    return;
  }
  const relativePath = normalize(decodedRoute).replace(/^[/\\]+/, "");
  const filePath = join(root, relativePath);

  if (!filePath.startsWith(`${root}/`) || !existsSync(filePath) || !statSync(filePath).isFile()) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  const size = statSync(filePath).size;
  const headers = {
    "Accept-Ranges": "bytes",
    "Content-Type": contentTypes[extname(filePath).toLowerCase()] || "application/octet-stream"
  };
  const range = request.headers.range;

  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
    let start;
    let end;

    if (match && match[1]) {
      start = Number(match[1]);
      end = match[2] ? Number(match[2]) : size - 1;
    } else if (match && match[2]) {
      const suffixLength = Number(match[2]);
      start = Math.max(size - suffixLength, 0);
      end = size - 1;
    }

    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start >= size || end < start) {
      response.writeHead(416, { ...headers, "Content-Range": `bytes */${size}` });
      response.end();
      return;
    }

    end = Math.min(end, size - 1);
    response.writeHead(206, {
      ...headers,
      "Content-Length": end - start + 1,
      "Content-Range": `bytes ${start}-${end}/${size}`
    });
    if (request.method === "HEAD") response.end();
    else createReadStream(filePath, { start, end }).pipe(response);
    return;
  }

  response.writeHead(200, { ...headers, "Content-Length": size });
  if (request.method === "HEAD") {
    response.end();
    return;
  }
  createReadStream(filePath).pipe(response);
}).listen(port, () => {
  console.log(`Montana Contracting is running at http://localhost:${port}`);
});
