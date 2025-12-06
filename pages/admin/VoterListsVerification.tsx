import React, { useState, useMemo, useRef } from 'react';
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
        fullName: '',
        aadhaarNumber: '',
        epicNumber: '',
        fatherName: '',
        age: undefined,
        gender: '',
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
                v.fullName?.toLowerCase().includes(search.toLowerCase()) ||
                v.aadhaarNumber?.includes(search) ||
                v.epicNumber?.includes(search);
            const matchesState = filterState ? v.state === filterState : true;
            const matchesDistrict = filterDistrict ? v.district === filterDistrict : true;
            return matchesSearch && matchesState && matchesDistrict;
        });
    }, [officialVoters, search, filterState, filterDistrict]);

    // Robust Data Parser
    const processData = (rawData: any[]): OfficialVoter[] => {
        return rawData.map(row => {
            // Normalize keys to lowercase and trim
            const normalized: any = {};
            Object.keys(row).forEach(key => {
                const cleanKey = key.toLowerCase().trim();
                normalized[cleanKey] = row[key];
            });

            // Map to OfficialVoter schema with fuzzy matching
            const voter: OfficialVoter = {
                id: crypto.randomUUID(),
                fullName: normalized['name'] || normalized['full name'] || normalized['voter name'] || normalized['candidate name'] || '',
                fatherName: normalized['father'] || normalized['father name'] || normalized['relation name'] || normalized['guardian'] || '',
                aadhaarNumber: String(normalized['aadhaar'] || normalized['aadhar'] || normalized['uid'] || normalized['aadhaar no'] || ''),
                epicNumber: String(normalized['epic'] || normalized['epic no'] || normalized['voter id'] || normalized['id card'] || ''),
                age: parseInt(normalized['age']) || undefined,
                gender: normalized['gender'] || normalized['sex'] || '',
                state: normalized['state'] || normalized['address state'] || '',
                district: normalized['district'] || normalized['address district'] || '',
                city: normalized['city'] || normalized['town'] || normalized['village'] || '',
                pollingBooth: normalized['booth'] || normalized['polling booth'] || normalized['station'] || '',
                createdAt: new Date().toISOString()
            };

            // Filter out empty rows (must have at least a name or EPIC)
            if (!voter.fullName && !voter.epicNumber) return null;
            return voter;
        }).filter(Boolean) as OfficialVoter[];
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            if (file.name.toLowerCase().endsWith('.csv')) {
                Papa.parse(file, {
                    header: true,
                    skipEmptyLines: true,
                    complete: async (results) => {
                        const parsedData = processData(results.data);
                        if (parsedData.length > 0) {
                            await addOfficialVoters(parsedData);
                            addNotification('SUCCESS', 'Import Successful', `Imported ${parsedData.length} voters from CSV.`);
                        } else {
                            addNotification('ERROR', 'Import Failed', 'No valid voter data found in CSV.');
                        }
                        setIsUploading(false);
                    },
                    error: (err) => {
                        console.error(err);
                        addNotification('ERROR', 'Import Failed', 'Failed to parse CSV file.');
                        setIsUploading(false);
                    }
                });
            } else if (file.name.toLowerCase().match(/\.(xlsx|xls)$/)) {
                const reader = new FileReader();
                reader.onload = async (evt) => {
                    try {
                        const bstr = evt.target?.result;
                        const wb = XLSX.read(bstr, { type: 'binary' });
                        const wsname = wb.SheetNames[0];
                        const ws = wb.Sheets[wsname];
                        const data = XLSX.utils.sheet_to_json(ws);
                        const parsedData = processData(data);

                        if (parsedData.length > 0) {
                            await addOfficialVoters(parsedData);
                            addNotification('SUCCESS', 'Import Successful', `Imported ${parsedData.length} voters from Excel.`);
                        } else {
                            addNotification('ERROR', 'Import Failed', 'No valid data found in Excel.');
                        }
                    } catch (e) {
                        console.error(e);
                        addNotification('ERROR', 'Import Failed', 'Invalid Excel file.');
                    }
                    setIsUploading(false);
                };
                reader.readAsBinaryString(file);
            } else {
                addNotification('ERROR', 'Invalid File', 'Please upload a CSV or Excel file.');
                setIsUploading(false);
            }
        } catch (error) {
            console.error('Upload error:', error);
            addNotification('ERROR', 'Upload Error', 'An unexpected error occurred during upload.');
            setIsUploading(false);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // Export to CSV
    const handleExport = () => {
        const headers = ['Full Name', 'Aadhaar Number', 'EPIC Number', 'Father Name', 'Age', 'Gender', 'State', 'District', 'City', 'Polling Booth'];
        const rows = filtered.map(v => [
            v.fullName, v.aadhaarNumber, v.epicNumber, v.fatherName,
            v.age?.toString() || '', v.gender, v.state, v.district, v.city, v.pollingBooth
        ].map(c => `"${c || ''}"`).join(','));

        const csv = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `official_voter_list_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Add new row
    const handleAddRow = async () => {
        if (!newRow.fullName && !newRow.aadhaarNumber && !newRow.epicNumber) return;
        await addOfficialVoters([{ ...newRow, id: crypto.randomUUID() } as OfficialVoter]);
        setNewRow({
            fullName: '', aadhaarNumber: '', epicNumber: '', fatherName: '',
            age: undefined, gender: '', state: '', district: '', city: '', pollingBooth: ''
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
        <div className="min-h-screen">
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
                    className="input-standard py-2.5 px-3 min-w-[150px]"
                >
                    <option value="">All States</option>
                    {Object.keys(INDIAN_STATES_DISTRICTS).map(s => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
                <select
                    value={filterDistrict}
                    onChange={e => setFilterDistrict(e.target.value)}
                    disabled={!filterState}
                    className="input-standard py-2.5 px-3 min-w-[150px] disabled:opacity-50"
                >
                    <option value="">All Districts</option>
                    {districtsForFilter.map(d => (
                        <option key={d} value={d}>{d}</option>
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
                            onChange={e => setNewRow({ ...newRow, fullName: e.target.value })}
                            className="input-standard"
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
                            onChange={e => setNewRow({ ...newRow, fatherName: e.target.value })}
                            className="input-standard"
                        />
                        <input
                            type="number"
                            placeholder="Age"
                            value={newRow.age || ''}
                            onChange={e => setNewRow({ ...newRow, age: parseInt(e.target.value) || undefined })}
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
                            onChange={e => setNewRow({ ...newRow, city: e.target.value })}
                            className="input-standard"
                        />
                        <input
                            placeholder="Polling Booth"
                            value={newRow.pollingBooth}
                            onChange={e => setNewRow({ ...newRow, pollingBooth: e.target.value })}
                            className="input-standard"
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
                                                <span className="font-medium text-slate-800 dark:text-white">{voter.fullName}</span>
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
                                        <td className="p-4 text-slate-600 dark:text-slate-400">{voter.fatherName || '-'}</td>
                                        <td className="p-4">
                                            <div className="text-slate-700 dark:text-slate-300">{voter.age || '-'} yrs</div>
                                            <div className="text-xs text-slate-500">{voter.gender || '-'}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-slate-700 dark:text-slate-300 text-sm">{voter.state || '-'}</div>
                                            <div className="text-xs text-slate-500">{voter.district}</div>
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
