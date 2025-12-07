// backend/src/controllers/document.controller.ts
import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import Document from '../models/Document.model';
import { createNotification, notifyProject } from '../utils/notificationEngine';

// ============ UPLOAD DOCUMENT ============
export async function uploadDocument(req: Request, res: Response) {
  try {
    const { projectId, tags } = req.body;
    const userId = (req as any).userId;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    // mimetype looks like "application/pdf" or "image/png"
    const [type, subtype] = (req.file.mimetype || 'application/octet-stream').split('/');
    const fileType = subtype || type; // e.g. "pdf", "png"
    const url = `/uploads/${req.file.filename}`;

    const normalizedTags: string[] =
      typeof tags === 'string'
        ? tags
            .split(',')
            .map(t => t.trim())
            .filter(Boolean)
        : Array.isArray(tags)
        ? (tags as string[]).map(t => t.trim()).filter(Boolean)
        : [];

    const document = await Document.create({
      projectId,
      filename: req.file.filename,
      originalName: req.file.originalname,
      fileType,
      size: req.file.size,
      url,
      uploadedBy: userId,
      tags: normalizedTags,
    });

    // ✅ NOTIFY PROJECT TEAM ABOUT NEW DOCUMENT (exclude uploader) - FIXED
    await notifyProject(projectId, {
      type: 'project',
      action: 'updated',  // Use existing enum value
      title: 'New document uploaded',
      message: `"${document.originalName}" was uploaded to the project`,
      entityType: 'document',
      entityId: document._id.toString(),
      icon: 'file',
      color: '#10b981',
    }, userId);

    res.status(201).json(document);
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
}

// ============ GET PROJECT DOCUMENTS ============
export async function getProjectDocuments(req: Request, res: Response) {
  try {
    const { projectId } = req.params;

    const documents = await Document.find({ projectId })
      .populate('uploadedBy', 'name email')
      .sort({ uploadedAt: -1 });

    res.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
}

// ============ DELETE DOCUMENT ============
export async function deleteDocument(req: Request, res: Response) {
  try {
    const { documentId } = req.params;
    const userId = (req as any).userId;

    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (document.uploadedBy.toString() !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const filePath = path.join(process.cwd(), 'uploads', document.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    const projectId = document.projectId;
    const documentName = document.originalName;

    await Document.findByIdAndDelete(documentId);

    // ✅ NOTIFY PROJECT TEAM ABOUT DOCUMENT DELETION (exclude deleter) - FIXED
    if (projectId) {
      await notifyProject(projectId.toString(), {
        type: 'project',
        action: 'updated',  // Use existing enum value
        title: 'Document deleted',
        message: `"${documentName}" has been removed from the project`,
        entityType: 'document',
        entityId: documentId,
        icon: 'file-x',
        color: '#ef4444',
      }, userId);
    }

    res.json({ success: true, message: 'Document deleted' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
}

// ============ DOWNLOAD DOCUMENT ============
export async function downloadDocument(req: Request, res: Response) {
  try {
    const { documentId } = req.params;

    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const filePath = path.join(process.cwd(), 'uploads', document.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.download(filePath, document.originalName);
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({ error: 'Failed to download document' });
  }
}
