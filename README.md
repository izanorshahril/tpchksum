# TP Checksum

This is a web application that allows users to calculate and compare checksums of files within ZIP archives.

## Features

*   **Single File Checksum:**
    *   Upload a single ZIP file.
    *   Calculates the SHA-1 checksum for every file inside the archive, including those within subfolders, using the Web Crypto API.
    *   Download a CSV report (`CheckSumData_<your_zip_file_name>.csv`) containing the folder path (`uploads/...`), filename, and checksum for each file.
*   **Two File Comparison:**
    *   Upload two separate ZIP files.
    *   Compares the contents based on file paths and SHA-1 checksums.
    *   Download a comparison report (`Comparison_<zip1_name>_vs_<zip2_name>.csv`) detailing matches, mismatches, and unique files.

## Technologies Used

*   **Frontend:** Next.js (React), Tailwind CSS
*   **ZIP Handling:** [JSZip](https://stuk.github.io/jszip/)
*   **Checksum Calculation:** Web Crypto API (`crypto.subtle`) (SHA-1)

## Getting Started

First, install the dependencies:

```bash
pnpm install
```

**HTTPS Required for Development:**

The Web Crypto API requires a secure context (HTTPS) to function, even locally. You will need to set up HTTPS for the development server.

1.  **Install `mkcert`:** Follow the instructions for your OS at [https://github.com/FiloSottile/mkcert#installation](https://github.com/FiloSottile/mkcert#installation).
2.  **Create Local CA:** Run `mkcert -install` (may require admin/sudo privileges).
3.  **Generate Certificates:** In the project directory (`c:/Project/Personal/tpchksum`), run `mkcert localhost 127.0.0.1 ::1`. This creates `localhost+2.pem` and `localhost+2-key.pem`.

Then, run the development server (which is configured in `package.json` to use these certificates):

```bash
pnpm dev
```

Open [https://localhost:3000](https://localhost:3000) (note the `https`) with your browser to see the result.

You can start editing the main page by modifying `src/app/page.tsx`. The page auto-updates as you edit the file.

## Learn More About Next.js

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
