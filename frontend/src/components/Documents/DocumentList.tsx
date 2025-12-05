// // src/components/Documents/DocumentList.tsx
// import React, { useEffect, useState } from 'react';
// import { documentService } from '../../services/document.service';

// interface DocumentItem {
//   _id: string;
//   name: string;
//   url: string;
//   size?: number;
//   createdAt?: string;
// }

// interface DocumentListProps {
//   projectId?: string;
//   teamId?: string;
// }

// const DocumentList: React.FC<DocumentListProps> = ({ projectId, teamId }) => {
//   const [docs, setDocs] = useState<DocumentItem[]>([]);
//   const [loading, setLoading] = useState(false);

//   const load = async () => {
//     setLoading(true);
//     try {
//       const res = await documentService.getAll({ projectId, teamId });
//       setDocs(res.data || res.documents || []);
//     } catch (err) {
//       console.error('Failed to fetch documents', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     load();
//   }, [projectId, teamId]);

//   if (loading) return <p>Loading documents…</p>;
//   if (!docs.length) return <p>No documents found.</p>;

//   return (
//     <ul className="space-y-2">
//       {docs.map(doc => (
//         <li key={doc._id} className="flex items-center justify-between">
//           <a
//             href={doc.url}
//             target="_blank"
//             rel="noreferrer"
//             className="text-blue-600 hover:underline"
//           >
//             {doc.name}
//           </a>
//           {doc.size && (
//             <span className="text-xs text-slate-500">
//               {(doc.size / 1024).toFixed(1)} KB
//             </span>
//           )}
//         </li>
//       ))}
//     </ul>
//   );
// };

// export default DocumentList;
