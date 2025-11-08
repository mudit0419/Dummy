const EncryptedReport = require('../models/encryptedReport');
const PublicKey = require('../models/publicKey');
const Patient = require('../models/patient');
const Doctor = require('../models/doctor');

// Send encrypted report (from patient to doctor)
exports.sendEncryptedReport = async (req, res) => {
  try {
    const {
      recipientId,
      filename,
      contentType,
      encryptedData,
      iv,
      wrappedKey,
      signature,
      metadata
    } = req.body;

    const senderId = req.auth.id;

    // Validate required fields
    if (!recipientId || !filename || !encryptedData || !iv || !wrappedKey || !signature) {
      return res.status(400).json({
        error: 'Missing required fields'
      });
    }

    // Verify sender exists (patient)
    const patient = await Patient.findById(senderId);
    if (!patient) {
      return res.status(404).json({
        error: 'Patient not found'
      });
    }

    // Verify recipient exists (doctor)
    const doctor = await Doctor.findById(recipientId);
    if (!doctor) {
      return res.status(404).json({
        error: 'Doctor not found'
      });
    }

    // Verify doctor has public keys
    const doctorKeys = await PublicKey.findOne({ 
      userId: recipientId, 
      userModel: 'Doctor',
      expiresAt: { $gt: new Date() }
    });

    if (!doctorKeys) {
      return res.status(400).json({
        error: 'Doctor encryption keys not available'
      });
    }

    // Create encrypted report record
    const encryptedReport = new EncryptedReport({
      senderId,
      senderModel: 'Patient',
      recipientId,
      filename,
      contentType: contentType || 'application/pdf',
      encryptedData,
      iv,
      wrappedKey,
      signature,
      metadata: metadata || {}
    });

    await encryptedReport.save();

    // Optionally: Add report reference to patient's reports array
    if (!patient.reports) {
      patient.reports = [];
    }
    patient.reports.push(encryptedReport._id);
    await patient.save();

    res.status(201).json({
      message: 'Encrypted report sent successfully',
      reportId: encryptedReport._id,
      recipientDoctor: {
        id: doctor._id,
        name: doctor.fullName
      }
    });
  } catch (error) {
    console.error('Error sending encrypted report:', error);
    res.status(500).json({
      error: 'Failed to send encrypted report',
      details: error.message
    });
  }
};

// Get encrypted report by ID (for doctor to decrypt)
exports.getEncryptedReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const userId = req.auth.id;

    const report = await EncryptedReport.findById(reportId)
      .populate('senderId', 'fullName email')
      .populate('recipientId', 'fullName email');

    if (!report) {
      return res.status(404).json({
        error: 'Encrypted report not found'
      });
    }

    // Verify user is the recipient
    if (report.recipientId._id.toString() !== userId) {
      return res.status(403).json({
        error: 'Access denied: You are not the recipient of this report'
      });
    }

    // Fetch sender's public key for signature verification
    const senderPublicKey = await PublicKey.findOne({
      userId: report.senderId._id,
      userModel: report.senderModel
    });

    res.status(200).json({
      reportId: report._id,
      sender: {
        id: report.senderId._id,
        name: report.senderId.fullName,
        email: report.senderId.email
      },
      recipient: {
        id: report.recipientId._id,
        name: report.recipientId.fullName,
        email: report.recipientId.email
      },
      filename: report.filename,
      contentType: report.contentType,
      encryptedData: report.encryptedData,
      iv: report.iv,
      wrappedKey: report.wrappedKey,
      signature: report.signature,
      algorithm: report.algorithm,
      metadata: report.metadata,
      senderPublicKey: senderPublicKey ? senderPublicKey.signingPublicKey : null,
      createdAt: report.createdAt
    });
  } catch (error) {
    console.error('Error fetching encrypted report:', error);
    res.status(500).json({
      error: 'Failed to fetch encrypted report',
      details: error.message
    });
  }
};

// List all encrypted reports for a doctor
exports.listEncryptedReports = async (req, res) => {
  try {
    const doctorId = req.auth.id;

    const reports = await EncryptedReport.find({ recipientId: doctorId })
      .populate('senderId', 'fullName email profilePhoto')
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: reports.length,
      reports: reports.map(report => ({
        id: report._id,
        sender: {
          id: report.senderId._id,
          name: report.senderId.fullName,
          email: report.senderId.email,
          photo: report.senderId.profilePhoto
        },
        filename: report.filename,
        contentType: report.contentType,
        uploadedAt: report.metadata.uploadedAt,
        createdAt: report.createdAt
      }))
    });
  } catch (error) {
    console.error('Error listing encrypted reports:', error);
    res.status(500).json({
      error: 'Failed to list encrypted reports',
      details: error.message
    });
  }
};

// Delete encrypted report
exports.deleteEncryptedReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const userId = req.auth.id;

    const report = await EncryptedReport.findById(reportId);

    if (!report) {
      return res.status(404).json({
        error: 'Encrypted report not found'
      });
    }

    // Only sender or recipient can delete
    if (
      report.senderId.toString() !== userId &&
      report.recipientId.toString() !== userId
    ) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }

    await EncryptedReport.findByIdAndDelete(reportId);

    res.status(200).json({
      message: 'Encrypted report deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting encrypted report:', error);
    res.status(500).json({
      error: 'Failed to delete encrypted report',
      details: error.message
    });
  }
};