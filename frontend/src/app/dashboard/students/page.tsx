'use client'

import React, { useEffect, useState } from "react";

// Sample mock data
const students = [
  { id: 1, nom: "Dupont", prenom: "Jean" },
  { id: 2, nom: "Martin", prenom: "Claire" },
  { id: 3, nom: "Durand", prenom: "Sophie" },
];

interface Student {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  dateDeNaissance: string;
  adresse: string;
  ville: string;
  codePostal: string;
  tarif: string;
  dateInscription: string;
  statutPaiement: 'payé' | 'en attente' | 'annulé';
  remarques?: string;
}

const StudentsPage = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:3001/subscriptions');
        
        if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status}`);
        }
        
        const data = await response.json();
        setStudents(data);
      } catch (err) {
        console.error('Error fetching students:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  // Group students by pricing tier
  const studentsByTarif = students.reduce((acc, student) => {
    const tarif = student.tarif || 'Not defined';
    if (!acc[tarif]) {
      acc[tarif] = [];
    }
    acc[tarif].push(student);
    return acc;
  }, {} as Record<string, Student[]>);

  // Get unique pricing tiers
  const tarifs = Object.keys(studentsByTarif).sort();

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Loading students...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Error</h1>
        <p>Error loading students: {error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Students list by pricing tier</h1>
      
      {tarifs.map((tarif) => (
        <div key={tarif} style={{ marginBottom: 32 }}>
          <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: 'bold', 
            marginBottom: 16,
            padding: '8px 16px',
            backgroundColor: '#f3f4f6',
            borderRadius: '8px'
          }}>
            Pricing: {tarif} ({studentsByTarif[tarif].length} student(s))
          </h2>
          
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb' }}>
                <th style={{ border: "1px solid #ccc", padding: 8 }}>Last Name</th>
                <th style={{ border: "1px solid #ccc", padding: 8 }}>First Name</th>
                <th style={{ border: "1px solid #ccc", padding: 8 }}>Email</th>
                <th style={{ border: "1px solid #ccc", padding: 8 }}>Phone</th>
                <th style={{ border: "1px solid #ccc", padding: 8 }}>City</th>
                <th style={{ border: "1px solid #ccc", padding: 8 }}>Status</th>
                <th style={{ border: "1px solid #ccc", padding: 8 }}>Registration Date</th>
              </tr>
            </thead>
            <tbody>
              {studentsByTarif[tarif].map((eleve) => (
                <tr key={eleve._id} style={{ backgroundColor: '#ffffff' }}>
                  <td style={{ border: "1px solid #ccc", padding: 8 }}>{eleve.nom}</td>
                  <td style={{ border: "1px solid #ccc", padding: 8 }}>{eleve.prenom}</td>
                  <td style={{ border: "1px solid #ccc", padding: 8 }}>{eleve.email}</td>
                  <td style={{ border: "1px solid #ccc", padding: 8 }}>{eleve.telephone}</td>
                  <td style={{ border: "1px solid #ccc", padding: 8 }}>{eleve.ville}</td>
                  <td style={{ border: "1px solid #ccc", padding: 8 }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      backgroundColor: 
                        eleve.statutPaiement === 'payé' ? '#dcfce7' :
                        eleve.statutPaiement === 'en attente' ? '#fef3c7' : '#fee2e2',
                      color: 
                        eleve.statutPaiement === 'payé' ? '#166534' :
                        eleve.statutPaiement === 'en attente' ? '#92400e' : '#991b1b'
                    }}>
                      {eleve.statutPaiement}
                    </span>
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: 8 }}>
                    {new Date(eleve.dateInscription).toLocaleDateString('fr-FR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
      
      {tarifs.length === 0 && (
        <p style={{ textAlign: 'center', color: '#6b7280', padding: 32 }}>
          No students found
        </p>
      )}
    </div>
  );
};

export default StudentsPage;
