import React from 'react';
import { useRealtime } from '../../contexts/RealtimeContext';
import { AlertTriangle, ShieldAlert } from 'lucide-react';

export const InvalidVotes = () => {
  const { votes, fraudAlerts, voters } = useRealtime();

  // Mocking identification of high risk votes (riskScore > 0.7)
  const suspiciousVotes = votes.filter(v => (v.riskScore || 0) > 0.7);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Fraud Detection & Invalid Votes</h1>
        <p className="text-gray-500">Monitor suspicious activities and AI flags.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-red-50 border border-red-200 p-6 rounded-xl flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-full text-red-600"><AlertTriangle /></div>
            <div>
                <h3 className="text-lg font-bold text-red-800">{fraudAlerts.length} High Risk Alerts</h3>
                <p className="text-red-600 text-sm">Requires immediate attention</p>
            </div>
          </div>
           <div className="bg-orange-50 border border-orange-200 p-6 rounded-xl flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-full text-orange-600"><ShieldAlert /></div>
            <div>
                <h3 className="text-lg font-bold text-orange-800">{suspiciousVotes.length} Flagged Votes</h3>
                <p className="text-orange-600 text-sm">Detected by pattern analysis</p>
            </div>
          </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b font-bold text-gray-800">Alert Log</div>
        <div className="divide-y">
            {fraudAlerts.length === 0 && suspiciousVotes.length === 0 ? (
                <div className="p-8 text-center text-gray-500">System Secure. No anomalies detected.</div>
            ) : (
                <>
                {fraudAlerts.map(alert => (
                    <div key={alert.id} className="p-4 hover:bg-red-50 transition">
                        <div className="flex justify-between">
                            <h4 className="font-bold text-red-700 flex items-center gap-2"><AlertTriangle size={16}/> {alert.reason}</h4>
                            <span className="text-xs text-gray-500">{new Date(alert.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-gray-700 mt-1">{alert.details}</p>
                        <div className="mt-2 text-xs bg-red-100 text-red-800 inline-block px-2 py-1 rounded">Risk Level: {alert.riskLevel}</div>
                    </div>
                ))}
                {suspiciousVotes.map(vote => {
                    const voter = voters.find(v => v.id === vote.voterId);
                    return (
                        <div key={vote.id} className="p-4 hover:bg-orange-50 transition">
                            <div className="flex justify-between">
                                <h4 className="font-bold text-orange-700">Suspicious Vote Pattern</h4>
                                <span className="text-xs text-gray-500">{new Date(vote.timestamp).toLocaleString()}</span>
                            </div>
                            <p className="text-sm text-gray-700 mt-1">
                                Voter: <span className="font-medium">{voter?.firstName || vote.voterId}</span> - High Risk Score detected during session.
                            </p>
                            <div className="mt-2 text-xs bg-orange-100 text-orange-800 inline-block px-2 py-1 rounded">Score: {vote.riskScore}</div>
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