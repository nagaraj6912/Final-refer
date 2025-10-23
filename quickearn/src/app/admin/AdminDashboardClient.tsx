'use client';

import { App } from '@/types';
import { useState } from 'react';

// Define types for this page
type Click = {
  id: string;
  app: string;
  user_id: string;
  timestamp: string;
  status: string;
};

interface AdminDashboardProps {
  initialApps: App[];
  initialClicks: Click[];
}

export default function AdminDashboardClient({ initialApps, initialClicks }: AdminDashboardProps) {
  const [clicks, setClicks] = useState<Click[]>(initialClicks);
  const [apps, setApps] = useState<App[]>(initialApps);
  const [message, setMessage] = useState('');

  const handleRewardSync = async (click: Click, newStatus: 'confirmed' | 'rejected') => {
    setMessage('Processing...');
    
    // Call the Admin API route we built
    const response = await fetch('/api/sync-rewards', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // This is the secure admin key
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_API_KEY}` // Use a public env var for this client-side call, or move to server action
      },
      body: JSON.stringify({
        clickId: click.id,
        userId: click.user_id,
        status: newStatus,
      }),
    });

    const result = await response.json();

    if (response.ok) {
      setMessage(`Success: ${result.message}`);
      // Update the UI
      setClicks(clicks.map(c => c.id === click.id ? { ...c, status: newStatus } : c));
    } else {
      setMessage(`Error: ${result.error}`);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>

      {message && (
        <div className="alert alert-info mb-6">
          <div>
            <span>{message}</span>
          </div>
        </div>
      )}

      {/* Clicks Management Table */}
      <h2 className="text-2xl font-bold mb-4">Recent Clicks (Pending)</h2>
      <div className="overflow-x-auto bg-base-100 rounded-lg shadow">
        <table className="table w-full">
          <thead>
            <tr>
              <th>App</th>
              <th>User ID</th>
              <th>Status</th>
              <th>Timestamp</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {clicks.filter(c => c.status === 'pending').map((click) => (
              <tr key={click.id}>
                <td>{click.app}</td>
                <td>{click.user_id.substring(0, 8)}...</td>
                <td><span className="badge badge-warning">{click.status}</span></td>
                <td>{new Date(click.timestamp).toLocaleString()}</td>
                <td className="space-x-2">
                  <button 
                    className="btn btn-success btn-xs"
                    onClick={() => handleRewardSync(click, 'confirmed')}
                  >
                    Approve
                  </button>
                  <button 
                    className="btn btn-error btn-xs"
                    onClick={() => handleRewardSync(click, 'rejected')}
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* TODO: Add UI for managing 'Referstore' apps */}
      {/* <h2 className="text-2xl font-bold mt-12 mb-4">Manage Apps</h2> */}
      {/* ... A form to add/edit apps would go here ... */}
    </div>
  );
}