import React from 'react';
import { useRealtime } from '../../contexts/RealtimeContext';
import { AlertTriangle, ShieldAlert } from 'lucide-react';

export const InvalidVotes = () => {
    const { votes, fraudAlerts, voters } = useRealtime();

    // Mocking identification of high risk votes (riskScore > 0.7)
    const suspiciousVotes = votes.filter(v => (v.riskScore || 0) > 0.7);

    return (
        <div className="p-6 bg-gray-50 dark:bg-slate-900 min-h-screen transition-colors duration-200">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Fraud Detection & Invalid Votes</h1>
                <p className="text-gray-500 dark:text-gray-400">Monitor suspicious activities and AI flags.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 p-6 rounded-xl flex items-center gap-4">
                    <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-full text-red-600 dark:text-red-400"><AlertTriangle /></div>
                    <div>
                        <h3 className="text-lg font-bold text-red-800 dark:text-red-300">{fraudAlerts.length} High Risk Alerts</h3>
                        <p className="text-red-600 dark:text-red-400 text-sm">Requires immediate attention</p>
                    </div>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-900/50 p-6 rounded-xl flex items-center gap-4">
                    <div className="p-3 bg-orange-100 dark:bg-orange-900/50 rounded-full text-orange-600 dark:text-orange-400"><ShieldAlert /></div>
                    <div>
                        <h3 className="text-lg font-bold text-orange-800 dark:text-orange-300">{suspiciousVotes.length} Flagged Votes</h3>
                        <p className="text-orange-600 dark:text-orange-400 text-sm">Detected by pattern analysis</p>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 font-bold text-gray-800 dark:text-white">Alert Log</div>
                <div className="divide-y divide-gray-100 dark:divide-slate-700">
                    {fraudAlerts.length === 0 && suspiciousVotes.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">System Secure. No anomalies detected.</div>
                    ) : (
                        <>
                            {fraudAlerts.map(alert => (
                                <div key={alert.id} className="p-4 hover:bg-red-50 dark:hover:bg-red-900/10 transition">
                                    <div className="flex justify-between">
                                        <h4 className="font-bold text-red-700 dark:text-red-400 flex items-center gap-2"><AlertTriangle size={16} /> {alert.reason}</h4>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(alert.timestamp).toLocaleString()}</span>
                                    </div>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{alert.details}</p>
                                    <div className="mt-2 text-xs bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 inline-block px-2 py-1 rounded">Risk Level: {alert.riskLevel}</div>
                                </div>
                            ))}
                            {suspiciousVotes.map(vote => {
                                const voter = voters.find(v => v.id === vote.voterId);
                                return (
                                    <div key={vote.id} className="p-4 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition">
                                        <div className="flex justify-between">
                                            <h4 className="font-bold text-orange-700 dark:text-orange-400">Suspicious Vote Pattern</h4>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(vote.timestamp).toLocaleString()}</span>
                                        </div>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                                            Voter: <span className="font-medium">{voter?.firstName || vote.voterId}</span> - High Risk Score detected during session.
                                        </p>
                                        <div className="mt-2 text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 inline-block px-2 py-1 rounded">Score: {vote.riskScore}</div>
                                    </div>
                                );
                            })}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};