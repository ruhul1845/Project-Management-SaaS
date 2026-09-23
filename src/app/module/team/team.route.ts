import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import * as controller from "./team.controller";
import {
	addTeamMemberSchema,
	createTeamSchema,
	updateTeamMemberSchema,
	updateTeamSchema,
} from "./team.validation";

export const teamRoutes = Router();
teamRoutes.use(checkAuth);
teamRoutes.post("/", validateRequest(createTeamSchema), controller.create);
teamRoutes.get("/", controller.list);
teamRoutes.get("/:id", controller.getById);
teamRoutes.patch("/:id", validateRequest(updateTeamSchema), controller.update);
teamRoutes.delete("/:id", controller.remove);
teamRoutes.post(
	"/:id/members",
	validateRequest(addTeamMemberSchema),
	controller.addMember,
);
teamRoutes.patch(
	"/:id/members/:memberId",
	validateRequest(updateTeamMemberSchema),
	controller.updateMember,
);
teamRoutes.delete("/:id/members/:memberId", controller.removeMember);
