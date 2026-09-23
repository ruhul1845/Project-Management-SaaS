import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { checkOrganizationRole } from "../../middleware/checkOrganizationRole";
import { validateRequest } from "../../middleware/validateRequest";
import * as controller from "./organization.controller";
import {
	addMemberSchema,
	createOrganizationSchema,
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
	checkOrganizationRole("OWNER", "MANAGER", "MEMBER", "GUEST"),
	controller.getById,
);
organizationRoutes.patch(
	"/:organizationId",
	checkOrganizationRole("OWNER"),
	validateRequest(updateOrganizationSchema),
	controller.update,
);
organizationRoutes.delete(
	"/:organizationId",
	checkOrganizationRole("OWNER"),
	controller.remove,
);
organizationRoutes.post(
	"/:organizationId/members",
	checkOrganizationRole("OWNER", "MANAGER"),
	validateRequest(addMemberSchema),
	controller.addMember,
);
organizationRoutes.get(
	"/:organizationId/members",
	checkOrganizationRole("OWNER", "MANAGER", "MEMBER", "GUEST"),
	controller.listMembers,
);
organizationRoutes.patch(
	"/:organizationId/members/:memberId",
	checkOrganizationRole("OWNER"),
	validateRequest(updateMemberRoleSchema),
	controller.updateMemberRole,
);
organizationRoutes.delete(
	"/:organizationId/members/:memberId",
	checkOrganizationRole("OWNER", "MANAGER"),
	controller.removeMember,
);
