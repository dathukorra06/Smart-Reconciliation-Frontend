import React from 'react';
import { useParams } from 'react-router-dom';
import AuditTimeline from '../components/AuditTimeline';

const AuditTrail = () => {
  const { recordId } = useParams();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Audit Trail</h1>
        <p className="text-gray-600 mt-2">
          View the complete audit history for record: {recordId}
        </p>
      </div>
      
      <AuditTimeline recordId={recordId} />
    </div>
  );
};

export default AuditTrail;