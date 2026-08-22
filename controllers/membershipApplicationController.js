const mongoose = require('mongoose');
const MembershipApplication = require('../models/MembershipApplication');
const Member = require('../models/Member');
const Admin = require('../models/Admin');
const { createMember, serializeMemberListItem } = require('../services/memberService');
const { serializeApplicationList, serializeApplicationDetail, toMemberData } = require('../services/membershipApplicationService');
const { validateApplication, meaningfulText } = require('../validators/membershipApplicationValidator');

const wrap = (fn) => async (req, res, next) => { try { await fn(req, res); } catch (e) { next(e); } };
const validId = (id) => mongoose.Types.ObjectId.isValid(id);
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const activeStatuses = ['pending', 'under-review', 'more-info-required'];

const submit = wrap(async (req, res) => {
  const { errors, value } = validateApplication(req.body);
  if (errors.length) return res.status(400).json({ success: false, message: errors.join('; ') });
  const duplicates = [{ 'contact.phone': value.contact.phone }];
  if (value.contact.email) duplicates.push({ 'contact.email': value.contact.email });
  if (await MembershipApplication.exists({ status: { $in: activeStatuses }, $or: duplicates }))
    return res.status(409).json({ success: false, message: 'An active application already exists for these contact details' });
  const app = await MembershipApplication.create(value);
  return res.status(201).json({ success: true, message: 'Membership application submitted successfully', application: { id: app.id, status: app.status, createdAt: app.createdAt } });
});

const list = wrap(async (req, res) => {
  const page = Number(req.query.page || 1), limit = Number(req.query.limit || 20);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) return res.status(400).json({ success: false, message: 'Invalid pagination values' });
  const filter = {};
  if (req.query.status) { if (!['pending','under-review','more-info-required','approved','rejected','archived'].includes(req.query.status)) return res.status(400).json({success:false,message:'Invalid status filter'}); filter.status=req.query.status; }
  if (req.query.membershipType) { if (!['general','expatriate','youth','honorary'].includes(req.query.membershipType)) return res.status(400).json({success:false,message:'Invalid membership type'}); filter['membership.type']=req.query.membershipType; }
  if (req.query.country) filter['contact.country'] = new RegExp(`^${escapeRegex(String(req.query.country).trim())}$`, 'i');
  if (req.query.search) { const r=new RegExp(escapeRegex(String(req.query.search).trim()),'i'); filter.$or=[{fullName:r},{'contact.phone':r},{'contact.email':r}]; }
  const sorts={newest:{createdAt:-1},oldest:{createdAt:1}}; if(!sorts[req.query.sort||'newest']) return res.status(400).json({success:false,message:'Invalid sort'});
  const [apps,total]=await Promise.all([MembershipApplication.find(filter).sort(sorts[req.query.sort||'newest']).skip((page-1)*limit).limit(limit).lean(),MembershipApplication.countDocuments(filter)]);
  res.json({success:true,data:apps.map(serializeApplicationList),pagination:{page,limit,total,pages:Math.ceil(total/limit)}});
});

const stats = wrap(async (req,res)=>{const statuses=['pending','under-review','more-info-required','approved','rejected'];const [total,...counts]=await Promise.all([MembershipApplication.countDocuments(),...statuses.map(status=>MembershipApplication.countDocuments({status}))]);res.json({success:true,data:{total,pending:counts[0],underReview:counts[1],moreInfoRequired:counts[2],approved:counts[3],rejected:counts[4]}});});
const detail=wrap(async(req,res)=>{if(!validId(req.params.id))return res.status(400).json({success:false,message:'Invalid application ID'});const app=await MembershipApplication.findById(req.params.id);if(!app)return res.status(404).json({success:false,message:'Application not found'});res.json({success:true,data:serializeApplicationDetail(app)});});
const review=wrap(async(req,res)=>{const app=validId(req.params.id)&&await MembershipApplication.findById(req.params.id);if(!app)return res.status(404).json({success:false,message:'Application not found'});if(['approved','rejected'].includes(app.status))return res.status(409).json({success:false,message:'Finalized application cannot be reviewed'});app.status='under-review';app.reviewedBy=req.admin._id;app.reviewedAt=new Date();await app.save();res.json({success:true,data:serializeApplicationDetail(app)});});
const assign=wrap(async(req,res)=>{if(!validId(req.body.adminId))return res.status(400).json({success:false,message:'Invalid reviewer'});const reviewer=await Admin.findOne({_id:req.body.adminId,status:'active'});if(!reviewer)return res.status(400).json({success:false,message:'Reviewer must be an active Admin'});const app=validId(req.params.id)&&await MembershipApplication.findById(req.params.id);if(!app)return res.status(404).json({success:false,message:'Application not found'});app.assignedReviewer=reviewer._id;await app.save();res.json({success:true,data:serializeApplicationDetail(app)});});
const requestInfo=wrap(async(req,res)=>{if(!meaningfulText(req.body.reviewNotes))return res.status(400).json({success:false,message:'A meaningful review note is required'});const app=validId(req.params.id)&&await MembershipApplication.findById(req.params.id);if(!app)return res.status(404).json({success:false,message:'Application not found'});if(['approved','rejected'].includes(app.status))return res.status(409).json({success:false,message:'Finalized application cannot be changed'});app.status='more-info-required';app.reviewNotes=req.body.reviewNotes.trim();app.reviewedBy=req.admin._id;app.reviewedAt=new Date();await app.save();res.json({success:true,data:serializeApplicationDetail(app)});});

const approve=wrap(async(req,res)=>{if(!validId(req.params.id))return res.status(400).json({success:false,message:'Invalid application ID'});let result;const session=await mongoose.startSession();try{await session.withTransaction(async()=>{const app=await MembershipApplication.findById(req.params.id).session(session);if(!app)throw Object.assign(new Error('Application not found'),{status:404});if(app.status==='approved'){result={already:true,app};return;}if(app.status==='rejected')throw Object.assign(new Error('Rejected application cannot be approved'),{status:409});const duplicate=await Member.findOne({$or:[{'contact.phone':app.contact.phone},...(app.contact.email?[{'contact.email':app.contact.email}]:[])]}).session(session);if(duplicate)throw Object.assign(new Error('A Member already exists for these contact details'),{status:409});const member=await createMember(toMemberData(app),req.admin._id,{session});app.status='approved';app.approvedMember=member._id;app.approvedAt=new Date();app.reviewedBy=req.admin._id;app.reviewedAt=new Date();await app.save({session});result={app,member};});}catch(e){if(e.status)return res.status(e.status).json({success:false,message:e.message});throw e;}finally{await session.endSession();}if(result.already)return res.status(200).json({success:true,message:'Application is already approved',application:serializeApplicationDetail(result.app)});res.json({success:true,message:'Application approved',application:serializeApplicationDetail(result.app),member:serializeMemberListItem(result.member)});});
const reject=wrap(async(req,res)=>{if(!meaningfulText(req.body.rejectionReason))return res.status(400).json({success:false,message:'A meaningful rejection reason is required'});const app=validId(req.params.id)&&await MembershipApplication.findById(req.params.id);if(!app)return res.status(404).json({success:false,message:'Application not found'});if(['approved','rejected'].includes(app.status))return res.status(409).json({success:false,message:'Finalized application cannot be rejected'});app.status='rejected';app.rejectionReason=req.body.rejectionReason.trim();app.reviewedBy=req.admin._id;app.reviewedAt=new Date();await app.save();res.json({success:true,data:serializeApplicationDetail(app)});});
const archive=wrap(async(req,res)=>{const app=validId(req.params.id)&&await MembershipApplication.findById(req.params.id);if(!app)return res.status(404).json({success:false,message:'Application not found'});app.status='archived';app.reviewedBy=req.admin._id;app.reviewedAt=new Date();await app.save();res.json({success:true,data:serializeApplicationDetail(app)});});
module.exports={submit,list,stats,detail,review,assign,requestInfo,approve,reject,archive};
