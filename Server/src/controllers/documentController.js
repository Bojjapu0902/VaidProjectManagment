const fs = require("fs");
const path = require("path");
const Document = require("../models/Document");
const Project = require("../models/Project");
const { notifyMany } = require("../services/notification.service");

const uploadsDir = process.env.NODE_ENV === "production"
  ? "/opt/render/project/src/uploads"
  : path.join(__dirname, "../../uploads");

exports.getDocumentsByProject = async (req, res, next) => {
  try {
    const { clientVisibleOnly, category, stageNumber } = req.query;
    const filter = { projectId: req.params.id };

    if (clientVisibleOnly === "true" || req.user.role === "client") {
      filter.isClientVisible = true;
    }
    if (category) filter.category = category;
    if (stageNumber) filter.stageNumber = Number(stageNumber);

    const docs = await Document.find(filter).sort({ createdAt: -1 });
    res.json(docs);
  } catch (err) {
    next(err);
  }
};

exports.getDocumentById = async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.docId);
    if (!doc) return res.status(404).json({ message: "Document not found" });
    if (req.user.role === "client" && !doc.isClientVisible) {
      return res.status(403).json({ message: "Forbidden" });
    }
    res.json(doc);
  } catch (err) {
    next(err);
  }
};

exports.uploadDocument = async (req, res, next) => {
  try {
    const { stageNumber, name, category, isClientVisible, version } = req.body;

    const file = req.file;
    const filePath = file ? `/uploads/${file.filename}` : null;
    const fileSize = file ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : req.body.fileSize;
    const fileType = file ? file.originalname.split(".").pop() : req.body.fileType;

    const doc = await Document.create({
      projectId: req.params.id,
      stageNumber: Number(stageNumber),
      name,
      category,
      filePath,
      fileSize,
      fileType,
      version: version ? Number(version) : 1,
      isClientVisible: isClientVisible === "true" || isClientVisible === true,
      uploadedBy: req.user.name,
      uploadedById: req.user._id,
    });

    const project = await Project.findById(req.params.id);
    if (project && doc.isClientVisible) {
      await notifyMany([project.clientId, ...project.team.map((m) => m.userId)], {
        projectId: project._id,
        type: "document_uploaded",
        title: "New document uploaded",
        message: `${req.user.name} uploaded "${doc.name}" to ${project.title}.`,
      });
    }

    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
};

// PUT /api/v1/projects/:id/documents/:docId — metadata only (name,
// category, visibility). Use the /version endpoint to replace the file.
exports.updateDocument = async (req, res, next) => {
  try {
    const { name, category, isClientVisible, description } = req.body;
    const update = { name, category, description };
    if (isClientVisible !== undefined) update.isClientVisible = isClientVisible === "true" || isClientVisible === true;
    Object.keys(update).forEach((k) => update[k] === undefined && delete update[k]);

    const doc = await Document.findByIdAndUpdate(req.params.docId, update, { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ message: "Document not found" });
    res.json(doc);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/v1/projects/:id/documents/:docId
exports.deleteDocument = async (req, res, next) => {
  try {
    const doc = await Document.findByIdAndDelete(req.params.docId);
    if (!doc) return res.status(404).json({ message: "Document not found" });

    // Best-effort local-disk cleanup; never let a filesystem miss fail the request.
    if (doc.filePath) {
      const absolute = path.join(uploadsDir, path.basename(doc.filePath));
      fs.unlink(absolute, () => {});
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/projects/:id/documents/:docId/version — upload a new
// version of an existing document; the prior file/version is archived into
// previousVersions[] per the spec's version-control logic (Section 15).
exports.uploadNewVersion = async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.docId);
    if (!doc) return res.status(404).json({ message: "Document not found" });

    const file = req.file;
    if (!file) return res.status(400).json({ message: "A file is required to upload a new version" });

    doc.previousVersions.push({
      version: doc.version,
      filePath: doc.filePath,
      fileSize: doc.fileSize,
      fileType: doc.fileType,
      uploadedBy: doc.uploadedBy,
      uploadedById: doc.uploadedById,
    });

    doc.version += 1;
    doc.filePath = `/uploads/${file.filename}`;
    doc.fileSize = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
    doc.fileType = file.originalname.split(".").pop();
    doc.uploadedBy = req.user.name;
    doc.uploadedById = req.user._id;
    doc.isApproved = false;

    await doc.save();
    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/projects/:id/documents/:docId/versions
exports.getDocumentVersions = async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.docId);
    if (!doc) return res.status(404).json({ message: "Document not found" });

    res.json({
      current: { version: doc.version, filePath: doc.filePath, fileSize: doc.fileSize, fileType: doc.fileType },
      previous: doc.previousVersions,
    });
  } catch (err) {
    next(err);
  }
};
