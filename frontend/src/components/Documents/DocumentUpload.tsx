// // src/components/Documents/DocumentUpload.tsx
// import React, { useState } from 'react';
// import { documentService } from '../../services/document.service';

// interface DocumentUploadProps {
//   projectId?: string;
//   teamId?: string;
//   onUploaded?: () => void;
// }

// const DocumentUpload: React.FC<DocumentUploadProps> = ({
//   projectId,
//   teamId,
//   onUploaded,
// }) => {
//   const [file, setFile] = useState<File | null>(null);
//   const [uploading, setUploading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const f = e.target.files?.[0] || null;
//     setFile(f);
//     setError(null);
//   };

//   const handleUpload = async () => {
//     if (!file) return;
//     setUploading(true);
//     setError(null);
//     try {
//       const formData = new FormData();
//       formData.append('file', file);
//       if (projectId) formData.append('projectId', projectId);
//       if (teamId) formData.append('teamId', teamId);
//       await documentService.upload(formData);
//       setFile(null);
//       onUploaded?.();
//     } catch (err) {
//       setError('Failed to upload document');
//       console.error(err);
//     } finally {
//       setUploading(false);
//     }
//   };

//   return (
//     <div className="space-y-2">
//       <input type="file" onChange={handleFileChange} />
//       <button
//         type="button"
//         onClick={handleUpload}
//         disabled={!file || uploading}
//         className="px-3 py-1 rounded-md bg-blue-600 text-white disabled:opacity-60"
//       >
//         {uploading ? 'Uploading…' : 'Upload'}
//       </button>
//       {error && <p className="text-sm text-red-500">{error}</p>}
//     </div>
//   );
// };

// export default DocumentUpload;
