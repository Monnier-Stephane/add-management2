'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#4ade80', '#60a5fa', '#fbbf24', '#f87171', '#a78bfa'];

export default function StatsDashboard() {
  const [stats, setStats] = useState({
    total: 0,
    attente: 0,
    paye: 0,
    enfants: 0,
    ados: 0,
    adultes: 0,
  });

  useEffect(() => {
    fetch('http://localhost:3001/subscriptions')
      .then(res => res.json())
      .then(data => {
        let total = data.length;
        let attente = 0, paye = 0, enfants = 0, ados = 0, adultes = 0;

        data.forEach((item: any) => {
          // Payment status
          if (item.statutPaiement === 'en attente') attente++;
          if (item.statutPaiement === 'payé') paye++;

          // Categorization by pricing tier
          const tarif = (item.tarif || '').toLowerCase();
          if (tarif.includes('enfant')) enfants++;
          else if (tarif.includes('ado')) ados++;
          else if (tarif.includes('adulte')) adultes++;
        });

        setStats({ total, attente, paye, enfants, ados, adultes });
      });
  }, []);

  const paiementData = [
    { name: 'Pending', value: stats.attente },
    { name: 'Paid', value: stats.paye },
  ];

  const ageData = [
    { name: 'Children', value: stats.enfants },
    { name: 'Teenagers', value: stats.ados },
    { name: 'Adults', value: stats.adultes },
  ];

  return (
    <div className="space-y-8">
      {/* Key metrics tiles */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Total registered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-4xl font-bold text-primary py-2">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Children</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-4xl font-bold text-green-500 py-2">{stats.enfants}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Teenagers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-4xl font-bold text-blue-500 py-2">{stats.ados}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Adults</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-4xl font-bold text-yellow-500 py-2">{stats.adultes}</div>
          </CardContent>
        </Card>
      </div>

      {/* Pie charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Payment status */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={paiementData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  label
                >
                  {paiementData.map((entry, index) => (
                    <Cell key={`cell-paiement-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribution by category */}
        <Card>
          <CardHeader>
            <CardTitle>Distribution by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={ageData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  label
                >
                  {ageData.map((entry, index) => (
                    <Cell key={`cell-age-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}