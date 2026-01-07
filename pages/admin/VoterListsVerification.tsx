import React, { useState, useMemo, useRef, useEffect } from 'react';
import { INDIAN_STATES_DISTRICTS } from '../../data/indianStatesDistricts';
import { useRealtime } from '../../contexts/RealtimeContext';
import { useNotification } from '../../contexts/NotificationContext';
import { OfficialVoter } from '../../types';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import {
    Upload, Download, Plus, Save, Trash2, Search, FileSpreadsheet,
    CheckCircle, AlertTriangle, X, Edit2, Check
} from 'lucide-react';

export const VoterListsVerification = () => {
    const { officialVoters, addOfficialVoters, deleteOfficialVoter, updateOfficialVoter, voters, crossVerifyElectoralRoll } = useRealtime();
    const { addNotification } = useNotification();

    const [search, setSearch] = useState('');
    const [filterState, setFilterState] = useState('');
    const [filterDistrict, setFilterDistrict] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [showAddRow, setShowAddRow] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editData, setEditData] = useState<Partial<OfficialVoter>>({});
    const fileInputRef = useRef<HTMLInputElement>(null);

    // New row form state
    const [newRow, setNewRow] = useState<Partial<OfficialVoter>>({
        firstName: '',
        lastName: '',
        aadhaarNumber: '',
        epicNumber: '',
        fatherName: '',
        dob: '',
        age: undefined,
        gender: '',
        fullAddress: '',
        state: '',
        district: '',
        city: '',
        pollingBooth: ''
    });

    const districtsForFilter = useMemo(() => {
        return filterState ? INDIAN_STATES_DISTRICTS[filterState] || [] : [];
    }, [filterState]);

    const filtered = useMemo(() => {
        return officialVoters.filter(v => {
            const matchesSearch =
                v.firstName?.toLowerCase().includes(search.toLowerCase()) ||
                v.aadhaarNumber?.includes(search) ||
                v.epicNumber?.includes(search);
            const matchesState = filterState ? v.state === filterState : true;
            const matchesDistrict = filterDistrict ? v.district === filterDistrict : true;
            return matchesSearch && matchesState && matchesDistrict;
        });
    }, [officialVoters, search, filterState, filterDistrict]);

    // Debug: Log data on mount and when it changes
    useEffect(() => {
        console.log('🔍 VoterListsVerification - Data Check:');
        console.log('  Total officialVoters:', officialVoters.length);
        console.log('  Filtered voters:', filtered.length);
        console.log('  Search term:', search);
        console.log('  Filter state:', filterState);
        console.log('  Filter district:', filterDistrict);
        if (officialVoters.length > 0) {
            console.log('  Sample voter data:', officialVoters[0]);
        }
    }, [officialVoters, filtered, search, filterState, filterDistrict]);

    // Robust Data Parser
    const processData = (rawData: any[]): OfficialVoter[] => {
        console.log('Raw Data Preview:', rawData.slice(0, 2)); // Debug log

        // Keys we expect to find (for user feedback)
        const foundKeys: Set<string> = new Set();
        const requiredFields = ['name', 'aadhaar', 'epic'];

        const validVoters = rawData.map(row => {
            // Normalize keys to lowercase, remove BOM, collapse spaces
            const normalized: any = {};

            Object.keys(row).forEach(key => {
                const cleanKey = key
                    .replace(/^\uFEFF/, '') // Remove BOM
                    .toLowerCase()
                    .replace(/[_\-]/g, ' ') // Replace underscores/dashes with space
                    .replace(/\s+/g, ' ') // Collapse multiple spaces
                    .trim();

                if (cleanKey) {
                    normalized[cleanKey] = row[key];
                    foundKeys.add(cleanKey);
                }
            });

            // Inline UUID generator fallback
            const uuid = () => {
                if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
            };

            // Normalize DOB format (accept DD-MM-YYYY or YYYY-MM-DD, convert to YYYY-MM-DD)
            // Also handle Excel serial date numbers
            const normalizeDOB = (dob: any): string => {
                if (!dob) return '';

                // Handle Excel serial date numbers (e.g., 38237, 34762)
                if (typeof dob === 'number' || (!isNaN(Number(dob)) && Number(dob) > 1000)) {
                    const excelEpoch = new Date(1899, 11, 30);
                    const days = Number(dob);
                    const date = new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);

                    if (!isNaN(date.getTime())) {
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        return `${year}-${month}-${day}`;
                    }
                }

                const dobStr = String(dob).trim();

                // Check if format is DD-MM-YYYY (e.g., 15-05-1988)
                const ddmmyyyyMatch = dobStr.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
                if (ddmmyyyyMatch) {
                    const [, day, month, year] = ddmmyyyyMatch;
                    return `${year}-${month}-${day}`; // Convert to YYYY-MM-DD
                }

                // Check if format is YYYY-MM-DD (e.g., 1988-05-15)
                const yyyymmddMatch = dobStr.match(/^(\d{4})[\/\-](\d{2})[\/\-](\d{2})$/);
                if (yyyymmddMatch) {
                    return dobStr; // Already in correct format
                }

                // Return as-is if no pattern matches (will be logged)
                console.warn('⚠️ Unrecognized DOB format:', dobStr);
                return dobStr;
            };

            // Map to OfficialVoter schema with expanded fuzzy matching
            const firstName = normalized['first name'] || normalized['name'] || normalized['full name'] || normalized['voter name'] || normalized['candidate name'] || normalized['fullname'] || normalized['student name'] || '';
            const lastName = normalized['last name'] || normalized['surname'] || normalized['family name'] || '';

            const voter: OfficialVoter = {
                id: uuid(),
                // Map first 'first name' column to firstName
                firstName: firstName,
                // Map second name column (might be labeled as 'first name' again or 'last name')
                lastName: lastName,
                // Compute fullName from firstName and lastName
                fullName: firstName && lastName ? `${firstName} ${lastName}`.trim() : firstName || '',
                // Map 'father name' variations
                fatherName: normalized['father name'] || normalized['father'] || normalized['fathers name'] || normalized['relation name'] || normalized['guardian'] || normalized['fathername'] || normalized['parent'] || '',
                // Map 'aadhar number' or 'aadhaar' variations
                aadhaarNumber: normalized['aadhar number'] || normalized['aadhaar number'] || normalized['aadhaar'] || normalized['aadhar'] || normalized['uid'] || normalized['aadhaar no'] || normalized['adhaarnumber'] || normalized['uid no'] || '',
                // Map 'voter number' or 'epic' variations - ensure we capture 'epic' column
                epicNumber: normalized['epic'] || normalized['voter number'] || normalized['voter number(e'] || normalized['epic no'] || normalized['epic number'] || normalized['voter id'] || normalized['voterid'] || normalized['id card'] || normalized['epicnumber'] || normalized['voter id no'] || normalized['elector photo identity card'] || '',
                // Map 'dob(dob)' or 'dob' variations
                dob: normalizeDOB(normalized['dob(dob)'] || normalized['dob'] || normalized['date of birth'] || normalized['birth date'] || normalized['birthdate'] || ''),
                // Calculate age from DOB if available, otherwise use provided age
                age: (() => {
                    const dobValue = normalizeDOB(normalized['dob(dob)'] || normalized['dob'] || normalized['date of birth'] || normalized['birth date'] || normalized['birthdate'] || '');
                    if (dobValue) {
                        const birthDate = new Date(dobValue);
                        const today = new Date();
                        let calculatedAge = today.getFullYear() - birthDate.getFullYear();
                        const monthDiff = today.getMonth() - birthDate.getMonth();
                        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                            calculatedAge--;
                        }
                        return calculatedAge > 0 ? calculatedAge : undefined;
                    }
                    return parseInt(normalized['age']) || undefined;
                })(),
                gender: normalized['gender'] || normalized['sex'] || '',
                // Map 'state' (uppercase or lowercase)
                state: normalized['state'] || normalized['address state'] || '',
                // Map 'district' (uppercase or lowercase)
                district: normalized['district'] || normalized['address district'] || '',
                // Map 'city' (uppercase or lowercase)
                city: normalized['city'] || normalized['town'] || normalized['village'] || normalized['address city'] || '',
                pollingBooth: normalized['booth'] || normalized['polling booth'] || normalized['station'] || normalized['pollingbooth'] || normalized['polling station'] || '',
                fullAddress: normalized['address'] || normalized['full address'] || normalized['residence'] || normalized['location'] || '',
                createdAt: new Date().toISOString()
            };


            // Log first row for debugging
            if (rawData.indexOf(row) === 0) {
                console.log('📋 First row normalized keys:', Object.keys(normalized));
                console.log('📋 First row mapped voter:', {
                    firstName: voter.firstName,
                    lastName: voter.lastName,
                    fullName: voter.fullName,
                    aadhaarNumber: voter.aadhaarNumber,
                    epicNumber: voter.epicNumber,
                    fatherName: voter.fatherName,
                    state: voter.state,
                    district: voter.district,
                    city: voter.city
                });
                console.log('🔍 EPIC field debugging:', {
                    'normalized.epic': normalized['epic'],
                    'normalized.voter number': normalized['voter number'],
                    'normalized.epic no': normalized['epic no'],
                    'final epicNumber': voter.epicNumber
                });
                console.log('🔍 DOB field debugging:', {
                    'raw dob value': normalized['dob'],
                    'raw dob type': typeof normalized['dob'],
                    'normalized dob': voter.dob
                });
                console.log('🔍 All normalized fields:', normalized);
            }

            // STRICT FILTER: Must have at least a Name AND (Aadhaar OR EPIC)
            // Loose filter previously allowed just one, but strict verification needs strong ID
            if (!voter.firstName) {
                console.log('⚠️ Skipping row - no name found. Row data:', Object.keys(normalized).slice(0, 5));
                return null;
            }
            if (!voter.aadhaarNumber && !voter.epicNumber) {
                console.log('⚠️ Skipping row - no Aadhaar or EPIC found. Row data:', Object.keys(normalized).slice(0, 5));
                return null;
            }

            return voter;
        }).filter(Boolean) as OfficialVoter[];

        console.log('Found Column Headers:', Array.from(foundKeys)); // Debug info for user

        // If no data found, check if we are missing critical columns
        if (validVoters.length === 0 && rawData.length > 0) {
            console.warn('No valid voters parsed. Checking for missing required columns...');
            // We can't easily notify from here without passing setNotification, so we log it.
            // The calling function will handle the 0 length warning.
        }

        return validVoters;
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        console.log('Uploading file:', file.name, file.type, file.size);

        try {
            if (file.name.toLowerCase().endsWith('.csv')) {
                Papa.parse(file, {
                    header: true,
                    skipEmptyLines: true,
                    encoding: "UTF-8", // Ensure UTF-8 parsing
                    transformHeader: (header) => {
                        // Strip BOM and whitespace from headers immediately
                        return header.replace(/^\uFEFF/, '').trim().toLowerCase();
                    },
                    complete: async (results) => {
                        try {
                            console.log('📊 CSV Parse Complete');
                            console.log('Total rows parsed:', results.data.length);
                            console.log('Parse errors:', results.errors.length);

                            if (results.errors && results.errors.length > 0) {
                                console.warn('⚠️ CSV Parse Errors:', results.errors);
                            }

                            console.log('🔍 Sample raw data (first 2 rows):', results.data.slice(0, 2));

                            const parsedData = processData(results.data);
                            console.log('✅ Processed Data Count:', parsedData.length);
                            console.log(' Sample processed data:', parsedData.slice(0, 2));
                            console.log(' Sending to database...');

                            if (parsedData.length > 0) {
                                await addOfficialVoters(parsedData);
                                addNotification('SUCCESS', 'Import Successful', `Imported ${parsedData.length} voters from CSV.`);
                                console.log('✅ Database insert completed');
                            } else {
                                console.error('No valid data extracted from CSV');
                                console.log('Tip: Check if column headers match expected patterns (name, aadhaar, epic, etc.)');
                                addNotification('ERROR', 'Import Failed', 'No valid voter data found in CSV. Please check column headers match: Name, Aadhaar, EPIC, etc.');
                            }
                        } catch (innerError: any) {
                            console.error('Error processing CSV data:', innerError);
                            addNotification('ERROR', 'Processing Error', `Failed to process CSV data: ${innerError.message}`);
                        } finally {
                            setIsUploading(false);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                        }
                    },
                    error: (err) => {
                        console.error('Papa Parse Error:', err);
                        addNotification('ERROR', 'Import Failed', `Failed to parse CSV file: ${err.message}`);
                        setIsUploading(false);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                    }
                });
            } else if (file.name.toLowerCase().match(/\.(xlsx|xls)$/)) {
                const reader = new FileReader();
                reader.onload = async (evt) => {
                    try {
                        console.log('📊 Excel Processing Started');
                        const bstr = evt.target?.result;
                        const wb = XLSX.read(bstr, { type: 'binary' });
                        const wsname = wb.SheetNames[0];
                        const ws = wb.Sheets[wsname];
                        console.log('📄 Reading sheet:', wsname);

                        // Smart header detection: Read as array of arrays first
                        const rawMatrix = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
                        console.log('Total rows in Excel:', rawMatrix.length);

                        let headerRowIndex = 0;
                        let foundHeader = false;

                        // Look for a row that looks like a header (contains 'name', 'aadhaar', 'epic', or 's.no')
                        for (let i = 0; i < Math.min(20, rawMatrix.length); i++) {
                            const row = rawMatrix[i];
                            if (!row || !Array.isArray(row)) continue;

                            const rowStr = row.join(' ').toLowerCase();
                            if (rowStr.includes('name') || rowStr.includes('epic') || rowStr.includes('aadhaar')) {
                                headerRowIndex = i;
                                foundHeader = true;
                                console.log(`🎯 Header row detected at index ${i}:`, row);
                                break;
                            }
                        }

                        if (!foundHeader) {
                            console.warn('⚠️ No header row detected, using first row');
                        }

                        // Re-parse with the correct range
                        const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
                        range.s.r = headerRowIndex; // Move start row to detected header
                        const newRange = XLSX.utils.encode_range(range);
                        const data = XLSX.utils.sheet_to_json(ws, { range: newRange });

                        console.log('🔍 Sample raw Excel data (first 2 rows):', data.slice(0, 2));
                        console.log('Total data rows:', data.length);

                        const parsedData = processData(data);
                        console.log('✅ Processed Data Count:', parsedData.length);
                        console.log('Sample processed data:', parsedData.slice(0, 2));
                        console.log('Sending to database...');

                        if (parsedData.length > 0) {
                            await addOfficialVoters(parsedData);
                            addNotification('SUCCESS', 'Import Successful', `Imported ${parsedData.length} voters from Excel.`);
                            console.log('✅ Database insert completed');
                        } else {
                            console.error('No valid data extracted from Excel');
                            console.log('💡 Tip: Check if column headers match expected patterns (name, aadhaar, epic, etc.)');
                            addNotification('ERROR', 'Import Failed', 'No valid data found in Excel. Check column headers match: Name, Aadhaar, EPIC, etc.');
                        }
                    } catch (e: any) {
                        console.error('Excel processing error:', e);
                        addNotification('ERROR', 'Import Failed', `Invalid Excel file: ${e.message}`);
                    } finally {
                        setIsUploading(false);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                    }
                };
                reader.onerror = (e) => {
                    console.error('FileReader error:', e);
                    addNotification('ERROR', 'Read Failed', 'Failed to read file.');
                    setIsUploading(false);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                };
                reader.readAsBinaryString(file);
            } else {
                addNotification('ERROR', 'Invalid File', 'Please upload a CSV or Excel file.');
                setIsUploading(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        } catch (error: any) {
            console.error('Upload error:', error);
            addNotification('ERROR', 'Upload Error', `An unexpected error occurred: ${error.message}`);
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // Export to CSV
    const handleExport = () => {
        console.log('🔽 Export CSV initiated');
        console.log('  Total official voters in state:', officialVoters.length);
        console.log('  Filtered voters to export:', filtered.length);
        console.log('  Active filters:', { search, filterState, filterDistrict });

        // Check if there's any data at all
        if (officialVoters.length === 0) {
            console.warn('⚠️ No official voter data loaded from database');
            addNotification('WARNING', 'No Data Available',
                'No voter records found in the database. Please upload a CSV/Excel file first using the "Upload CSV/Excel" button above.');
            return;
        }

        // Check if filters are hiding all data
        if (filtered.length === 0) {
            console.warn('⚠️ All data filtered out');
            addNotification('WARNING', 'No Matching Records',
                `You have ${officialVoters.length} total records, but your current filters (search: "${search}", state: "${filterState}", district: "${filterDistrict}") are hiding all of them. Clear your filters or export all data instead.`);

            // Offer to export all data anyway
            if (confirm(`No records match your current filters, but you have ${officialVoters.length} total records. Would you like to export ALL records instead?`)) {
                exportData(officialVoters);
            }
            return;
        }

        exportData(filtered);
    };

    // Actual export logic extracted to a separate function
    const exportData = (dataToExport: OfficialVoter[]) => {
        console.log('📊 Exporting', dataToExport.length, 'records...');
        console.log('  Sample data being exported (first 2 rows):', dataToExport.slice(0, 2));

        try {
            const headers = ['First Name', 'Last Name', 'Full Name', 'Father Name', 'Aadhaar Number', 'EPIC Number', 'DOB', 'Age', 'Gender', 'State', 'District', 'City', 'Full Address', 'Polling Booth'];
            const rows = dataToExport.map(v => [
                v.firstName || '',
                v.lastName || '',
                v.fullName || '',
                v.fatherName || '',
                v.aadhaarNumber || '',
                v.epicNumber || '',
                v.dob || '',
                v.age?.toString() || '',
                v.gender || '',
                v.state || '',
                v.district || '',
                v.city || '',
                v.fullAddress || '',
                v.pollingBooth || ''
            ].map(c => `"${String(c).replace(/"/g, '""')}"`).join(','));

            const csv = [headers.join(','), ...rows].join('\n');
            console.log('  CSV size:', csv.length, 'characters');
            console.log('  CSV preview (first 300 chars):', csv.substring(0, 300));

            // Create and download the file
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `official_voter_list_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();

            // Cleanup
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);

            console.log('✅ CSV download triggered successfully');
            addNotification('SUCCESS', 'Export Complete', `Successfully exported ${dataToExport.length} voter records to CSV.`);
        } catch (error: any) {
            console.error('❌ Export error:', error);
            addNotification('ERROR', 'Export Failed', `Failed to export CSV: ${error.message}`);
        }
    };

    // Add new row
    const handleAddRow = async () => {
        if (!newRow.fullName && !newRow.aadhaarNumber && !newRow.epicNumber) return;

        // inline UUID generator
        const uuid = () => {
            if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        };

        await addOfficialVoters([{ ...newRow, id: uuid() } as OfficialVoter]);
        setNewRow({
            fullName: '', aadhaarNumber: '', epicNumber: '', fatherName: '',
            dob: '', age: undefined, gender: '', fullAddress: '', state: '', district: '', city: '', pollingBooth: ''
        });
        setShowAddRow(false);
    };

    // Edit row
    const startEdit = (voter: OfficialVoter) => {
        setEditingId(voter.id);
        setEditData({ ...voter });
    };

    const saveEdit = async () => {
        if (editingId && editData) {
            await updateOfficialVoter({ ...editData, id: editingId } as OfficialVoter);
            setEditingId(null);
            setEditData({});
        }
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditData({});
    };

    // Cross-verify a registered user
    const handleCrossVerify = async (officialVoter: OfficialVoter) => {
        // Find matching registered user by Aadhaar or EPIC
        const matchingUser = voters.find(u =>
            (officialVoter.aadhaarNumber && u.aadhaarNumber === officialVoter.aadhaarNumber) ||
            (officialVoter.epicNumber && u.epicNumber === officialVoter.epicNumber)
        );

        if (matchingUser) {
            await crossVerifyElectoralRoll(matchingUser.id, officialVoter.id);
        }
    };

    // Check if official voter matches any registered user
    const getMatchingUser = (officialVoter: OfficialVoter) => {
        return voters.find(u =>
            (officialVoter.aadhaarNumber && u.aadhaarNumber === officialVoter.aadhaarNumber) ||
            (officialVoter.epicNumber && u.epicNumber === officialVoter.epicNumber)
        );
    };

    return (
        <div className="min-h-screen transition-colors duration-200 bg-slate-50 dark:bg-slate-900 p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white uppercase tracking-wide flex items-center gap-3">
                        <FileSpreadsheet className="text-primary-600" size={28} />
                        Official Voter Lists Verification
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Upload government electoral roll data to cross-verify registered users</p>
                </div>
                <div className="flex gap-3">
                    {/* Upload Button */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept=".csv,.xlsx,.xls"
                        onChange={handleFileUpload}
                        className="hidden"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="px-4 py-2.5 bg-primary-600 text-white rounded-lg font-bold flex items-center gap-2 hover:bg-primary-700 transition shadow-lg shadow-primary-500/20 disabled:opacity-50"
                    >
                        <Upload size={18} />
                        {isUploading ? 'Uploading...' : 'Upload CSV/Excel'}
                    </button>

                    {/* Add Row Button */}
                    <button
                        onClick={() => setShowAddRow(!showAddRow)}
                        className="px-4 py-2.5 bg-green-600 text-white rounded-lg font-bold flex items-center gap-2 hover:bg-green-700 transition"
                    >
                        <Plus size={18} />
                        Add Row
                    </button>

                    {/* Export Button */}
                    <button
                        onClick={handleExport}
                        className="px-4 py-2.5 bg-slate-700 text-white rounded-lg font-bold flex items-center gap-2 hover:bg-slate-800 transition"
                    >
                        <Download size={18} />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 mb-6 border border-slate-200 dark:border-slate-700 flex flex-wrap gap-4">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        type="text"
                        placeholder="Search by name, Aadhaar, EPIC..."
                        className="input-standard pl-10 w-full"
                    />
                </div>
                <select
                    value={filterState}
                    onChange={e => { setFilterState(e.target.value); setFilterDistrict(''); }}
                    className="input-standard py-2.5 px-3 min-w-[150px] bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                >
                    <option value="" className="dark:bg-slate-800">All States</option>
                    {Object.keys(INDIAN_STATES_DISTRICTS).map(s => (
                        <option key={s} value={s} className="dark:bg-slate-800">{s}</option>
                    ))}
                </select>
                <select
                    value={filterDistrict}
                    onChange={e => setFilterDistrict(e.target.value)}
                    disabled={!filterState}
                    className="input-standard py-2.5 px-3 min-w-[150px] disabled:opacity-50 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                >
                    <option value="" className="dark:bg-slate-800">All Districts</option>
                    {districtsForFilter.map(d => (
                        <option key={d} value={d} className="dark:bg-slate-800">{d}</option>
                    ))}
                </select>
            </div>

            {/* Add Row Form */}
            {showAddRow && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 mb-6 border border-green-200 dark:border-green-800">
                    <h3 className="font-bold text-green-800 dark:text-green-300 mb-4 flex items-center gap-2">
                        <Plus size={18} /> Add New Official Voter Entry
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        <input
                            placeholder="Full Name *"
                            value={newRow.fullName}
                            onChange={e => setNewRow({ ...newRow, fullName: e.target.value.replace(/\b\w/g, c => c.toUpperCase()) })}
                            className="input-standard capitalize"
                        />
                        <input
                            placeholder="Aadhaar Number"
                            value={newRow.aadhaarNumber}
                            onChange={e => setNewRow({ ...newRow, aadhaarNumber: e.target.value })}
                            className="input-standard"
                        />
                        <input
                            placeholder="EPIC Number"
                            value={newRow.epicNumber}
                            onChange={e => setNewRow({ ...newRow, epicNumber: e.target.value })}
                            className="input-standard"
                        />
                        <input
                            placeholder="Father's Name"
                            value={newRow.fatherName}
                            onChange={e => setNewRow({ ...newRow, fatherName: e.target.value.replace(/\b\w/g, c => c.toUpperCase()) })}
                            className="input-standard capitalize"
                        />
                        <input
                            type="number"
                            placeholder="Age"
                            value={newRow.age || ''}
                            onChange={e => setNewRow({ ...newRow, age: parseInt(e.target.value) || undefined })}
                            className="input-standard w-20"
                        />
                        <input
                            type="text"
                            placeholder="DOB (YYYY-MM-DD)"
                            value={newRow.dob || ''}
                            onChange={e => setNewRow({ ...newRow, dob: e.target.value })}
                            className="input-standard"
                        />
                        <select
                            value={newRow.gender}
                            onChange={e => setNewRow({ ...newRow, gender: e.target.value })}
                            className="input-standard"
                        >
                            <option value="">Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                        <select
                            value={newRow.state}
                            onChange={e => setNewRow({ ...newRow, state: e.target.value, district: '' })}
                            className="input-standard"
                        >
                            <option value="">State</option>
                            {Object.keys(INDIAN_STATES_DISTRICTS).map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                        <select
                            value={newRow.district}
                            onChange={e => setNewRow({ ...newRow, district: e.target.value })}
                            disabled={!newRow.state}
                            className="input-standard disabled:opacity-50"
                        >
                            <option value="">District</option>
                            {(INDIAN_STATES_DISTRICTS[newRow.state || ''] || []).map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                        <input
                            placeholder="City/Town"
                            value={newRow.city}
                            onChange={e => setNewRow({ ...newRow, city: e.target.value.replace(/\b\w/g, c => c.toUpperCase()) })}
                            className="input-standard capitalize"
                        />
                        <input
                            placeholder="Full Address"
                            value={newRow.fullAddress || ''}
                            onChange={e => setNewRow({ ...newRow, fullAddress: e.target.value })}
                            className="input-standard col-span-2 capitalize"
                        />
                        <input
                            placeholder="Polling Booth"
                            value={newRow.pollingBooth}
                            onChange={e => setNewRow({ ...newRow, pollingBooth: e.target.value.replace(/\b\w/g, c => c.toUpperCase()) })}
                            className="input-standard capitalize"
                        />
                    </div>
                    <div className="flex gap-3 mt-4">
                        <button
                            onClick={handleAddRow}
                            className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold flex items-center gap-2 hover:bg-green-700 transition"
                        >
                            <Save size={16} /> Save Entry
                        </button>
                        <button
                            onClick={() => setShowAddRow(false)}
                            className="px-6 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Data Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-300 text-xs uppercase font-bold border-b border-slate-200 dark:border-slate-700">
                                <th className="p-4">Name</th>
                                <th className="p-4">Aadhaar</th>
                                <th className="p-4">EPIC</th>
                                <th className="p-4">Father</th>
                                <th className="p-4">Age/Gender</th>
                                <th className="p-4">Location</th>
                                <th className="p-4">Booth</th>
                                <th className="p-4">Match Status</th>
                                <th className="p-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-sm">
                            {filtered.map(voter => {
                                const matchingUser = getMatchingUser(voter);
                                const isEditing = editingId === voter.id;

                                return (
                                    <tr key={voter.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                                        <td className="p-4">
                                            {isEditing ? (
                                                <input
                                                    value={editData.fullName || ''}
                                                    onChange={e => setEditData({ ...editData, fullName: e.target.value })}
                                                    className="input-standard text-sm py-1 px-2"
                                                />
                                            ) : (
                                                <span className="font-medium text-slate-800 dark:text-white capitalize">{voter.fullName}</span>
                                            )}
                                        </td>
                                        <td className="p-4 font-mono text-xs">
                                            {isEditing ? (
                                                <input
                                                    value={editData.aadhaarNumber || ''}
                                                    onChange={e => setEditData({ ...editData, aadhaarNumber: e.target.value })}
                                                    className="input-standard text-sm py-1 px-2 w-32"
                                                />
                                            ) : (
                                                <span className="bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded">{voter.aadhaarNumber || '-'}</span>
                                            )}
                                        </td>
                                        <td className="p-4 font-mono text-xs">
                                            {isEditing ? (
                                                <input
                                                    value={editData.epicNumber || ''}
                                                    onChange={e => setEditData({ ...editData, epicNumber: e.target.value })}
                                                    className="input-standard text-sm py-1 px-2 w-24"
                                                />
                                            ) : (
                                                <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">{voter.epicNumber || '-'}</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-slate-600 dark:text-slate-400 capitalize">{voter.fatherName || '-'}</td>
                                        <td className="p-4">
                                            <div className="text-slate-700 dark:text-slate-300">
                                                {voter.age ? `${voter.age} yrs` : ''}
                                                {voter.dob && <span className="text-xs text-slate-500 block">{voter.dob}</span>}
                                            </div>
                                            <div className="text-xs text-slate-500">{voter.gender || '-'}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-slate-700 dark:text-slate-300 text-sm capitalize">{voter.state || '-'}</div>
                                            <div className="text-xs text-slate-500 capitalize">{voter.district}</div>
                                            {voter.fullAddress && <div className="text-xs text-slate-400 mt-1 truncate max-w-[150px] capitalize" title={voter.fullAddress}>{voter.fullAddress}</div>}
                                        </td>
                                        <td className="p-4 text-xs text-slate-600 dark:text-slate-400">{voter.pollingBooth || '-'}</td>
                                        <td className="p-4">
                                            {matchingUser ? (
                                                matchingUser.electoralRollVerified ? (
                                                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-bold flex items-center gap-1 w-fit">
                                                        <CheckCircle size={12} /> Verified
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={() => handleCrossVerify(voter)}
                                                        className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-xs font-bold flex items-center gap-1 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition"
                                                    >
                                                        <AlertTriangle size={12} /> Verify Now
                                                    </button>
                                                )
                                            ) : (
                                                <span className="text-xs text-slate-400 italic">No match</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex justify-center gap-2">
                                                {isEditing ? (
                                                    <>
                                                        <button onClick={saveEdit} className="p-2 rounded-lg bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50 transition">
                                                            <Check size={16} />
                                                        </button>
                                                        <button onClick={cancelEdit} className="p-2 rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition">
                                                            <X size={16} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button onClick={() => startEdit(voter)} className="p-2 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition">
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button onClick={() => deleteOfficialVoter(voter.id)} className="p-2 rounded-lg bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={9} className="p-12 text-center text-slate-500">
                                        <FileSpreadsheet size={48} className="mx-auto mb-4 text-slate-300" />
                                        <p className="font-medium">No official voter records found</p>
                                        <p className="text-sm mt-1">Upload a CSV/Excel file or add entries manually</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 flex justify-between items-center text-xs text-slate-500 font-bold border-t border-slate-200 dark:border-slate-700">
                    <span>Total Records: {filtered.length}</span>
                    <span>Matched Users: {filtered.filter(v => getMatchingUser(v)).length}</span>
                </div>
            </div>
        </div>
    );
};
