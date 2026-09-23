import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { checkOrganizationRole } from "../../middleware/checkOrganizationRole";
import { validateRequest } from "../../middleware/validateRequest";
import * as controller from "./organization.controller";
import {
	addMemberSchema,
	createOrganizationSchema,
	listMembersSchema,
	organizationIdParamsSchema,
	organizationMemberParamsSchema,
	updateMemberRoleSchema,
	updateOrganizationSchema,
} from "./organization.validation";

export const organizationRoutes = Router();
organizationRoutes.use(checkAuth);
organizationRoutes.post(
	"/",
	validateRequest(createOrganizationSchema),
	controller.create,
);
organizationRoutes.get("/mine", controller.getMine);
organizationRoutes.get(
	"/:organizationId",
	validateRequest(organizationIdParamsSchema),
	checkOrganizationRole("OWNER", "MANAGER", "MEMBER", "GUEST"),
	controller.getById,
);
organizationRoutes.patch(
	"/:organizationId",
	validateRequest(updateOrganizationSchema),
	checkOrganizationRole("OWNER"),
	controller.update,
);
organizationRoutes.delete(
	"/:organizationId",
	validateRequest(organizationIdParamsSchema),
	checkOrganizationRole("OWNER"),
	controller.remove,
);
organizationRoutes.post(
	"/:organizationId/members",
	validateRequest(addMemberSchema),
	checkOrganizationRole("OWNER", "MANAGER"),
	controller.addMember,
);
organizationRoutes.get(
	"/:organizationId/members",
	validateRequest(listMembersSchema),
	checkOrganizationRole("OWNER", "MANAGER", "MEMBER", "GUEST"),
	controller.listMembers,
);
organizationRoutes.patch(
	"/:organizationId/members/:memberId",
	validateRequest(updateMemberRoleSchema),
	checkOrganizationRole("OWNER"),
	controller.updateMemberRole,
);
organizationRoutes.delete(
	"/:organizationId/members/:memberId",
	validateRequest(organizationMemberParamsSchema),
	checkOrganizationRole("OWNER", "MANAGER"),
	controller.removeMember,
);
