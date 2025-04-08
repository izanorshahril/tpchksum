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