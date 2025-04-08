'use client';

import { useState } from 'react';
import JSZip from 'jszip';
import CryptoJS from 'crypto-js'; // Re-added crypto-js

interface FileData {
  folderName: string; // Will be like 'uploads/', 'uploads/Cfg/'
  fileName: string;
  checksum: string;
}

interface ComparisonResult {
  folderName: string;
  fileName: string;
  checksum1: string | null;
  checksum2: string | null;
  status: 'MATCH' | 'MISMATCH' | 'ONLY_IN_FILE1' | 'ONLY_IN_FILE2';
}

export default function Home() {
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [fileData1, setFileData1] = useState<FileData[]>([]);
  const [fileData2, setFileData2] = useState<FileData[]>([]);
  const [comparisonResults, setComparisonResults] = useState<ComparisonResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [baseFileName1, setBaseFileName1] = useState<string>('');
  const [baseFileName2, setBaseFileName2] = useState<string>('');
  // Removed isCryptoAvailable state and useEffect

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, fileNumber: 1 | 2) => {
    const file = event.target.files?.[0];
    const setFile = fileNumber === 1 ? setFile1 : setFile2;
    const setFileData = fileNumber === 1 ? setFileData1 : setFileData2;
    const setBaseFileName = fileNumber === 1 ? setBaseFileName1 : setBaseFileName2;

    if (file) {
      setFile(file);
      setFileData([]); // Reset data when a new file is selected
      setComparisonResults([]); // Reset comparison results
      setError(null);
      // Extract base name without extension
      const nameParts = file.name.split('.');
      nameParts.pop(); // Remove the last part (extension)
      setBaseFileName(nameParts.join('.'));
    } else {
      setFile(null);
      setBaseFileName('');
    }
  };

  const processZipFile = async (file: File): Promise<FileData[]> => {
    const zip = new JSZip();
    const data: FileData[] = [];
    try {
      const content = await file.arrayBuffer();
      const loadedZip = await zip.loadAsync(content);

      // Removed crypto check

      const filePromises = Object.keys(loadedZip.files).map(async (relativePath) => {
        const zipEntry = loadedZip.files[relativePath];
        if (!zipEntry.dir) {
          const fileContent = await zipEntry.async('arraybuffer'); // Get content as ArrayBuffer for crypto-js

          // Use crypto-js for SHA-1
          const wordArray = CryptoJS.lib.WordArray.create(fileContent);
          const checksum = CryptoJS.SHA1(wordArray).toString(CryptoJS.enc.Hex);

          // Extract folder and file name, adjust folder format
          const pathParts = relativePath.split('/');
          const fileName = pathParts.pop() || '';
          let folderPath = pathParts.join('/');
          let folderName: string;

          if (folderPath) {
            // Ensure trailing slash for subfolders
            folderName = `uploads/${folderPath}/`;
          } else {
            // Root folder case
            folderName = 'uploads/';
          }

          data.push({ folderName, fileName, checksum });
        }
      });

      await Promise.all(filePromises);
      // Sort data for consistent output (optional but good practice)
      data.sort((a, b) => {
        if (a.folderName !== b.folderName) {
          return a.folderName.localeCompare(b.folderName);
        }
        return a.fileName.localeCompare(b.fileName);
      });

      return data;
    } catch (err) {
      console.error('Error processing zip file:', err);
      throw new Error(`Failed to process ${file.name}. Is it a valid ZIP file?`);
    }
  };

  const handleProcessClick = async () => {
    if (!file1) {
      setError('Please select the first ZIP file.');
      return;
    }
    // Removed crypto check

    setIsLoading(true);
    setError(null);
    setFileData1([]);
    setComparisonResults([]); // Reset comparison results

    try {
      const data = await processZipFile(file1);
      setFileData1(data);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred during processing.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompareClick = async () => {
    if (!file1 || !file2) {
      setError('Please select both ZIP files for comparison.');
      return;
    }
    // Removed crypto check

    setIsComparing(true);
    setError(null);
    setFileData1([]); // Clear previous single file data if any
    setFileData2([]);
    setComparisonResults([]);

    try {
      // Process both files concurrently
      const [data1, data2] = await Promise.all([
        processZipFile(file1),
        processZipFile(file2)
      ]);
      setFileData1(data1); // Store processed data
      setFileData2(data2); // Store processed data

      // Perform comparison
      const results: ComparisonResult[] = [];
      const map1 = new Map<string, FileData>();
      const map2 = new Map<string, FileData>();

      data1.forEach(item => map1.set(`${item.folderName}/${item.fileName}`, item));
      data2.forEach(item => map2.set(`${item.folderName}/${item.fileName}`, item));

      // Check files from file1 against file2
      map1.forEach((item1, key) => {
        const item2 = map2.get(key);
        if (item2) {
          // File exists in both
          results.push({
            folderName: item1.folderName,
            fileName: item1.fileName,
            checksum1: item1.checksum,
            checksum2: item2.checksum,
            status: item1.checksum === item2.checksum ? 'MATCH' : 'MISMATCH',
          });
          map2.delete(key); // Remove matched item from map2
        } else {
          // File only in file1
          results.push({
            folderName: item1.folderName,
            fileName: item1.fileName,
            checksum1: item1.checksum,
            checksum2: null,
            status: 'ONLY_IN_FILE1',
          });
        }
      });

      // Check remaining files in file2 (only in file2)
      map2.forEach((item2, key) => {
        results.push({
          folderName: item2.folderName,
          fileName: item2.fileName,
          checksum1: null,
          checksum2: item2.checksum,
          status: 'ONLY_IN_FILE2',
        });
      });

       // Sort results for consistent output
       results.sort((a, b) => {
        const keyA = `${a.folderName}/${a.fileName}`;
        const keyB = `${b.folderName}/${b.fileName}`;
        return keyA.localeCompare(keyB);
      });


      setComparisonResults(results);

    } catch (err: any) {
      setError(err.message || 'An unknown error occurred during comparison.');
    } finally {
      setIsComparing(false);
    }
  };

  const generateCsvContent = (data: FileData[]): string => {
    let csvContent = "FolderName,FileName,Checksum\n"; // Header
    data.forEach(fileData => {
      // Handle potential commas in folder/file names by quoting
      const folder = fileData.folderName.includes(',') ? `"${fileData.folderName}"` : fileData.folderName;
      const file = fileData.fileName.includes(',') ? `"${fileData.fileName}"` : fileData.fileName;
      csvContent += `${folder},${file},${fileData.checksum}\n`;
    });
    return csvContent;
  };

  const generateComparisonCsvContent = (data: ComparisonResult[]): string => {
    let csvContent = "FolderName,FileName,Checksum1,Checksum2,Status\n"; // Header
    data.forEach(item => {
      const folder = item.folderName.includes(',') ? `"${item.folderName}"` : item.folderName;
      const file = item.fileName.includes(',') ? `"${item.fileName}"` : item.fileName;
      csvContent += `${folder},${file},${item.checksum1 ?? ''},${item.checksum2 ?? ''},${item.status}\n`;
    });
    return csvContent;
  };


  const handleDownloadClick = (type: 'single' | 'comparison') => {
    setError(null); // Clear previous errors

    if (type === 'single') {
      if (fileData1.length === 0 || !baseFileName1) {
        setError('No checksum data available for the first file or it has not been processed.');
        return;
      }
      const csvContent = generateCsvContent(fileData1);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `CheckSumData_${baseFileName1}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (type === 'comparison') {
       if (comparisonResults.length === 0 || !baseFileName1 || !baseFileName2) {
        setError('No comparison data available or files not processed.');
        return;
      }
      const csvContent = generateComparisonCsvContent(comparisonResults);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `Comparison_${baseFileName1}_vs_${baseFileName2}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-12 bg-gray-50">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">TP Checksum</h1>

      {/* Single File Section */}
      <div className="w-full max-w-xl bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Single File Checksum</h2>
        <div className="mb-4">
          <label htmlFor="fileInput1" className="block text-sm font-medium text-gray-700 mb-1">
            Upload ZIP File 1:
          </label>
          <input
            id="fileInput1"
            type="file"
            accept=".zip"
            onChange={(e) => handleFileChange(e, 1)}
            // Removed disabled attribute related to crypto
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        <button
          onClick={handleProcessClick}
          disabled={isLoading || !file1} // Removed crypto check from disabled
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out mb-4"
        >
          {isLoading ? 'Processing...' : 'Generate Checksum Report'}
        </button>

        {fileData1.length > 0 && !isLoading && !isComparing && (
          <div className="mt-4">
            <p className="text-green-600 text-sm mb-2">Checksums generated successfully for {fileData1.length} files in {file1?.name}.</p>
            <button
              onClick={() => handleDownloadClick('single')}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition duration-150 ease-in-out"
            >
              Download Checksum Report
            </button>
          </div>
        )}
      </div>


      {/* Comparison Section */}
      <div className="w-full max-w-xl bg-white p-6 rounded-lg shadow-md">
         <h2 className="text-xl font-semibold mb-4 text-gray-700">Compare Two ZIP Files</h2>
         <div className="mb-4">
           <label htmlFor="fileInputComp1" className="block text-sm font-medium text-gray-700 mb-1">
             Upload ZIP File 1 (for comparison):
           </label>
           <input
             id="fileInputComp1"
             type="file"
            accept=".zip"
            onChange={(e) => handleFileChange(e, 1)} // Reuses the same handler
            // Removed disabled attribute related to crypto
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
           {file1 && <span className="text-xs text-gray-500 mt-1 block">Selected: {file1.name}</span>}
         </div>

         <div className="mb-4">
           <label htmlFor="fileInputComp2" className="block text-sm font-medium text-gray-700 mb-1">
             Upload ZIP File 2 (for comparison):
           </label>
           <input
             id="fileInputComp2"
             type="file"
            accept=".zip"
            onChange={(e) => handleFileChange(e, 2)}
             // Removed disabled attribute related to crypto
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
          />
            {file2 && <span className="text-xs text-gray-500 mt-1 block">Selected: {file2.name}</span>}
         </div>

        <button
          onClick={handleCompareClick}
          disabled={isComparing || !file1 || !file2} // Removed crypto check from disabled
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
        >
          {isComparing ? 'Comparing...' : 'Compare Files'}
        </button>

        {comparisonResults.length > 0 && !isComparing && (
          <div className="mt-6">
            <p className="text-green-600 text-sm mb-2">Comparison complete. Found {comparisonResults.length} differences/matches.</p>
            <button
              onClick={() => handleDownloadClick('comparison')}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded transition duration-150 ease-in-out"
            >
              Download Comparison Report (.csv)
            </button>
          </div>
        )}

      </div>


      {error && (
        <p className="mt-6 text-red-600 text-sm text-center w-full max-w-xl">Error: {error}</p>
      )}

    </main>
  );
}