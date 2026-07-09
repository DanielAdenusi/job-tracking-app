import express from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import {
	getUserSettingsController,
	updateUserSettingsController,
} from "../controllers/userSettings.controller.js";
import {
	deleteUserAccountController,
	revokeUserSessionsController,
} from "../controllers/account.controller.js";
import {
	deletePushSubscriptionController,
	getPushSubscriptionsController,
	upsertPushSubscriptionController,
} from "../controllers/pushSubscriptions.controller.js";

const router = express.Router();

router.use(requireAuth);

router.get("/settings", getUserSettingsController);
router.put("/settings", updateUserSettingsController);
router.get("/push-subscriptions", getPushSubscriptionsController);
router.post("/push-subscriptions", upsertPushSubscriptionController);
router.delete("/push-subscriptions", deletePushSubscriptionController);
router.delete("/sessions", revokeUserSessionsController);
router.delete("/account", deleteUserAccountController);

export default router;
