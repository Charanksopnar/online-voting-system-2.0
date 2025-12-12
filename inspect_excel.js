
import * as XLSX from 'xlsx';
import { readFileSync } from 'fs';

try {
    const fileBuffer = readFileSync('d:\\evote 2.0\\voter_sample.xlsx');
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert sheet to JSON (header: 1 returns array of arrays)
    const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (json.length > 0) {
        console.log("Headers found:", json[0]);
        console.log("First row data:", json[1]);
    } else {
        console.log("Empty sheet found");
    }
} catch (error) {
    console.error("Error reading file:", error.message);
}
