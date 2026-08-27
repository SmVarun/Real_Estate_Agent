import {
  createLeadSchema,
  updateLeadSchema,
  updateLeadStatusSchema,
  assignLeadSchema,
  addNoteSchema,
  leadIdParamSchema,
  listLeadsQuerySchema,
} from "../validator/lead.validator.js";

import {
  createLead,
  listLeads,
  getLeadById,
  updateLead,
  updateLeadStatus,
  assignLead,
  addNote,
  deleteLead,
  getLeadStats,
  getRecentActivity,
} from "../services/lead.service.js";

/*
 * HTTP edge for leads. Validate, delegate, shape the response —
 * every visibility and authorization decision lives in the service
 * and in the route guards.
 */

export const createLeadHandler = async (req, res, next) => {
  try {
    const data = createLeadSchema.parse(req.body);

    const lead = await createLead({ data, actor: req.user });

    return res.status(201).json({
      success: true,
      message: "Lead created successfully",
      data: lead,
    });
  } catch (error) {
    next(error);
  }
};

export const listLeadsHandler = async (req, res, next) => {
  try {
    const filters = listLeadsQuerySchema.parse(req.query);

    const { leads, pagination } = await listLeads({
      filters,
      actor: req.user,
    });

    return res.status(200).json({
      success: true,
      data: leads,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const getLeadHandler = async (req, res, next) => {
  try {
    const { id } = leadIdParamSchema.parse(req.params);

    const lead = await getLeadById({ leadId: id, actor: req.user });

    return res.status(200).json({
      success: true,
      data: lead,
    });
  } catch (error) {
    next(error);
  }
};

export const updateLeadHandler = async (req, res, next) => {
  try {
    const { id } = leadIdParamSchema.parse(req.params);
    const data = updateLeadSchema.parse(req.body);

    const lead = await updateLead({ leadId: id, data, actor: req.user });

    return res.status(200).json({
      success: true,
      message: "Lead updated successfully",
      data: lead,
    });
  } catch (error) {
    next(error);
  }
};

export const updateLeadStatusHandler = async (req, res, next) => {
  try {
    const { id } = leadIdParamSchema.parse(req.params);
    const { status } = updateLeadStatusSchema.parse(req.body);

    const lead = await updateLeadStatus({
      leadId: id,
      status,
      actor: req.user,
    });

    return res.status(200).json({
      success: true,
      message: "Lead status updated successfully",
      data: lead,
    });
  } catch (error) {
    next(error);
  }
};

export const assignLeadHandler = async (req, res, next) => {
  try {
    const { id } = leadIdParamSchema.parse(req.params);
    const { assignedTo } = assignLeadSchema.parse(req.body);

    const lead = await assignLead({
      leadId: id,
      assignedTo,
      actor: req.user,
    });

    return res.status(200).json({
      success: true,
      message: assignedTo
        ? "Lead assigned successfully"
        : "Lead unassigned successfully",
      data: lead,
    });
  } catch (error) {
    next(error);
  }
};

export const addNoteHandler = async (req, res, next) => {
  try {
    const { id } = leadIdParamSchema.parse(req.params);
    const { text } = addNoteSchema.parse(req.body);

    const lead = await addNote({ leadId: id, text, actor: req.user });

    return res.status(201).json({
      success: true,
      message: "Note added successfully",
      data: lead,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteLeadHandler = async (req, res, next) => {
  try {
    const { id } = leadIdParamSchema.parse(req.params);

    await deleteLead({ leadId: id, actor: req.user });

    return res.status(200).json({
      success: true,
      message: "Lead deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getLeadStatsHandler = async (req, res, next) => {
  try {
    const stats = await getLeadStats({ actor: req.user });

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

export const getRecentActivityHandler = async (req, res, next) => {
  try {
    const activity = await getRecentActivity({ actor: req.user });

    return res.status(200).json({
      success: true,
      data: activity,
    });
  } catch (error) {
    next(error);
  }
};
